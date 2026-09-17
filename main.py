import os
import asyncio
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler

import models
import utils
import notifications
import telegram_bot
from routers import subscriptions, analytics, maintenance, legacy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("subsentry.main")

scheduler = AsyncIOScheduler()


def scheduled_daily_tasks():
    """Background task executed daily: advance overdue dates and dispatch alerts."""
    logger.info("Executing scheduled daily subscription maintenance...")
    try:
        advanced = utils.advance_due_dates()
        logger.info(f"Daily maintenance: {advanced} overdue subscriptions advanced.")
        alert_result = notifications.check_and_notify()
        logger.info(f"Daily maintenance alerts: {alert_result}")
    except Exception as e:
        logger.error(f"Error during scheduled daily tasks: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema exists and auto-migrate any missing columns
    models.init_db()

    # Initial check on startup
    scheduled_daily_tasks()

    # Schedule daily check at 09:00 AM
    scheduler.add_job(scheduled_daily_tasks, "cron", hour=9, minute=0, id="daily_subscription_check")
    scheduler.start()
    logger.info("SubSentry background scheduler started.")

    # Start interactive Telegram bot listener in background task
    bot_task = asyncio.create_task(telegram_bot.start_telegram_polling())

    yield

    scheduler.shutdown()
    bot_task.cancel()
    logger.info("SubSentry background scheduler and Telegram bot stopped.")


app = FastAPI(
    title="SubSentry API",
    description="Intelligent subscription management, cost normalization, and proactive alerts.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for Frontend SPA integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(subscriptions.router)
app.include_router(analytics.router)
app.include_router(maintenance.router)
app.include_router(legacy.router)

# Mount React SPA Frontend (if built)
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")


@app.get("/", response_class=HTMLResponse, tags=["General"])
def home():
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    return """
    <h1>🔐 SubSentry API</h1>
    <p>Backend is running. <a href='/docs'>Swagger API Docs</a></p>
    """


if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")