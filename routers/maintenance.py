from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import utils
import notifications

router = APIRouter(tags=["Maintenance"])


@router.post("/api/v1/analytics/advance-dates")
@router.post("/api/v1/maintenance/advance-dates")
def manual_advance_dates(db: Session = Depends(models.get_db)):
    """Manually advance overdue subscription dates."""
    updated = utils.advance_due_dates(db)
    return {"message": f"Successfully advanced {updated} overdue subscriptions", "updated_count": updated}


@router.post("/api/v1/notifications/trigger")
@router.post("/api/v1/maintenance/notifications-trigger")
def manual_trigger_notifications(db: Session = Depends(models.get_db)):
    """Manually run alert check and dispatch Telegram notification."""
    result = notifications.check_and_notify(db)
    return {"status": "success", "result": result}
