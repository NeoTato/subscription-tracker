from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import models

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
def home():
    return """
            <h1>Subscription Tracker</h1>
            <a href='/summary'>To Summary</a>
            <br>
            <a href='/alerts'>To Alerts</a>
            <br>
            <a href='/table'>To Table</a>
            <br>
            <a href='/docs'>To Admin Panel</a>
        """

@app.get("/table")
def get_table():
    db: Session = models.SessionLocal()
    try:
        # returns name, price, billing date and sorted by billing date ()
        results = db.query(
            models.Subscription.name, 
            models.Subscription.price, 
            models.Subscription.next_due_date
        ).order_by(models.Subscription.next_due_date).all()
        
        formatted_table = [
            {
                "Name:": row.name,
                "Price": row.price,
                "Billing Date": row.next_due_date
            }
            for row in results
        ]

        return formatted_table
    
    finally:
        db.close()

@app.get("/summary")
def get_summary():
    db: Session = models.SessionLocal()
    try:
        # fetch all subscriptions from database
        all_subs = db.query(models.Subscription).all()
        
        # list all subs PAID BY ME
        paid_subs = [s for s in all_subs if s.is_paid_by_me]
        
        # list all subs
        my_subs = [s for s in all_subs]
        
        # calculate total cost of subs PAID BY ME
        total_cost = sum(s.price for s in paid_subs)
        
        # find the next payment date sorted by next_due_date
        upcoming = sorted(paid_subs, key=lambda x: x.next_due_date)[0]
        

        return {
            "monthly_total": total_cost,
            "currency": "PHP",
            "next_payment": upcoming.name,
            "next_payment_date": upcoming.next_due_date,
            "sub_count": len(my_subs),
            "paid_sub_list": paid_subs,
            "sub_list": my_subs,
            "source": "Database"
        }   
    finally:
        db.close()
        
@app.get("/alerts")
def get_alerts():
    db: Session = models.SessionLocal()
    try:
        # fetch everything from the DB table
        all_subs = db.query(models.Subscription).all()
        
        # looks for "CANCEL" in the notes column
        cancellation_reminders = [s for s in all_subs if s.notes and "CANCEL" in s.notes.upper()]
        
        return {"urgent_reminders": cancellation_reminders}
    finally:
        db.close() 
        
@app.put("/update/{sub_id}")
def update_subscription(
    sub_id: int,
    new_name: Optional[str] = None,
    new_platform: Optional[str] = None,
    new_plan_type: Optional[str] = None,
    new_tier: Optional[str] = None,
    new_price: Optional[float] = None,
    new_currency: Optional[str] = None,
    new_next_due_date: Optional[date] = None,
    new_billing_cycle: Optional[str] = None,
    new_is_paid_by_me: Optional[bool] = None,
    new_student_status_expiry: Optional[date] = None,
    new_notes: Optional[str] = None
):
    db: Session = models.SessionLocal()
    try:
        target_sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()

        if not target_sub:
            return{"error": "Subscription not found"}
        
        updates = {
            "name": new_name,
            "platform": new_platform,
            "plan_type": new_plan_type,
            "tier": new_tier,
            "price": new_price,
            "currency": new_currency,
            "next_due_date": new_next_due_date,
            "billing_cycle": new_billing_cycle,
            "is_paid_by_me": new_is_paid_by_me,
            "student_status_expiry": new_student_status_expiry,
            "notes": new_notes,
        }
        
        for column, value in updates.items():
            if value is not None:
                setattr(target_sub, column, value)
                
        db.commit()
        
        db.refresh(target_sub)
        
        return {
            "status": "Success",
            "message": f"Successfully updated {target_sub.name}",
            "updated_data": {
                "id": target_sub.id,
                "name": target_sub.name,
                "platform": target_sub.platform,
                "price": target_sub.price,
                "next_due_date": target_sub.next_due_date,
                "billing_cycle": target_sub.billing_cycle,
                "plan_type": target_sub.plan_type,
                "tier": target_sub.tier,
                "currency": target_sub.currency,
                "is_paid_by_me": target_sub.is_paid_by_me,
                "notes": target_sub.notes
            }
        }
            
    finally:
        db.close()