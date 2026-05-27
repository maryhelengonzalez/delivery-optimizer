from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from database import Base
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    pickup_address = Column(String, nullable=False)
    dropoff_address = Column(String, nullable=False)

    service_type = Column(String, default="food")
    status = Column(String, default="pending")
    route_type = Column(String, default="A")

    driver_id = Column(Integer, nullable=True)

    # ⭐ ADD THESE (IMPORTANT)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)

    rating = Column(Integer, nullable=True)
    review = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)