from enum import Enum
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class PlanType(str, Enum):
    solo = "solo"
    duo = "duo"
    family = "family"
    team = "team"
    
class BillingCycle(str, Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"
    
class Currency(str, Enum):
    PHP = "PHP"
    USD = "USD"
    JPY = "JPY"

class SubscriptionCreate(BaseModel):
    # Required fields 
    name: str = Field(..., json_schema_extra={"example": "YouTube Premium"})
    price: float = Field(..., json_schema_extra={"example": 159.00})
    next_due_date: date = Field(..., json_schema_extra={"example": "2026-12-30"})
    
    # Optional fields
    platform: Optional[str] = Field(
        None, 
        json_schema_extra={"example": "YouTube"},
        description="The service provider"
    )
    
    # Fields with Enums
    plan_type: PlanType = PlanType.solo
    currency: Currency = Currency.PHP
    billing_cycle: BillingCycle = BillingCycle.monthly
    
    # Others
    tier: Optional[str] = None
    is_paid_by_me: bool = True
    student_status_expiry: Optional[date] = None
    notes: Optional[str] = None
