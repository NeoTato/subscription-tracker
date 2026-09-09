from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
import utils

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/summary", response_model=schemas.SummaryResponse)
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


@router.get("/alerts", response_model=schemas.AlertsResponse)
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
