from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
import models

def to_monthly(subscription):
    if subscription.billing_cycle == "monthly":
        return subscription.price
    elif subscription.billing_cycle == "yearly":
        return subscription.price / 12
    elif subscription.billing_cycle == "weekly":
        return subscription.price * 4
    elif subscription.billing_cycle == "daily":
        return subscription.price * 30
    else:
        return subscription.price

def to_PHP(price, currency):
    if currency == "USD":
        return price * 60
    elif currency == "JPY":
        return price * 0.39
    else:
        return price
    
def advance_due_dates():
    db: Session = models.SessionLocal()
    try:
        today = date.today()
        all_subs = db.query(models.Subscription).all()

        for s in all_subs:
            while s.next_due_date < today:
                if s.billing_cycle == "daily":
                    s.next_due_date = s.next_due_date + relativedelta(days=1)
                elif s.billing_cycle == "weekly":
                    s.next_due_date = s.next_due_date + relativedelta(weeks=1)
                elif s.billing_cycle == "monthly":
                    s.next_due_date = s.next_due_date + relativedelta(months=1)
                elif s.billing_cycle == "yearly":
                    s.next_due_date = s.next_due_date + relativedelta(years=1)
        
        db.commit()
    finally:
        db.close()