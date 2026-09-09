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
    stats: Optional[Dict[str, Any]] = None,
) -> str:
    """Format structured alert lists into a rich, informative briefing message for Telegram."""
    today = date.today()
    today_str = today.strftime("%A, %B %d, %Y")

    lines = [
        "🛡️ *SubSentry — Daily Renewal Briefing*",
        f"📅 _{today_str}_\n",
    ]

    # 1. Upcoming Payments (Next 7 Days)
    if due_soon:
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("💳 *UPCOMING PAYMENTS (NEXT 7 DAYS)*")
        for s in due_soon:
            due_date = s.get("due_date")
            days_left = (due_date - today).days if isinstance(due_date, date) else 0

            if days_left <= 0:
                urgency = "🔴 [DUE TODAY]"
            elif days_left == 1:
                urgency = "🟠 [DUE TOMORROW]"
            else:
                urgency = f"🟡 [IN {days_left} DAYS]"

            price_str = f"{s.get('currency', 'PHP')} {s['price']:.2f}"
            due_fmt = (
                due_date.strftime("%b %d, %Y")
                if isinstance(due_date, date)
                else str(due_date)
            )

            lines.append(f"• *{s['name']}* — `{price_str}` {urgency}")

            details = []
            if s.get("platform") and s.get("platform") != "Various":
                details.append(f"Provider: {s['platform']}")
            if s.get("tier"):
                details.append(f"Tier: {s['tier']}")
            if s.get("payment_method"):
                details.append(f"Pay: {s['payment_method']}")
            details.append(f"Due: {due_fmt}")

            if details:
                lines.append(f"  └ {' | '.join(details)}")
            lines.append("")

    # 2. Urgent Cancellation Reminders
    if cancellation_reminders:
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("⚠️ *URGENT: CANCEL BEFORE RENEWAL*")
        for s in cancellation_reminders:
            due_date = s.get("due_date")
            due_fmt = (
                due_date.strftime("%B %d, %Y")
                if isinstance(due_date, date)
                else "Upcoming"
            )
            price_str = (
                f"{s.get('currency', 'PHP')} {s['price']:.2f}"
                if "price" in s
                else ""
            )

            lines.append(
                f"• *{s['name']}* {f'(`{price_str}`)' if price_str else ''}"
            )
            lines.append(f"  └ 🚨 Action: Cancel before renewal on *{due_fmt}*!")
            if s.get("notes"):
                lines.append(f"  └ Note: _{s['notes']}_")
            lines.append("")

    # 3. Student Discount Expirations
    if student_expiries:
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("🎓 *STUDENT DISCOUNT EXPIRATIONS*")
        for s in student_expiries:
            exp_date = s.get("expiry_date")
            exp_fmt = (
                exp_date.strftime("%B %d, %Y")
                if isinstance(exp_date, date)
                else str(exp_date)
            )
            days_left = (
                (exp_date - today).days if isinstance(exp_date, date) else 0
            )
            lines.append(
                f"• *{s['name']}* — Discount expires in *{days_left} days* (`{exp_fmt}`)"
            )
            lines.append(
                "  └ ℹ️ Re-verify student credentials to retain discount pricing."
            )
            lines.append("")

    # 4. Financial Summary Footer
    if stats:
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━")
        if (
            stats.get("total_due_week_php") is not None
            and stats["total_due_week_php"] > 0
        ):
            lines.append(
                f"💰 *Total Outflow Due This Week:* `₱{stats['total_due_week_php']:.2f}`"
            )
        if stats.get("monthly_run_rate_php") is not None:
            lines.append(
                f"📊 *Monthly Spend Run-Rate:* `₱{stats['monthly_run_rate_php']:.2f}/mo`"
            )
        if stats.get("active_sub_count") is not None:
            lines.append(
                f"📦 *Active Subscriptions Tracked:* {stats['active_sub_count']}"
            )

    # Empty / All clear fallback
    if not due_soon and not cancellation_reminders and not student_expiries:
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("✨ *All Clear!*")
        lines.append("No renewals or cancellation alerts due in the next 7 days.")
        if stats and stats.get("monthly_run_rate_php") is not None:
            lines.append(
                f"Monthly recurring spend is `₱{stats['monthly_run_rate_php']:.2f}/mo` across {stats.get('active_sub_count', 0)} subscriptions."
            )

    return "\n".join(lines).strip()


def check_and_notify(db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Check database for upcoming payments and cancellation alerts, then dispatch.
    Returns summary dictionary of triggered alerts.
    """
    import utils

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
                "platform": s.platform,
                "tier": s.tier,
                "payment_method": s.payment_method,
                "is_paid_by_me": s.is_paid_by_me,
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
                "platform": s.platform,
                "tier": s.tier,
                "notes": s.notes,
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
            if s.student_status_expiry
            and today <= s.student_status_expiry <= month_ahead
        ]

        # Calculate rich stats
        due_soon_total_php = sum(
            utils.to_PHP(utils.to_monthly(s), s.currency or "PHP")
            for s in all_subs
            if today <= s.next_due_date <= week_ahead and s.is_paid_by_me
        )
        monthly_run_rate_php = sum(
            utils.to_PHP(utils.to_monthly(s), s.currency or "PHP")
            for s in all_subs
            if s.is_paid_by_me
        )

        stats = {
            "total_due_week_php": round(due_soon_total_php, 2),
            "monthly_run_rate_php": round(monthly_run_rate_php, 2),
            "active_sub_count": len(all_subs),
        }

        has_alerts = bool(due_soon or cancellation_reminders or student_expiries)
        sent = False

        if has_alerts:
            message = format_message(
                due_soon, cancellation_reminders, student_expiries, stats
            )
            sent = send_telegram(message)

        return {
            "has_alerts": has_alerts,
            "notification_sent": sent,
            "due_soon_count": len(due_soon),
            "cancellation_count": len(cancellation_reminders),
            "student_expiry_count": len(student_expiries),
            "stats": stats,
        }
    finally:
        if should_close:
            db.close()