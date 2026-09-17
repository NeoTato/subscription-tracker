from typing import Optional, Union, Any
from sqlalchemy.orm import Session
from datetime import date
from dateutil.relativedelta import relativedelta
import models

# Standard FX rate approximations against PHP (can be made dynamic via API)
FX_RATES_TO_PHP = {
    "PHP": 1.0,
    "USD": 58.50,
    "JPY": 0.38,
    "EUR": 63.20,
    "GBP": 74.50,
    "SGD": 43.80,
    "AUD": 38.20,
    "CAD": 42.50,
}


def to_monthly(subscription_or_price: Union[float, int, Any], billing_cycle: Optional[str] = None) -> float:
    """Normalize any billing cycle cost to a monthly equivalent."""
    if hasattr(subscription_or_price, "price") and hasattr(subscription_or_price, "billing_cycle"):
        price = float(subscription_or_price.price)
        cycle = str(subscription_or_price.billing_cycle).lower()
    else:
        price = float(subscription_or_price)
        cycle = str(billing_cycle).lower() if billing_cycle else "monthly"

    if cycle == "monthly":
        return price
    elif cycle == "yearly":
        return price / 12.0
    elif cycle == "weekly":
        return price * (52.0 / 12.0)  # ~4.333 weeks per month
    elif cycle == "daily":
        return price * (365.0 / 12.0)  # ~30.416 days per month
    else:
        return price


def to_PHP(price: float, currency: str) -> float:
    """Convert foreign currency to Philippine Peso (PHP)."""
    curr = str(currency).upper()
    rate = FX_RATES_TO_PHP.get(curr, 1.0)
    return round(price * rate, 2)


def advance_due_dates(db: Optional[Session] = None) -> int:
    """
    Advance all overdue subscriptions to their upcoming next due date.
    Returns the count of subscriptions updated.
    """
    should_close = False
    if db is None:
        db = models.SessionLocal()
        should_close = True

    try:
        today = date.today()
        all_subs = db.query(models.Subscription).all()
        updated_count = 0

        for s in all_subs:
            # Skip paused subscriptions
            if getattr(s, "status", "active") == "paused":
                continue

            modified = False
            cycle = (s.billing_cycle or "monthly").lower()

            while s.next_due_date < today:
                modified = True
                if cycle == "daily":
                    s.next_due_date = s.next_due_date + relativedelta(days=1)
                elif cycle == "weekly":
                    s.next_due_date = s.next_due_date + relativedelta(weeks=1)
                elif cycle == "yearly":
                    s.next_due_date = s.next_due_date + relativedelta(years=1)
                else:  # default monthly
                    s.next_due_date = s.next_due_date + relativedelta(months=1)

            if modified:
                updated_count += 1

        if updated_count > 0:
            db.commit()

        return updated_count
    finally:
        if should_close:
            db.close()