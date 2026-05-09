from dotenv import load_dotenv
from sqlalchemy.orm import Session
from datetime import date, timedelta
import requests
import os
import models

load_dotenv()

def send_telegram(message: str):
    TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
    
    URL = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    
    payload = {
        "chat_id": CHAT_ID,
        "text": message,
    }
    
    response = requests.post(URL, json=payload)
    print(response.json())
    
def check_and_notify():
    db: Session = models.SessionLocal()
    try:
        all_subs = db.query(models.Subscription).all()
        
        due_soon = [
            {
            "name": s.name,
            "price": s.price,
            "due_date": s.next_due_date,
            "billing_cycle": s.billing_cycle,
        }
            for s in all_subs 
            if date.today() <= s.next_due_date <= (date.today() + timedelta(days=7))
        ]
        
        if due_soon:
            lines = [f"- {s['name']} | ₱{s['price']} | Due: {s['due_date']}" for s in due_soon]
            message = "🔔 Due this week:\n" + "\n".join(lines)
            send_telegram(message)
        
    finally:
        db.close()