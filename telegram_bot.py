import os
import asyncio
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import requests
import models
import notifications

load_dotenv()
logger = logging.getLogger("subsentry.telegram_bot")

BOT_MENU_KEYBOARD = {
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


def answer_callback_query(token: str, callback_id: str, text: Optional[str] = None):
    """Acknowledge Telegram callback query so client stops showing loading indicator."""
    url = f"https://api.telegram.org/bot{token}/answerCallbackQuery"
    payload = {"callback_query_id": callback_id}
    if text:
        payload["text"] = text
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        logger.debug(f"Failed to answer callback query: {e}")


def handle_action(action: str) -> str:
    """Execute requested query and return formatted Telegram markdown string."""
    db = models.SessionLocal()
    try:
        all_subs = db.query(models.Subscription).all()

        if action in ("btn_all", "all", "subs"):
            return notifications.format_all_subscriptions(all_subs)

        if action in ("btn_monthly", "monthly"):
            return notifications.format_monthly_subscriptions(all_subs)

        if action in ("btn_due", "due"):
            from datetime import date, timedelta
            today = date.today()
            week_ahead = today + timedelta(days=7)
            active_subs = [s for s in all_subs if getattr(s, "status", "active") == "active"]
            due_soon = [
                {
                    "name": s.name,
                    "price": s.price,
                    "currency": s.currency or "PHP",
                    "due_date": s.next_due_date,
                    "platform": s.platform,
                    "tier": s.tier,
                    "payment_method": s.payment_method,
                }
                for s in active_subs
                if today <= s.next_due_date <= week_ahead
            ]
            if not due_soon:
                return "⏰ *Upcoming Renewals*\n\n✨ All clear! No renewals due in the next 7 days."
            return notifications.format_message(due_soon=due_soon, cancellation_reminders=[], stats=None)

        if action in ("btn_summary", "summary"):
            return notifications.format_financial_summary(db)

        # Default help text
        return (
            "🛡️ *SubSentry Telegram Assistant*\n\n"
            "Use the interactive buttons below or send any of these commands:\n"
            "• `/subs` or `/all`: View all tracked subscriptions\n"
            "• `/monthly`: View monthly subscriptions & outflow\n"
            "• `/due`: View renewals due within 7 days\n"
            "• `/summary`: View financial overview & totals\n"
        )
    finally:
        db.close()


async def start_telegram_polling():
    """
    Background polling worker for Telegram Bot.
    Runs non-blockingly alongside the FastAPI server.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token or "your_token_here" in token:
        logger.info("Telegram Bot Token not configured. Interactive polling disabled.")
        return

    logger.info("Starting SubSentry interactive Telegram bot polling...")
    offset = 0

    while True:
        try:
            url = f"https://api.telegram.org/bot{token}/getUpdates"
            params = {"offset": offset, "timeout": 20}

            # Run blocking HTTP request in async worker thread
            resp = await asyncio.to_thread(requests.get, url, params=params, timeout=25)
            if resp.status_code != 200:
                await asyncio.sleep(5)
                continue

            data = resp.json()
            if not data.get("ok"):
                await asyncio.sleep(5)
                continue

            updates = data.get("result", [])
            for update in updates:
                offset = max(offset, update.get("update_id", 0) + 1)

                # 1. Handle Inline Button Clicks (Callback Queries)
                if "callback_query" in update:
                    cb = update["callback_query"]
                    cb_id = cb.get("id")
                    cb_data = cb.get("data", "")
                    chat_id = cb.get("message", {}).get("chat", {}).get("id")

                    answer_callback_query(token, cb_id)
                    reply_text = handle_action(cb_data)

                    if chat_id:
                        notifications.send_telegram(
                            message=reply_text,
                            reply_markup=BOT_MENU_KEYBOARD,
                            chat_id=str(chat_id),
                        )

                # 2. Handle Text Commands
                elif "message" in update and "text" in update["message"]:
                    msg = update["message"]
                    chat_id = msg.get("chat", {}).get("id")
                    text = msg.get("text", "").strip().lower()

                    if not chat_id:
                        continue

                    action = text.lstrip("/").split("@")[0]  # strip slash and bot username
                    reply_text = handle_action(action)

                    notifications.send_telegram(
                        message=reply_text,
                        reply_markup=BOT_MENU_KEYBOARD,
                        chat_id=str(chat_id),
                    )

        except asyncio.CancelledError:
            logger.info("Telegram polling task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in Telegram bot polling: {e}")
            await asyncio.sleep(5)
