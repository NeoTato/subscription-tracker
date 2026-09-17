import os
from sqlalchemy import Column, Integer, String, Float, Date, Boolean, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./subsentry.db")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "YouTube Premium", "Netflix"
    platform = Column(String, nullable=True)  # e.g., "Google", "Discord", "Twitch"
    plan_type = Column(String, nullable=False, default="solo")  # solo, duo, family, team
    tier = Column(String, nullable=True)  # e.g., "Basic", "Pro", "Tier 1"
    category = Column(String, nullable=True, default="Entertainment")  # Entertainment, Productivity, Utilities, etc.
    payment_method = Column(String, nullable=True)  # e.g., "GCash", "Maya", "Credit Card"
    price = Column(Float, nullable=False)  # 159.0
    currency = Column(String, default="PHP")  # PHP, USD, JPY, EUR, etc.
    billing_cycle = Column(String, default="monthly")  # daily, weekly, monthly, yearly
    next_due_date = Column(Date, nullable=False)
    
    # Custom tracking flags
    status = Column(String, nullable=False, default="active")  # active, paused, cancelled
    is_paid_by_me = Column(Boolean, default=True)
    remind_to_cancel = Column(Boolean, default=False)
    student_status_expiry = Column(Date, nullable=True)
    notes = Column(String, nullable=True)


from sqlalchemy import inspect, text


def init_db():
    """Create tables and automatically apply schema migrations for missing columns."""
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        inspector = inspect(engine)
        if "subscriptions" in inspector.get_table_names():
            existing_cols = {c["name"] for c in inspector.get_columns("subscriptions")}
            
            migrations = [
                ("status", "VARCHAR DEFAULT 'active'"),
                ("category", "VARCHAR DEFAULT 'Entertainment'"),
                ("payment_method", "VARCHAR DEFAULT 'GCash'"),
                ("is_paid_by_me", "BOOLEAN DEFAULT 1"),
                ("remind_to_cancel", "BOOLEAN DEFAULT 0"),
                ("student_status_expiry", "DATE"),
                ("notes", "VARCHAR"),
                ("platform", "VARCHAR"),
                ("plan_type", "VARCHAR DEFAULT 'solo'"),
                ("tier", "VARCHAR"),
                ("currency", "VARCHAR DEFAULT 'PHP'"),
                ("billing_cycle", "VARCHAR DEFAULT 'monthly'"),
            ]
            
            for col_name, col_type in migrations:
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE subscriptions ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                    except Exception:
                        pass


def get_db():
    """FastAPI database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()