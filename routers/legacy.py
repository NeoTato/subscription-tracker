from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from .subscriptions import get_subscription, create_subscription
from .analytics import get_summary, get_alerts

router = APIRouter(include_in_schema=False)


@router.get("/subscription")
def legacy_get_all_subscriptions(db: Session = Depends(models.get_db)):
    results = db.query(models.Subscription).order_by(models.Subscription.next_due_date.asc()).all()
    return [
        {
            "ID": row.id,
            "Name": row.name,
            "Price": row.price,
            "Billing Date": row.billing_cycle,
            "Next Due Date": row.next_due_date,
        }
        for row in results
    ]


@router.get("/get/{sub_id}")
def legacy_get_subscription(sub_id: int, db: Session = Depends(models.get_db)):
    return get_subscription(sub_id=sub_id, db=db)


@router.get("/table")
def legacy_get_table(db: Session = Depends(models.get_db)):
    results = db.query(models.Subscription).order_by(models.Subscription.next_due_date.asc()).all()
    return [
        {
            "Name": row.name,
            "Price": row.price,
            "Billing Date": row.next_due_date,
        }
        for row in results
    ]


@router.get("/summary")
def legacy_get_summary(db: Session = Depends(models.get_db)):
    return get_summary(db=db)


@router.get("/alerts")
def legacy_get_alerts(db: Session = Depends(models.get_db)):
    return get_alerts(db=db)


@router.post("/add")
def legacy_add_subscription(sub_data: schemas.SubscriptionCreate, db: Session = Depends(models.get_db)):
    return create_subscription(sub_in=sub_data, db=db)


@router.delete("/delete/{sub_id}")
def legacy_delete_subscription(sub_id: int, db: Session = Depends(models.get_db)):
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not sub:
        return {"error": "Subscription not found"}
    db.delete(sub)
    db.commit()
    return {"status": "Success", "message": f"Successfully deleted {sub.name} from subscription"}

