from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import requests

import models
from database import SessionLocal, engine, Base
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

# ================================
# CORS
# ================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ================================
# DATABASE
# ================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================================
# MANUAL FALLBACK COORDINATES
# =========================================
manual_locations = {
    "Jersey city, NJ": {"lat": 40.7178, "lon": -74.0431},
    "Manhattan, NYC": {"lat": 40.7831, "lon": -73.9712},
    "Times Square, NYC": {"lat": 40.7580, "lon": -73.9855},
    "SoHo, NYC": {"lat": 40.7233, "lon": -74.0030},
    "Empire State Building, New York, NY 10001": {
        "lat": 40.7484,
        "lon": -73.9857,
    },
    "LaGuardia Airport, Queens, NY 11371": {
        "lat": 40.7769,
        "lon": -73.8740,
    },
}

# =========================================
# GEOCODE ROUTE
# =========================================
@app.get("/geocode")
def geocode(address: str):

    # 1️⃣ CHECK MANUAL LOCATIONS FIRST
    if address in manual_locations:
        location = manual_locations[address]

        return [
            {
                "lat": location["lat"],
                "lon": location["lon"],
                "display_name": address,
            }
        ]

    # 2️⃣ FALLBACK TO NOMINATIM
    try:
        url = "https://nominatim.openstreetmap.org/search"

        params = {
            "format": "json",
            "limit": 1,
            "q": address,
        }

        headers = {
            "User-Agent": "delivery-app-demo"
        }

        res = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=10
        )

        data = res.json()

        print("GEOCODE:", address, data)

        if not data:
            return []

        return [
            {
                "lat": data[0]["lat"],
                "lon": data[0]["lon"],
                "display_name": data[0].get("display_name"),
            }
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ================================
# DRIVERS
# ================================
@app.post("/seed-drivers")
def seed_drivers(db: Session = Depends(get_db)):

    db.query(models.Driver).delete()

    db.add_all([
        models.Driver(name="Maria"),
        models.Driver(name="Penny"),
        models.Driver(name="Leo"),
    ])

    db.commit()

    return {"ok": True}


@app.get("/drivers")
def get_drivers(db: Session = Depends(get_db)):

    drivers = db.query(models.Driver).all()

    return [
        {
            "id": d.id,
            "name": d.name
        }
        for d in drivers
    ]


# ================================
# CREATE ORDER
# ================================
@app.post("/orders")
def create_order(data: dict, db: Session = Depends(get_db)):

    order = models.Order(
        pickup_address=data["pickup_address"],
        dropoff_address=data["dropoff_address"],
        service_type=data.get("service_type", "food"),
        status="pending",
        route_type="A",
        driver_id=None,
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "id": order.id,
        "pickup_address": order.pickup_address,
        "dropoff_address": order.dropoff_address,
        "route_type": order.route_type,
        "status": order.status,
        "driver_id": order.driver_id,
    }


# ================================
# GET ORDERS
# ================================
@app.get("/orders")
def get_orders(db: Session = Depends(get_db)):

    orders = db.query(models.Order).all()

    return [
        {
            "id": o.id,
            "pickup_address": o.pickup_address,
            "dropoff_address": o.dropoff_address,
            "route_type": o.route_type,
            "status": o.status,
            "driver_id": o.driver_id,
            "service_type": o.service_type,
            "created_at": o.created_at,
            "updated_at": o.updated_at,
            "rating": o.rating,
            "review": o.review,
        }
        for o in orders
    ]


# ================================
# REVIEWS
# ================================
@app.post("/orders/{order_id}/review")
def add_review(order_id: int, data: dict, db: Session = Depends(get_db)):

    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id)
        .first()
    )

    if not order:
        return {"error": "order not found"}

    order.rating = data.get("rating")
    order.review = data.get("review")

    db.commit()
    db.refresh(order)

    return {
        "id": order.id,
        "rating": order.rating,
        "review": order.review,
    }


# ================================
# ROUTE SELECT
# ================================
@app.post("/select-route")
def select_route(data: dict, db: Session = Depends(get_db)):

    order = (
        db.query(models.Order)
        .filter(models.Order.id == data["order_id"])
        .first()
    )

    if not order:
        return {"error": "order not found"}

    order.route_type = data["route_type"]

    db.commit()
    db.refresh(order)

    return {
        "id": order.id,
        "route_type": order.route_type,
        "status": order.status,
    }


# ================================
# ASSIGN DRIVER
# ================================
@app.post("/assign-driver")
def assign_driver(data: dict, db: Session = Depends(get_db)):

    order = (
        db.query(models.Order)
        .filter(models.Order.id == data["order_id"])
        .first()
    )

    if not order:
        return {"error": "order not found"}

    order.driver_id = data["driver_id"]
    order.status = "assigned"

    db.commit()
    db.refresh(order)

    return {
        "id": order.id,
        "status": order.status,
        "driver_id": order.driver_id,
    }


# ================================
# DELETE ORDER
# ================================
@app.delete("/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):

    print("🔥 DELETE REQUEST RECEIVED:", order_id)

    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id)
        .first()
    )

    print("FOUND ORDER:", order)

    if not order:
        print("❌ ORDER NOT FOUND")
        return {"error": "not found"}

    db.delete(order)
    db.commit()

    print("✅ ORDER DELETED")

    return {"ok": True}
@app.get("/debug-orders")
def debug_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).all()
    return orders
