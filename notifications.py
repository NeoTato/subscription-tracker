import os
import logging
from typing import Optional, List, Dict, Any
from datetime import date, timedelta
from dotenv import load_dotenv
import requests
from sqlalchemy.orm import Session
import models

load_dotenv()
logger = logging.getLogger("subsentry.notifications")


def send_telegram(message: str) -> bool:
    """
    Send formatted Telegram alert to configured chat ID.
    Returns True on success, False otherwise.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")

    if not token or not chat_id or "your_token_here" in token:
        logger.warning("Telegram credentials not configured. Skipping alert dispatch.")
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown",
        "disable_web_page_preview": True,
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        logger.info("Telegram notification sent successfully.")
        return True
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")
        return False


def format_message(
    due_soon: List[Dict[str, Any]],
    cancellation_reminders: List[Dict[str, Any]],
    student_expiries: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """Format structured alert lists into a clean Markdown message for Telegram."""
    lines = ["🔔 *SubSentry — Daily Alert*\n"]

    if due_soon:
        lines.append("📅 *Due This Week:*")
        lines.append("━━━━━━━━━━━━━━━")
        for s in due_soon:
            due_str = s["due_date"].strftime("%B %d, %Y")
            currency = s.get("currency", "PHP")
            lines.append(f"🔸 *{s['name']}*")
            lines.append(f"    {currency} {s['price']:.2f} | Due: {due_str} ({s.get('billing_cycle', 'monthly')})")
            lines.append("")

    if cancellation_reminders:
        lines.append("⚠️ *Cancellation Reminders:*")
        lines.append("━━━━━━━━━━━━━━━")
        for s in cancellation_reminders:
            due_str = s["due_date"].strftime("%B %d, %Y")
            lines.append(f"🔸 *{s['name']}* (Renews {due_str})")
            lines.append("    👉 Action required: Cancel before renewal!")
            lines.append("")

    if student_expiries:
        lines.append("🎓 *Student Discount Expirations (Next 30 Days):*")
        lines.append("━━━━━━━━━━━━━━━")
        for s in student_expiries:
            exp_str = s["expiry_date"].strftime("%B %d, %Y")
            lines.append(f"🔸 *{s['name']}* — Discount expires {exp_str}")
            lines.append("")

    return "\n".join(lines).strip()


def check_and_notify(db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Check database for upcoming payments and cancellation alerts, then dispatch.
    Returns summary dictionary of triggered alerts.
    """
    should_close = False
    if db is None:
        db = models.SessionLocal()
        should_close = True

    try:
        today = date.today()
        week_ahead = today + timedelta(days=7)
        month_ahead = today + timedelta(days=30)

        all_subs = db.query(models.Subscription).all()

        due_soon = [
            {
                "id": s.id,
                "name": s.name,
                "price": s.price,
                "currency": s.currency or "PHP",
                "due_date": s.next_due_date,
                "billing_cycle": s.billing_cycle or "monthly",
            }
            for s in all_subs
            if today <= s.next_due_date <= week_ahead
        ]

        cancellation_reminders = [
            {
                "id": s.id,
                "name": s.name,
                "price": s.price,
                "currency": s.currency or "PHP",
                "due_date": s.next_due_date,
                "billing_cycle": s.billing_cycle or "monthly",
            }
            for s in all_subs
            if s.remind_to_cancel
        ]

        student_expiries = [
            {
                "id": s.id,
                "name": s.name,
                "expiry_date": s.student_status_expiry,
                "due_date": s.next_due_date,
            }
            for s in all_subs
            if s.student_status_expiry and today <= s.student_status_expiry <= month_ahead
        ]

        has_alerts = bool(due_soon or cancellation_reminders or student_expiries)
        sent = False

        if has_alerts:
            message = format_message(due_soon, cancellation_reminders, student_expiries)
            sent = send_telegram(message)

        return {
            "has_alerts": has_alerts,
            "notification_sent": sent,
            "due_soon_count": len(due_soon),
            "cancellation_count": len(cancellation_reminders),
            "student_expiry_count": len(student_expiries),
        }
    finally:
        if should_close:
            db.close()