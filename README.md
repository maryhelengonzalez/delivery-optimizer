# 🚚 Intelligent Delivery Dispatch System

A full-stack logistics and delivery dispatch platform built with:

- React (Vite)
- FastAPI
- PostgreSQL
- Leaflet Maps
- OSRM Routing API
- OpenStreetMap Geocoding

---

## 🔥 Features

- Real-time delivery order creation
- Driver assignment system
- Multi-route optimization (A/B/C routes)
- Interactive map with Leaflet
- Geocoding (address → coordinates)
- Route visualization using OSRM
- Ratings & reviews system
- Multi-service support:
  - 🍔 Food Delivery
  - 🚗 Ride Services
  - 📦 Courier Logistics

---

## 🌐 Live Demo

Frontend: *(add your Vercel link here)*  
Backend API: https://delivery-optimizer-wwx8.onrender.com

---

## 📸 Screenshots

Add screenshots here (see Step 2 below)

---

## ⚙️ Tech Stack

Frontend:
- React
- Axios
- Leaflet.js
- Vite

Backend:
- FastAPI
- SQLAlchemy
- PostgreSQL
- Uvicorn

APIs:
- OpenStreetMap Nominatim
- OSRM Routing API

---

## 🚀 How to Run Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
