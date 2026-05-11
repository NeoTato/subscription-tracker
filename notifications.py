from dotenv import load_dotenv
from sqlalchemy.orm import Session
from datetime import date, timedelta
import requests
import os
import models

load_dotenv()

# TODO : Add options for telegram bot for user to pick an option like monthly dues, yearly dues, etc...

def send_telegram(message: str):
    TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
    
    URL = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    
    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }
    
    response = requests.post(URL, json=payload)
    print(response.json())
    
def format_message(due_soon, cancellation_reminders):
    lines = ["🔔 *Subscription Tracker — Daily Alert*\n"]
    
    if due_soon:
        lines.append("📅 *Due this week:*")
        lines.append("━━━━━━━━━━━━━━━")
        for s in due_soon:
            formatted_date = s['due_date'].strftime("%B %d, %Y")
            lines.append(f"🔸 *{s['name']}*")
            lines.append(f"    ₱{s['price']:.2f} |  {formatted_date}")
            lines.append("")
    
    if cancellation_reminders:
        lines.append("⚠️ *Cancellation Reminders:*")
        lines.append("━━━━━━━━━━━━━━━")
        for s in cancellation_reminders:
            formatted_date = s.next_due_date.strftime("%B %d, %Y")
            lines.append(f"🔸 *{s.name}*")
            lines.append("")

    return "\n".join(lines)
    
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
        
        cancellation_reminders = [s for s in all_subs if s.remind_to_cancel]
        
        if due_soon or cancellation_reminders:
            message = format_message(due_soon, cancellation_reminders)
            send_telegram(message)
        
    finally:
        db.close()