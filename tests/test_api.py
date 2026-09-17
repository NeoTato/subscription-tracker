import pytest
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
import schemas
import utils
import notifications
from main import app

# Test database
TEST_DB_URL = "sqlite:///./test_subsentry.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[models.get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    models.Base.metadata.create_all(bind=test_engine)
    yield
    models.Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


def test_empty_database_summary_and_alerts(client):
    """Ensure summary and alerts handle empty database without crashing (no IndexError, no NoneType error)."""
    summary_res = client.get("/api/v1/analytics/summary")
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert summary_data["monthly_total"] == 0.0
    assert summary_data["sub_count"] == 0
    assert summary_data["next_payment"] is None

    alerts_res = client.get("/api/v1/analytics/alerts")
    assert alerts_res.status_code == 200
    alerts_data = alerts_res.json()
    assert alerts_data["total_alerts"] == 0
    assert len(alerts_data["due_soon"]) == 0


def test_subscription_crud(client):
    """Test full CRUD lifecycle for subscriptions."""
    # 1. Create
    payload = {
        "name": "Netflix",
        "price": 549.0,
        "currency": "PHP",
        "billing_cycle": "monthly",
        "next_due_date": "2026-10-15",
        "platform": "Netflix Inc.",
        "plan_type": "family",
        "category": "Entertainment",
        "payment_method": "Maya",
        "is_paid_by_me": True,
        "remind_to_cancel": True,
    }
    create_res = client.post("/api/v1/subscriptions", json=payload)
    assert create_res.status_code == 201
    created_sub = create_res.json()
    sub_id = created_sub["id"]
    assert created_sub["name"] == "Netflix"
    assert created_sub["remind_to_cancel"] is True
    assert created_sub["payment_method"] == "Maya"

    # 2. Get single
    get_res = client.get(f"/api/v1/subscriptions/{sub_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Netflix"

    # 3. List
    list_res = client.get("/api/v1/subscriptions")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 4. Filter
    filter_res = client.get("/api/v1/subscriptions?category=Entertainment")
    assert len(filter_res.json()) == 1
    filter_none = client.get("/api/v1/subscriptions?category=Productivity")
    assert len(filter_none.json()) == 0

    # 5. Patch (Partial update)
    patch_res = client.patch(f"/api/v1/subscriptions/{sub_id}", json={"price": 599.0, "remind_to_cancel": False})
    assert patch_res.status_code == 200
    assert patch_res.json()["price"] == 599.0
    assert patch_res.json()["remind_to_cancel"] is False

    # 6. Delete
    del_res = client.delete(f"/api/v1/subscriptions/{sub_id}")
    assert del_res.status_code == 204

    # 7. Verify deletion
    get_again = client.get(f"/api/v1/subscriptions/{sub_id}")
    assert get_again.status_code == 404


def test_alerts_logic_and_none_student_expiry(client):
    """Test that due-soon, cancellation, and student expiry work seamlessly."""
    today = date.today()
    due_in_3_days = today + timedelta(days=3)
    student_expiring = today + timedelta(days=15)

    # Sub 1: Due soon + Remind to cancel + NO student expiry (tests None check safety)
    client.post("/api/v1/subscriptions", json={
        "name": "Spotify",
        "price": 149.0,
        "currency": "PHP",
        "billing_cycle": "monthly",
        "next_due_date": due_in_3_days.isoformat(),
        "remind_to_cancel": True,
        "student_status_expiry": None,
    })

    # Sub 2: Student plan expiring soon
    client.post("/api/v1/subscriptions", json={
        "name": "GitHub Copilot",
        "price": 10.0,
        "currency": "USD",
        "billing_cycle": "monthly",
        "next_due_date": (today + timedelta(days=20)).isoformat(),
        "remind_to_cancel": False,
        "student_status_expiry": student_expiring.isoformat(),
    })

    alerts_res = client.get("/api/v1/analytics/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()

    assert len(alerts["due_soon"]) == 1
    assert alerts["due_soon"][0]["name"] == "Spotify"
    assert alerts["due_soon"][0]["days_left"] == 3

    assert len(alerts["cancellation_reminders"]) == 1
    assert alerts["cancellation_reminders"][0]["name"] == "Spotify"

    assert len(alerts["student_expiry_reminders"]) == 1
    assert alerts["student_expiry_reminders"][0]["name"] == "GitHub Copilot"


def test_advance_overdue_due_dates():
    """Verify that advance_due_dates automatically rolls over past due dates."""
    db = TestingSessionLocal()
    try:
        today = date.today()
        overdue_sub = models.Subscription(
            name="Old Service",
            price=100.0,
            billing_cycle="monthly",
            next_due_date=today - timedelta(days=45),  # 45 days overdue
        )
        db.add(overdue_sub)
        db.commit()

        advanced_count = utils.advance_due_dates(db)
        assert advanced_count == 1

        db.refresh(overdue_sub)
        assert overdue_sub.next_due_date >= today
    finally:
        db.close()


def test_notifications_formatting():
    """Verify notification format generation."""
    due_soon = [
        {"name": "YouTube Premium", "price": 159.0, "currency": "PHP", "due_date": date(2026, 10, 1), "billing_cycle": "monthly"}
    ]
    cancellations = [
        {"name": "Free Trial App", "due_date": date(2026, 10, 2)}
    ]
    msg = notifications.format_message(due_soon, cancellations)
    assert "YouTube Premium" in msg
    assert "Free Trial App" in msg
    assert "SubSentry" in msg


def test_legacy_routes_compatibility(client):
    """Ensure legacy routes (/summary, /alerts, /table) continue functioning."""
    res_summary = client.get("/summary")
    assert res_summary.status_code == 200
    res_alerts = client.get("/alerts")
    assert res_alerts.status_code == 200
    res_table = client.get("/table")
    assert res_table.status_code == 200


def test_utils_cost_normalization():
    """Verify cycle conversions and foreign exchange math."""
    assert utils.to_monthly(120.0, "yearly") == 10.0
    assert utils.to_monthly(100.0, "monthly") == 100.0
    assert round(utils.to_monthly(10.0, "weekly"), 2) == 43.33
    assert round(utils.to_monthly(1.0, "daily"), 2) == 30.42

    assert utils.to_PHP(100.0, "PHP") == 100.0
    assert utils.to_PHP(10.0, "USD") == 585.0


def test_paused_subscription_lifecycle(client):
    """Verify that paused subscriptions do not contribute to spending totals or trigger alerts."""
    today = date.today()
    due_in_2_days = today + timedelta(days=2)

    # 1. Create an active subscription
    sub_res = client.post("/api/v1/subscriptions", json={
        "name": "Gym Membership",
        "price": 2000.0,
        "currency": "PHP",
        "billing_cycle": "monthly",
        "next_due_date": due_in_2_days.isoformat(),
        "status": "active",
        "is_paid_by_me": True,
        "remind_to_cancel": True,
    })
    assert sub_res.status_code == 201
    sub_id = sub_res.json()["id"]

    # Active summary check
    sum_active = client.get("/api/v1/analytics/summary").json()
    assert sum_active["monthly_total"] == 2000.0
    assert sum_active["active_count"] == 1
    assert sum_active["paused_count"] == 0

    # Active alerts check
    alerts_active = client.get("/api/v1/analytics/alerts").json()
    assert len(alerts_active["due_soon"]) == 1
    assert len(alerts_active["cancellation_reminders"]) == 1

    # 2. Pause the subscription
    patch_res = client.patch(f"/api/v1/subscriptions/{sub_id}", json={"status": "paused"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "paused"

    # Paused summary check (spending drops to 0)
    sum_paused = client.get("/api/v1/analytics/summary").json()
    assert sum_paused["monthly_total"] == 0.0
    assert sum_paused["sub_count"] == 1
    assert sum_paused["active_count"] == 0
    assert sum_paused["paused_count"] == 1
    assert sum_paused["next_payment"] is None

    # Paused alerts check (no alerts triggered)
    alerts_paused = client.get("/api/v1/analytics/alerts").json()
    assert len(alerts_paused["due_soon"]) == 0
    assert len(alerts_paused["cancellation_reminders"]) == 0

    # 3. Resume the subscription
    resume_res = client.patch(f"/api/v1/subscriptions/{sub_id}", json={"status": "active"})
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "active"

    sum_resumed = client.get("/api/v1/analytics/summary").json()
    assert sum_resumed["monthly_total"] == 2000.0
    assert sum_resumed["active_count"] == 1
    assert sum_resumed["paused_count"] == 0

