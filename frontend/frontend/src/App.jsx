import { useEffect, useRef, useState } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function App() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const geoCache = new Map();
  const geoInProgress = new Set();
  const routeLayers = useRef([]);
  const markerLayers = useRef([]);
  

  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [selectedRoutes, setSelectedRoutes] = useState({});
  const [selectedDriver, setSelectedDriver] = useState({});

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const [serviceType, setServiceType] = useState("food");

  const [ratings, setRatings] = useState({});
  const [reviews, setReviews] = useState({});

 const [geoData, setGeoData] = useState({});

  // ---------------- COLORS ----------------
  const routeColors = {
    A: "red",
    B: "blue",
    C: "green",
  };

  // ---------------- FETCH ----------------
  const fetchOrders = async () => {
    const res = await axios.get("http://127.0.0.1:8000/orders");
    setOrders(res.data);
  };

  const fetchDrivers = async () => {
    const res = await axios.get("http://127.0.0.1:8000/drivers");
    setDrivers(res.data || []);
  };

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
  }, []);

  // ---------------- MAP INIT ----------------
  
useEffect(() => {
  if (mapInstance.current) return;
  if (!mapRef.current) return;

  mapInstance.current = L.map(mapRef.current).setView(
    [40.7128, -74.006],
    12
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(mapInstance.current);

  setTimeout(() => {
    mapInstance.current.invalidateSize();
  }, 500);
}, []);
  // ---------------- GEOCODE ----------------
 const geocode = async (address) => {
  if (!address) return null;

  if (geoCache.has(address)) {
    return geoCache.get(address);
  }

  // 🚨 FORCE requests to run ONE AT A TIME
  geoQueue = geoQueue.then(async () => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
    );

    const data = await res.json();

    if (!data?.length) return null;

    const coords = [
      parseFloat(data[0].lat),
      parseFloat(data[0].lon),
    ];

    geoCache.set(address, coords);
    return coords;
  });

  return geoQueue;
};
  // ---------------- ROUTING ----------------
  const getRoute = async (start, end, type) => {
    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${start[1]},${start[0]};${end[1]},${end[0]}` +
        `?overview=full&geometries=geojson&alternatives=true`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) return null;

      const format = (r) =>
        r.geometry.coordinates.map((c) => [c[1], c[0]]);

      // ---------------- A ----------------
      if (type === "A") {
        const best = [...data.routes].sort(
          (a, b) => a.duration - b.duration
        )[0];
        return format(best);
      }

      // ---------------- B ----------------
      if (type === "B") {
        return format(data.routes[1] || data.routes[0]);
      }

      // ---------------- C (SAFE NYC DETOUR) ----------------
      if (type === "C") {
        const midLat = (start[0] + end[0]) / 2 + 0.01;
        const midLng = (start[1] + end[1]) / 2 + 0.01;

        const detourUrl =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${start[1]},${start[0]};${midLng},${midLat};${end[1]},${end[0]}` +
          `?overview=full&geometries=geojson`;

        const detourRes = await fetch(detourUrl);
        const detourData = await detourRes.json();

        if (detourData.routes?.length) {
          return format(detourData.routes[0]);
        }

        return format(data.routes[0]);
      }

      return format(data.routes[0]);
    } catch (err) {
      console.log("ROUTE ERROR:", err);
      return null;
    }
  };

  useEffect(() => {
  const loadGeo = async () => {
    const result = {};

    for (const o of orders) {
      const keyPickup = o.pickup_address;
      const keyDrop = o.dropoff_address;

      if (!geoCache.has(keyPickup)) {
        const res1 = await geocode(keyPickup);
        if (res1) geoCache.set(keyPickup, res1);
      }

      if (!geoCache.has(keyDrop)) {
        const res2 = await geocode(keyDrop);
        if (res2) geoCache.set(keyDrop, res2);
      }

      result[o.id] = {
        start: geoCache.get(keyPickup),
        end: geoCache.get(keyDrop),
      };
    }

    setGeoData(result);
  };

  if (orders.length) loadGeo();
}, [orders]);
  // ---------------- DRAW ROUTES ----------------
  useEffect(() => {
    if (!mapInstance.current) return;

    const draw = async () => {
      // clear old lines
      routeLayers.current.forEach((l) =>
        mapInstance.current.removeLayer(l)
      );
      routeLayers.current = [];

      for (const o of orders) {
        const type = selectedRoutes[o.id] || o.route_type || "A";

      const start = geoData[o.id]?.start;
      const end = geoData[o.id]?.end;

if (!start || !end) continue;   

        const path = await getRoute(start, end, type);

        if (!path || path.length === 0) continue;

        const polyline = L.polyline(path, {
          color: routeColors[type],
          weight: 5,
          opacity: 1,
        }).addTo(mapInstance.current);

        routeLayers.current.push(polyline);

        mapInstance.current.fitBounds(polyline.getBounds(), {
          padding: [50, 50],
        });
      }
    };

    draw();
  }, [orders, selectedRoutes]);

  // ---------------- MARKERS ----------------
  useEffect(() => {
  if (!mapInstance.current) return;

  markerLayers.current.forEach((m) =>
    mapInstance.current.removeLayer(m)
  );
  markerLayers.current = [];

  for (const o of orders) {
    const geo = geoData[o.id];

    if (geo?.start) {
      markerLayers.current.push(
        L.marker(geo.start)
          .addTo(mapInstance.current)
          .bindPopup("Pickup")
      );
    }

    if (geo?.end) {
      markerLayers.current.push(
        L.marker(geo.end)
          .addTo(mapInstance.current)
          .bindPopup("Dropoff")
      );
    }
  }
}, [geoData]);

  // ---------------- CREATE ORDER ----------------
  const createOrder = async () => {
    if (!pickup || !dropoff) return;

    await axios.post("http://127.0.0.1:8000/orders", {
      pickup_address: pickup,
      dropoff_address: dropoff,
      service_type: serviceType,
    });

    setPickup("");
    setDropoff("");
    fetchOrders();
  };

  // ---------------- CHANGE ROUTE ----------------
  const changeRoute = async (orderId, type) => {
    setSelectedRoutes((prev) => ({
      ...prev,
      [orderId]: type,
    }));

    await axios.post("http://127.0.0.1:8000/select-route", {
      order_id: orderId,
      route_type: type,
    });
  };

  const deleteOrder = async (orderId) => {
  await axios.delete(`http://127.0.0.1:8000/orders/${orderId}`);
  fetchOrders();
};
  // ---------------- ASSIGN DRIVER ----------------
const assignDriver = async (orderId) => {
  const driverId = selectedDriver[orderId];

  if (!driverId) {
    alert("Select driver");
    return;
  }

  await axios.post("http://127.0.0.1:8000/assign-driver", {
    order_id: orderId,
    driver_id: Number(driverId),
  });

  fetchOrders();
};

return (
  <div style={{ display: "flex", height: "100vh" }}>

    {/* LEFT PANEL */}
    <div style={{ width: "35%", padding: 20, overflowY: "auto" }}>
      <h2>Delivery System</h2>

      {/* SERVICE TYPE */}
      <select
        value={serviceType}
        onChange={(e) => setServiceType(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      >
        <option value="food">🍔 Food Delivery</option>
        <option value="ride">🚗 Ride / Driver</option>
        <option value="courier">📦 Courier</option>
      </select>

      {/* INPUTS */}
      <input
        value={pickup}
        onChange={(e) => setPickup(e.target.value)}
        placeholder="Pickup"
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <input
        value={dropoff}
        onChange={(e) => setDropoff(e.target.value)}
        placeholder="Dropoff"
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <button onClick={createOrder} style={{ width: "100%", padding: 10 }}>
        Add Order
      </button>

      {/* ORDERS */}
      {orders.map((o) => (
        <div
          key={o.id}
          style={{
            border: "1px solid #ddd",
            marginTop: 10,
            padding: 10,
          }}
        >
          <p><b>Pickup:</b> {o.pickup_address}</p>
          <p><b>Dropoff:</b> {o.dropoff_address}</p>

          <p><b>Service:</b> {o.service_type}</p>

          {/* TIMESTAMPS */}
          <p>
            <b>Created:</b>{" "}
            {o.created_at ? new Date(o.created_at).toLocaleString() : "—"}
          </p>

          <p>
            <b>Updated:</b>{" "}
            {o.updated_at ? new Date(o.updated_at).toLocaleString() : "—"}
          </p>

          {/* DRIVER INSTRUCTIONS */}
          <div
            style={{
              background: "#f4f4f4",
              padding: 10,
              marginTop: 10,
              borderRadius: 8,
            }}
          >
            <b>Driver Instructions</b>

            <p>Service: <b>{o.service_type}</b></p>

            {o.service_type === "food" && (
              <p>🍔 Pick up food and deliver to customer. Keep items warm.</p>
            )}

            {o.service_type === "ride" && (
              <p>🚗 Pick up passenger and drop off safely.</p>
            )}

            {o.service_type === "courier" && (
              <p>📦 Handle package carefully. No food handling required.</p>
            )}
          </div>

          {/* JOB TYPE */}
          <p>
            <b>Job Type:</b>{" "}
            <span
              style={{
                color:
                  o.service_type === "food"
                    ? "green"
                    : o.service_type === "ride"
                    ? "blue"
                    : "purple",
              }}
            >
              {o.service_type}
            </span>
          </p>

          {/* ROUTE BUTTONS */}
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => changeRoute(o.id, "A")}>A</button>
            <button onClick={() => changeRoute(o.id, "B")}>B</button>
            <button onClick={() => changeRoute(o.id, "C")}>C</button>
          </div>

          {/* DRIVER DROPDOWN */}
          <select
            value={selectedDriver[o.id] ?? ""}
            onChange={(e) =>
              setSelectedDriver((prev) => ({
                ...prev,
                [o.id]: e.target.value,
              }))
            }
            style={{
              width: "100%",
              marginTop: 10,
              padding: 8,
            }}
          >
            <option value="">Select Driver</option>

            {drivers?.length > 0 ? (
              drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || `Driver ${d.id}`}
                </option>
              ))
            ) : (
              <option disabled>Loading drivers...</option>
            )}
          </select>

          {/* ASSIGN BUTTON */}
          <button
            onClick={() => assignDriver(o.id)}
            style={{
              width: "100%",
              marginTop: 10,
              padding: 8,
            }}
          >
            Assign Driver
          </button>

          {/* DELETE BUTTON */}
          <button
            onClick={() => deleteOrder(o.id)}
            style={{
              width: "100%",
              marginTop: 10,
              padding: 8,
              background: "red",
              color: "white",
            }}
          >
            Delete Order
          </button>

          {/* STATUS */}
          <p>
            Status:{" "}
            <span
              style={{
                color: o.status === "assigned" ? "green" : "orange",
              }}
            >
              {o.status || "pending"}
            </span>
          </p>

          {/* ⭐ RATING SYSTEM */}
          <div style={{ marginTop: 10 }}>
            <b>Rating:</b>

            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() =>
                  setRatings((prev) => ({
                    ...prev,
                    [o.id]: star,
                  }))
                }
                style={{
                  cursor: "pointer",
                  color: ratings[o.id] >= star ? "gold" : "#ccc",
                  fontSize: 20,
                }}
              >
                ★
              </span>
            ))}
          </div>

          {/* 💬 COMMENT BOX */}
          <textarea
            placeholder="Write feedback..."
            value={reviews[o.id] || ""}
            onChange={(e) =>
              setReviews((prev) => ({
                ...prev,
                [o.id]: e.target.value,
              }))
            }
            style={{
              width: "100%",
              marginTop: 10,
              padding: 8,
            }}
          />

          {/* 💾 SUBMIT REVIEW */}
          <button
            onClick={async () => {
              await axios.post(
                `http://127.0.0.1:8000/orders/${o.id}/review`,
                {
                  rating: ratings[o.id],
                  review: reviews[o.id],
                }
              );

              fetchOrders();
            }}
            style={{
              width: "100%",
              marginTop: 10,
              padding: 8,
              background: "black",
              color: "white",
            }}
          >
            Submit Review
          </button>

          {/* 📦 SHOW SAVED REVIEW */}
          {o.rating && (
            <p style={{ marginTop: 10 }}>
              ⭐ {o.rating}/5 — {o.review}
            </p>
          )}
        </div>
      ))}
    </div>

    {/* MAP PANEL (FIXED + INSIDE FLEX) */}
    <div style={{ width: "65%", height: "100vh" }}>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>

  </div>
);}