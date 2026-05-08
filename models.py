from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./subsentry.db"


engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # "YouTube Premium"
    platform = Column(String)             # "YouTube", "Twitch"
    plan_type = Column(String, nullable=False) # Solo, Duo, Team, Family
    tier = Column(String) # Discord "Basic", Discord "Pro", Twitch "Tier 1 Sub" etc
    price = Column(Float, nullable=False)  # 115.0
    currency = Column(String, default="PHP")
    next_due_date = Column(Date, nullable=False)
    billing_cycle = Column(String, default="monthly")
    
    # other custom fields
    is_paid_by_me = Column(Boolean, default=True) # Set to False for Spotify
    student_status_expiry = Column(Date, nullable=True) # 
    remind_to_cancel = Column(Boolean, default=False) # reminds cancel
    notes = Column(String, nullable=True)