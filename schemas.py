from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import date
from typing import Optional, List, Any


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
    EUR = "EUR"
    GBP = "GBP"
    SGD = "SGD"


class Category(str, Enum):
    entertainment = "Entertainment"
    productivity = "Productivity"
    utilities = "Utilities"
    cloud = "Cloud & Dev"
    fitness = "Health & Fitness"
    education = "Education"
    other = "Other"


class SubscriptionStatus(str, Enum):
    active = "active"
    paused = "paused"
    cancelled = "cancelled"


class SubscriptionBase(BaseModel):
    name: str = Field(..., description="Name of the service", json_schema_extra={"example": "YouTube Premium"})
    price: float = Field(..., gt=0, description="Recurring cost", json_schema_extra={"example": 159.00})
    currency: Currency = Field(default=Currency.PHP, json_schema_extra={"example": "PHP"})
    billing_cycle: BillingCycle = Field(default=BillingCycle.monthly, json_schema_extra={"example": "monthly"})
    next_due_date: date = Field(..., description="Next renewal/billing date", json_schema_extra={"example": "2026-12-30"})
    platform: Optional[str] = Field(None, description="Platform or provider", json_schema_extra={"example": "Google"})
    plan_type: PlanType = Field(default=PlanType.solo, json_schema_extra={"example": "solo"})
    tier: Optional[str] = Field(None, description="Tier or tier level", json_schema_extra={"example": "Family Plan"})
    category: Optional[str] = Field(default="Entertainment", json_schema_extra={"example": "Entertainment"})
    payment_method: Optional[str] = Field(None, description="Payment method used", json_schema_extra={"example": "GCash"})
    status: str = Field(default="active", description="Subscription status (active, paused, cancelled)", json_schema_extra={"example": "active"})
    is_paid_by_me: bool = Field(default=True, description="Whether this subscription is paid by you")
    remind_to_cancel: bool = Field(default=False, description="Flag to send urgent reminder before next renewal")
    student_status_expiry: Optional[date] = Field(None, description="Expiry date of educational/student discount")
    notes: Optional[str] = Field(None, description="Custom notes or details")

    @field_validator("status", mode="before")
    @classmethod
    def parse_status(cls, v):
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in {"active", "paused", "cancelled"}:
                return v_clean
        elif isinstance(v, SubscriptionStatus):
            return v.value
        return "active"

    @field_validator("plan_type", mode="before")
    @classmethod
    def parse_plan_type(cls, v):
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in {"solo", "duo", "family", "team"}:
                return v_clean
        elif isinstance(v, PlanType):
            return v.value
        return "solo"

    @field_validator("billing_cycle", mode="before")
    @classmethod
    def parse_billing_cycle(cls, v):
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in {"daily", "weekly", "monthly", "yearly"}:
                return v_clean
        elif isinstance(v, BillingCycle):
            return v.value
        return "monthly"

    @field_validator("currency", mode="before")
    @classmethod
    def parse_currency(cls, v):
        if isinstance(v, str):
            v_clean = v.strip().upper()
            if v_clean in {"PHP", "USD", "JPY", "EUR", "GBP", "SGD"}:
                return v_clean
        elif isinstance(v, Currency):
            return v.value
        return "PHP"

    @field_validator("student_status_expiry", mode="before")
    @classmethod
    def parse_student_expiry(cls, v):
        if v == "" or v is None:
            return None
        return v


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    currency: Optional[Currency] = None
    billing_cycle: Optional[BillingCycle] = None
    next_due_date: Optional[date] = None
    platform: Optional[str] = None
    plan_type: Optional[PlanType] = None
    tier: Optional[str] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    is_paid_by_me: Optional[bool] = None
    remind_to_cancel: Optional[bool] = None
    student_status_expiry: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("status", mode="before")
    @classmethod
    def parse_status(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in {"active", "paused", "cancelled"}:
                return v_clean
        elif isinstance(v, SubscriptionStatus):
            return v.value
        return "active"

    @field_validator("plan_type", mode="before")
    @classmethod
    def parse_plan_type(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in {"solo", "duo", "family", "team"}:
                return v_clean
        elif isinstance(v, PlanType):
            return v.value
        return "solo"

    @field_validator("billing_cycle", mode="before")
    @classmethod
    def parse_billing_cycle(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in {"daily", "weekly", "monthly", "yearly"}:
                return v_clean
        elif isinstance(v, BillingCycle):
            return v.value
        return "monthly"

    @field_validator("currency", mode="before")
    @classmethod
    def parse_currency(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v_clean = v.strip().upper()
            if v_clean in {"PHP", "USD", "JPY", "EUR", "GBP", "SGD"}:
                return v_clean
        elif isinstance(v, Currency):
            return v.value
        return "PHP"

    @field_validator("student_status_expiry", mode="before")
    @classmethod
    def parse_student_expiry(cls, v):
        if v == "" or v is None:
            return None
        return v


class SubscriptionResponse(SubscriptionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class UpcomingPayment(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    next_due_date: Optional[date] = None


class CategoryBreakdown(BaseModel):
    category: str
    total_monthly_php: float
    count: int


class SummaryResponse(BaseModel):
    monthly_total: float
    annual_total: float
    currency: str = "PHP"
    sub_count: int
    active_count: int = 0
    paused_count: int = 0
    paid_by_me_count: int
    next_payment: Optional[str] = None
    next_payment_date: Optional[date] = None
    next_payment_amount: Optional[float] = None
    categories: List[CategoryBreakdown] = []
    subscriptions: List[SubscriptionResponse] = []


class DueSoonAlert(BaseModel):
    id: int
    name: str
    price: float
    currency: str
    billing_cycle: str
    next_due_date: date
    days_left: int


class StudentExpiryAlert(BaseModel):
    id: int
    name: str
    price: float
    currency: str
    next_due_date: date
    student_status_expiry: date
    days_left: int


class AlertsResponse(BaseModel):
    due_soon: List[DueSoonAlert] = []
    cancellation_reminders: List[SubscriptionResponse] = []
    student_expiry_reminders: List[StudentExpiryAlert] = []
    total_alerts: int = 0
