from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

import models
import schemas

router = APIRouter(prefix="/api/v1/subscriptions", tags=["Subscriptions"])


@router.get("", response_model=List[schemas.SubscriptionResponse])
def list_subscriptions(
    category: Optional[str] = Query(None, description="Filter by category"),
    is_paid_by_me: Optional[bool] = Query(None, description="Filter by payment responsibility"),
    search: Optional[str] = Query(None, description="Search by subscription name or platform"),
    db: Session = Depends(models.get_db),
):
    """Retrieve all subscriptions with optional category, search, and responsibility filters."""
    query = db.query(models.Subscription)

    if category:
        query = query.filter(models.Subscription.category.ilike(f"%{category}%"))
    if is_paid_by_me is not None:
        query = query.filter(models.Subscription.is_paid_by_me == is_paid_by_me)
    if search:
        query = query.filter(
            (models.Subscription.name.ilike(f"%{search}%")) |
            (models.Subscription.platform.ilike(f"%{search}%"))
        )

    return query.order_by(models.Subscription.next_due_date.asc()).all()


@router.post("", response_model=schemas.SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    sub_in: schemas.SubscriptionCreate,
    db: Session = Depends(models.get_db),
):
    """Create a new recurring subscription."""
    new_sub = models.Subscription(**sub_in.model_dump())
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub


@router.get("/{sub_id}", response_model=schemas.SubscriptionResponse)
def get_subscription(
    sub_id: int,
    db: Session = Depends(models.get_db),
):
    """Fetch single subscription details by ID."""
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription with ID {sub_id} not found",
        )
    return sub


@router.patch("/{sub_id}", response_model=schemas.SubscriptionResponse)
def update_subscription(
    sub_id: int,
    sub_update: schemas.SubscriptionUpdate,
    db: Session = Depends(models.get_db),
):
    """Partially update subscription fields."""
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription with ID {sub_id} not found",
        )

    update_data = sub_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sub, field, value)

    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(
    sub_id: int,
    db: Session = Depends(models.get_db),
):
    """Delete a subscription."""
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription with ID {sub_id} not found",
        )
    db.delete(sub)
    db.commit()
    return None
