import logging
from contextlib import asynccontextmanager
from datetime import date, timedelta
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler

import models
import schemas
import utils
import notifications

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("subsentry.main")

scheduler = AsyncIOScheduler()


def scheduled_daily_tasks():
    """Background task executed daily: advance overdue dates and dispatch alerts."""
    logger.info("Executing scheduled daily subscription maintenance...")
    try:
        advanced = utils.advance_due_dates()
        logger.info(f"Daily maintenance: {advanced} overdue subscriptions advanced.")
        alert_result = notifications.check_and_notify()
        logger.info(f"Daily maintenance alerts: {alert_result}")
    except Exception as e:
        logger.error(f"Error during scheduled daily tasks: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema exists
    models.Base.metadata.create_all(bind=models.engine)

    # Initial check on startup
    scheduled_daily_tasks()

    # Schedule daily check at 09:00 AM
    scheduler.add_job(scheduled_daily_tasks, "cron", hour=9, minute=0, id="daily_subscription_check")
    scheduler.start()
    logger.info("SubSentry background scheduler started.")

    yield

    scheduler.shutdown()
    logger.info("SubSentry background scheduler stopped.")


app = FastAPI(
    title="SubSentry API",
    description="Intelligent subscription management, cost normalization, and proactive alerts.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for Frontend SPA integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi.responses import HTMLResponse, FileResponse
import os

frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")

# --- Home & Web App Entrypoint ---
@app.get("/", response_class=HTMLResponse, tags=["General"])
def home():
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)

    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>SubSentry API</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 50px auto; padding: 20px; background: #0f172a; color: #f8fafc; }
            h1 { color: #38bdf8; display: flex; align-items: center; gap: 10px; }
            .card { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px; }
            a { color: #38bdf8; text-decoration: none; font-weight: 500; }
            a:hover { text-decoration: underline; }
            ul { list-style: none; padding: 0; }
            li { padding: 8px 0; border-bottom: 1px solid #334155; }
            .badge { background: #0369a1; padding: 3px 8px; border-radius: 6px; font-size: 12px; }
        </style>
    </head>
    <body>
        <h1>🔐 SubSentry <span class="badge">v2.0 API</span></h1>
        <div class="card">
            <p>SubSentry backend is running with automated daily scheduling and multi-currency normalization.</p>
            <ul>
                <li>📘 <a href="/docs">Interactive API Docs (Swagger UI)</a></li>
                <li>📄 <a href="/redoc">Alternative API Docs (ReDoc)</a></li>
                <li>📊 <a href="/api/v1/analytics/summary">Spending Summary & KPIs</a></li>
                <li>⚠️ <a href="/api/v1/analytics/alerts">Active Alerts & Reminders</a></li>
                <li>📋 <a href="/api/v1/subscriptions">List Subscriptions</a></li>
            </ul>
        </div>
    </body>
    </html>
    """



# ==========================================
# 🚀 Standard REST API (v1)
# ==========================================

@app.get("/api/v1/subscriptions", response_model=List[schemas.SubscriptionResponse], tags=["Subscriptions"])
def list_subscriptions(
    category: Optional[str] = Query(None, description="Filter by category"),
    is_paid_by_me: Optional[bool] = Query(None, description="Filter by payment responsibility"),
    search: Optional[str] = Query(None, description="Search by subscription name or platform"),
    db: Session = Depends(models.get_db),
):
    """Retrieve all subscriptions with optional category, search, and responsibility filters."""
    query = db.query(models.Subscription)

    if category:
        query = query.filter(models.Subscription.category.ilike(f"%{category}%"))
    if is_paid_by_me is not None:
        query = query.filter(models.Subscription.is_paid_by_me == is_paid_by_me)
    if search:
        query = query.filter(
            (models.Subscription.name.ilike(f"%{search}%")) |
            (models.Subscription.platform.ilike(f"%{search}%"))
        )

    return query.order_by(models.Subscription.next_due_date.asc()).all()


@app.post("/api/v1/subscriptions", response_model=schemas.SubscriptionResponse, status_code=status.HTTP_201_CREATED, tags=["Subscriptions"])
def create_subscription(
    sub_in: schemas.SubscriptionCreate,
    db: Session = Depends(models.get_db),
):
    """Create a new recurring subscription."""
    new_sub = models.Subscription(**sub_in.model_dump())
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub


@app.get("/api/v1/subscriptions/{sub_id}", response_model=schemas.SubscriptionResponse, tags=["Subscriptions"])
def get_subscription(
    sub_id: int,
    db: Session = Depends(models.get_db),
):
    """Fetch single subscription details by ID."""
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription with ID {sub_id} not found",
        )
    return sub


@app.patch("/api/v1/subscriptions/{sub_id}", response_model=schemas.SubscriptionResponse, tags=["Subscriptions"])
def update_subscription(
    sub_id: int,
    sub_update: schemas.SubscriptionUpdate,
    db: Session = Depends(models.get_db),
):
    """Partially update subscription fields."""
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription with ID {sub_id} not found",
        )

    update_data = sub_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sub, field, value)

    db.commit()
    db.refresh(sub)
    return sub


@app.delete("/api/v1/subscriptions/{sub_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Subscriptions"])
def delete_subscription(
    sub_id: int,
    db: Session = Depends(models.get_db),
):
    """Delete a subscription."""
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription with ID {sub_id} not found",
        )
    db.delete(sub)
    db.commit()
    return None


# ==========================================
# 📊 Analytics & Insights Endpoints
# ==========================================

@app.get("/api/v1/analytics/summary", response_model=schemas.SummaryResponse, tags=["Analytics"])
def get_summary(db: Session = Depends(models.get_db)):
    """
    Get spending summary, normalized monthly/annual costs, upcoming payment, and category breakdown.
    Safe against empty databases.
    """
    all_subs = db.query(models.Subscription).all()
    paid_subs = [s for s in all_subs if s.is_paid_by_me]

    # Calculate normalized monthly cost for user-paid subscriptions
    monthly_total = sum(
        utils.to_PHP(utils.to_monthly(s), s.currency or "PHP")
        for s in paid_subs
    )
    annual_total = monthly_total * 12.0

    # Find upcoming payment safely
    upcoming = None
    if paid_subs:
        upcoming = sorted(paid_subs, key=lambda x: x.next_due_date)[0]

    # Category breakdown
    categories_map = {}
    for s in paid_subs:
        cat = s.category or "Other"
        monthly_cost = utils.to_PHP(utils.to_monthly(s), s.currency or "PHP")
        if cat not in categories_map:
            categories_map[cat] = {"total": 0.0, "count": 0}
        categories_map[cat]["total"] += monthly_cost
        categories_map[cat]["count"] += 1

    category_list = [
        schemas.CategoryBreakdown(
            category=cat,
            total_monthly_php=round(data["total"], 2),
            count=data["count"],
        )
        for cat, data in categories_map.items()
    ]

    return schemas.SummaryResponse(
        monthly_total=round(monthly_total, 2),
        annual_total=round(annual_total, 2),
        currency="PHP",
        sub_count=len(all_subs),
        paid_by_me_count=len(paid_subs),
        next_payment=upcoming.name if upcoming else None,
        next_payment_date=upcoming.next_due_date if upcoming else None,
        next_payment_amount=upcoming.price if upcoming else None,
        categories=category_list,
        subscriptions=[schemas.SubscriptionResponse.model_validate(s) for s in all_subs],
    )


@app.get("/api/v1/analytics/alerts", response_model=schemas.AlertsResponse, tags=["Analytics"])
def get_alerts(db: Session = Depends(models.get_db)):
    """
    Retrieve active alerts: payments due within 7 days, cancellation reminders, and student expiries.
    Safe against null date comparisons.
    """
    all_subs = db.query(models.Subscription).all()
    today = date.today()
    week_ahead = today + timedelta(days=7)
    month_ahead = today + timedelta(days=30)

    due_soon = [
        schemas.DueSoonAlert(
            id=s.id,
            name=s.name,
            price=s.price,
            currency=s.currency or "PHP",
            billing_cycle=s.billing_cycle or "monthly",
            next_due_date=s.next_due_date,
            days_left=(s.next_due_date - today).days,
        )
        for s in all_subs
        if today <= s.next_due_date <= week_ahead
    ]

    cancellation_reminders = [
        schemas.SubscriptionResponse.model_validate(s)
        for s in all_subs
        if s.remind_to_cancel
    ]

    student_expiries = [
        schemas.StudentExpiryAlert(
            id=s.id,
            name=s.name,
            price=s.price,
            currency=s.currency or "PHP",
            next_due_date=s.next_due_date,
            student_status_expiry=s.student_status_expiry,
            days_left=(s.student_status_expiry - today).days,
        )
        for s in all_subs
        if s.student_status_expiry is not None and today <= s.student_status_expiry <= month_ahead
    ]

    total_alerts = len(due_soon) + len(cancellation_reminders) + len(student_expiries)

    return schemas.AlertsResponse(
        due_soon=due_soon,
        cancellation_reminders=cancellation_reminders,
        student_expiry_reminders=student_expiries,
        total_alerts=total_alerts,
    )


@app.post("/api/v1/analytics/advance-dates", tags=["Maintenance"])
def manual_advance_dates(db: Session = Depends(models.get_db)):
    """Manually advance overdue subscription dates."""
    updated = utils.advance_due_dates(db)
    return {"message": f"Successfully advanced {updated} overdue subscriptions", "updated_count": updated}


@app.post("/api/v1/notifications/trigger", tags=["Maintenance"])
def manual_trigger_notifications(db: Session = Depends(models.get_db)):
    """Manually run alert check and dispatch Telegram notification."""
    result = notifications.check_and_notify(db)
    return {"status": "success", "result": result}


# ==========================================
# 🔄 Backward Compatibility Endpoints
# ==========================================

@app.get("/subscription", include_in_schema=False)
def legacy_get_all_subscriptions(db: Session = Depends(models.get_db)):
    results = db.query(models.Subscription).order_by(models.Subscription.next_due_date.asc()).all()
    return [
        {
            "ID": row.id,
            "Name": row.name,
            "Price": row.price,
            "Billing Date": row.billing_cycle,
            "Next Due Date": row.next_due_date,
        }
        for row in results
    ]


@app.get("/get/{sub_id}", include_in_schema=False)
def legacy_get_subscription(sub_id: int, db: Session = Depends(models.get_db)):
    return get_subscription(sub_id=sub_id, db=db)


@app.get("/table", include_in_schema=False)
def legacy_get_table(db: Session = Depends(models.get_db)):
    results = db.query(models.Subscription).order_by(models.Subscription.next_due_date.asc()).all()
    return [
        {
            "Name": row.name,
            "Price": row.price,
            "Billing Date": row.next_due_date,
        }
        for row in results
    ]


@app.get("/summary", include_in_schema=False)
def legacy_get_summary(db: Session = Depends(models.get_db)):
    return get_summary(db=db)


@app.get("/alerts", include_in_schema=False)
def legacy_get_alerts(db: Session = Depends(models.get_db)):
    return get_alerts(db=db)


@app.post("/add", include_in_schema=False)
def legacy_add_subscription(sub_data: schemas.SubscriptionCreate, db: Session = Depends(models.get_db)):
    return create_subscription(sub_in=sub_data, db=db)


@app.delete("/delete/{sub_id}", include_in_schema=False)
def legacy_delete_subscription(sub_id: int, db: Session = Depends(models.get_db)):
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not sub:
        return {"error": "Subscription not found"}
    db.delete(sub)
    db.commit()
    return {"status": "Success", "message": f"Successfully deleted {sub.name} from subscription"}


# ==========================================
# 🖥️ Serve React SPA Frontend (if built)
# ==========================================
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")