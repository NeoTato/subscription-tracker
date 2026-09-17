import os
import logging
from typing import Optional, List, Dict, Any
from datetime import date, timedelta
from dotenv import load_dotenv
import requests
from sqlalchemy.orm import Session
import models
import utils

load_dotenv()
logger = logging.getLogger("subsentry.notifications")

# Default Interactive Inline Keyboard for Telegram Messages
DEFAULT_INLINE_KEYBOARD = {
    "inline_keyboard": [
        [
            {"text": "📋 All Subscriptions", "callback_data": "btn_all"},
            {"text": "📅 Monthly Subs", "callback_data": "btn_monthly"},
        ],
        [
            {"text": "⏰ Due Soon", "callback_data": "btn_due"},
            {"text": "📊 Financial Summary", "callback_data": "btn_summary"},
        ],
    ]
}


def send_telegram(
    message: str,
    reply_markup: Optional[Dict[str, Any]] = None,
    chat_id: Optional[str] = None,
) -> bool:
    """
    Send formatted Telegram message with optional interactive inline buttons.
    Returns True on success, False otherwise.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    target_chat_id = chat_id or os.getenv("TELEGRAM_CHAT_ID")

    if not token or not target_chat_id or "your_token_here" in token:
        logger.warning("Telegram credentials not configured. Skipping alert dispatch.")
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload: Dict[str, Any] = {
        "chat_id": target_chat_id,
        "text": message,
        "parse_mode": "Markdown",
        "disable_web_page_preview": True,
    }

    if reply_markup:
        payload["reply_markup"] = reply_markup

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
    """Format structured alert lists into a rich, executive briefing message (R-02 antislop compliant)."""
    today = date.today()
    today_str = today.strftime("%A, %B %d, %Y")

    lines = [
        "🛡️ *SubSentry: Daily Renewal Briefing*",
        f"📅 _{today_str}_\n",
    ]

    # 1. Urgent Cancellation Reminders
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

            lines.append(f"• *{s['name']}* {f'(`{price_str}`)' if price_str else ''}")
            lines.append(f"  └ 🚨 Action: Cancel before renewal on *{due_fmt}*")
            if s.get("notes"):
                lines.append(f"  └ Note: _{s['notes']}_")
            lines.append("")

    # 2. Upcoming Payments (Next 7 Days)
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

            lines.append(f"• *{s['name']}*: `{price_str}` {urgency}")

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
            days_left = (exp_date - today).days if isinstance(exp_date, date) else 0
            lines.append(
                f"• *{s['name']}*: Discount expires in *{days_left} days* (`{exp_fmt}`)"
            )
            lines.append("  └ ℹ️ Re-verify student credentials to retain discount pricing.")
            lines.append("")

    # 4. Financial Summary Footer
    if stats:
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━")
        if stats.get("total_due_week_php") is not None and stats["total_due_week_php"] > 0:
            lines.append(f"💰 *Total Outflow Due This Week:* `₱{stats['total_due_week_php']:.2f}`")
        if stats.get("monthly_run_rate_php") is not None:
            lines.append(f"📊 *Monthly Spend Run-Rate:* `₱{stats['monthly_run_rate_php']:.2f}/mo`")
        if stats.get("active_sub_count") is not None:
            lines.append(f"📦 *Active Subscriptions Tracked:* {stats['active_sub_count']}")

    # Empty / All clear fallback
    if not due_soon and not cancellation_reminders and not student_expiries:
        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("✨ *All Clear*")
        lines.append("No renewals or cancellation alerts due in the next 7 days.")
        if stats and stats.get("monthly_run_rate_php") is not None:
            lines.append(
                f"Monthly recurring spend is `₱{stats['monthly_run_rate_php']:.2f}/mo` across {stats.get('active_sub_count', 0)} active subscriptions."
            )

    return "\n".join(lines).strip()


def format_all_subscriptions(subs: List[models.Subscription]) -> str:
    """Format full list of subscriptions arranged by upcoming due date."""
    if not subs:
        return "📋 *Subscriptions Ledger*\n\nNo subscriptions are currently recorded in SubSentry."

    # Sort by upcoming next due date ascending
    sorted_subs = sorted(subs, key=lambda s: (s.next_due_date is None, s.next_due_date))

    lines = [
        "📋 *All Subscriptions Ledger*",
        f"Total Tracked: {len(sorted_subs)} (Arranged by Due Date)\n",
        "━━━━━━━━━━━━━━━━━━━━━━━━━",
    ]

    for s in sorted_subs:
        status_tag = "⏸️ `[PAUSED]`" if s.status == "paused" else "✅ `[ACTIVE]`"
        price_str = f"{s.currency} {s.price:.2f}"
        due_str = s.next_due_date.strftime("%b %d, %Y") if s.next_due_date else "N/A"

        lines.append(f"• *{s.name}* {status_tag}")
        lines.append(f"  └ Cost: `{price_str}` / {s.billing_cycle}")
        lines.append(f"  └ Next Due: *{due_str}* | Category: {s.category or 'Other'}")
        if s.payment_method:
            lines.append(f"  └ Payment: {s.payment_method}")
        lines.append("")

    return "\n".join(lines).strip()


def format_monthly_subscriptions(subs: List[models.Subscription]) -> str:
    """Format only monthly-recurring subscriptions arranged by upcoming due date."""
    monthly_subs = [
        s for s in subs
        if s.billing_cycle == "monthly" and getattr(s, "status", "active") == "active"
    ]

    if not monthly_subs:
        return "📅 *Monthly Subscriptions*\n\nNo active monthly subscriptions found."

    # Sort by upcoming next due date ascending
    sorted_monthly = sorted(monthly_subs, key=lambda s: (s.next_due_date is None, s.next_due_date))

    total_php = sum(
        utils.to_PHP(s.price, s.currency or "PHP")
        for s in sorted_monthly
        if s.is_paid_by_me
    )

    lines = [
        "📅 *Monthly Recurring Subscriptions*",
        f"Active Count: {len(sorted_monthly)} (Arranged by Due Date)",
        f"Personal Outflow: `₱{total_php:.2f}/mo`\n",
        "━━━━━━━━━━━━━━━━━━━━━━━━━",
    ]

    for s in sorted_monthly:
        price_str = f"{s.currency} {s.price:.2f}"
        due_str = s.next_due_date.strftime("%b %d, %Y") if s.next_due_date else "N/A"
        payer = "Paid by me" if s.is_paid_by_me else "Shared / Covered"
        lines.append(f"• *{s.name}*: `{price_str}` ({payer})")
        lines.append(f"  └ Next Due: *{due_str}* | Category: {s.category or 'Other'}")
        lines.append("")

    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append(f"💰 *Total Monthly Spend (Personal):* `₱{total_php:.2f}`")

    return "\n".join(lines).strip()


def format_financial_summary(db: Session) -> str:
    """Format comprehensive financial KPI summary for Telegram."""
    all_subs = db.query(models.Subscription).all()
    active_subs = [s for s in all_subs if getattr(s, "status", "active") == "active"]
    paused_subs = [s for s in all_subs if getattr(s, "status", "active") == "paused"]

    monthly_personal = sum(
        utils.to_PHP(utils.to_monthly(s), s.currency or "PHP")
        for s in active_subs
        if s.is_paid_by_me
    )
    annual_personal = monthly_personal * 12

    monthly_overall = sum(
        utils.to_PHP(utils.to_monthly(s), s.currency or "PHP")
        for s in active_subs
    )

    lines = [
        "📊 *SubSentry: Financial KPI Summary*",
        f"📅 Date: _{date.today().strftime('%B %d, %Y')}_\n",
        "━━━━━━━━━━━━━━━━━━━━━━━━━",
        f"💳 *Monthly Outflow (Personal):* `₱{monthly_personal:.2f}/mo`",
        f"📈 *Annualized Estimate:* `₱{annual_personal:.2f}/yr`",
        f"🌐 *Overall Tracked Value:* `₱{monthly_overall:.2f}/mo`\n",
        "━━━━━━━━━━━━━━━━━━━━━━━━━",
        f"📦 *Active Subscriptions:* {len(active_subs)}",
        f"⏸️ *Paused on Hold:* {len(paused_subs)}",
        f"👤 *Paid by You:* {sum(1 for s in active_subs if s.is_paid_by_me)}",
        f"👥 *Shared / Covered:* {sum(1 for s in active_subs if not s.is_paid_by_me)}",
    ]

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
        active_subs = [s for s in all_subs if getattr(s, "status", "active") == "active"]

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
            for s in active_subs
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
            for s in active_subs
            if s.remind_to_cancel
        ]

        student_expiries = [
            {
                "id": s.id,
                "name": s.name,
                "expiry_date": s.student_status_expiry,
                "due_date": s.next_due_date,
            }
            for s in active_subs
            if s.student_status_expiry
            and today <= s.student_status_expiry <= month_ahead
        ]

        due_soon_total_php = sum(
            utils.to_PHP(utils.to_monthly(s), s.currency or "PHP")
            for s in active_subs
            if today <= s.next_due_date <= week_ahead and s.is_paid_by_me
        )
        monthly_run_rate_php = sum(
            utils.to_PHP(utils.to_monthly(s), s.currency or "PHP")
            for s in active_subs
            if s.is_paid_by_me
        )

        stats = {
            "total_due_week_php": round(due_soon_total_php, 2),
            "monthly_run_rate_php": round(monthly_run_rate_php, 2),
            "active_sub_count": len(active_subs),
        }

        has_alerts = bool(due_soon or cancellation_reminders or student_expiries)
        sent = False

        if has_alerts:
            message = format_message(
                due_soon, cancellation_reminders, student_expiries, stats
            )
            sent = send_telegram(
                message=message,
                reply_markup=DEFAULT_INLINE_KEYBOARD,
            )

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