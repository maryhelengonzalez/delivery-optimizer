import { useEffect, useState } from "react";
import {
  getDrivers,
  getOrders,
  getDispatchPreview,
  createDriver,
  createOrder,
} from "../api/api";

export default function Dashboard() {
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dispatch, setDispatch] = useState(null);

  const [driverName, setDriverName] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  // Load all data
  const loadData = async () => {
    const d = await getDrivers();
    const o = await getOrders();
    const dis = await getDispatchPreview();

    setDrivers(d);
    setOrders(o);
    setDispatch(dis);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add driver
  const handleAddDriver = async () => {
    if (!driverName) return;

    await createDriver(driverName);
    setDriverName("");
    loadData();
  };

  // Add order
  const handleAddOrder = async () => {
    if (!pickup || !dropoff) return;

    await createOrder(pickup, dropoff);
    setPickup("");
    setDropoff("");
    loadData();
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🚚 Delivery Optimization Dashboard</h1>

      {/* STATS */}
      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <div>
          <h3>Drivers</h3>
          <p>{drivers.length}</p>
        </div>

        <div>
          <h3>Orders</h3>
          <p>{orders.length}</p>
        </div>

        <div>
          <h3>Dispatch Preview</h3>
          <p>Live</p>
        </div>
      </div>

      {/* ADD DRIVER */}
      <div style={{ marginTop: 30 }}>
        <h2>Add Driver</h2>
        <input
          placeholder="Driver name"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
        />
        <button onClick={handleAddDriver}>Add</button>
      </div>

      {/* ADD ORDER */}
      <div style={{ marginTop: 30 }}>
        <h2>Add Order</h2>
        <input
          placeholder="Pickup address"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
        />
        <input
          placeholder="Dropoff address"
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
        />
        <button onClick={handleAddOrder}>Add Order</button>
      </div>

      {/* DRIVERS LIST */}
      <div style={{ marginTop: 30 }}>
        <h2>Drivers</h2>
        {drivers.map((d) => (
          <div key={d.id}>
            {d.name} — {d.status} — cap: {d.capacity}
          </div>
        ))}
      </div>

      {/* ORDERS LIST */}
      <div style={{ marginTop: 30 }}>
        <h2>Orders</h2>
        {orders.map((o) => (
          <div key={o.id}>
            {o.pickup_address} → {o.dropoff_address} ({o.status})
          </div>
        ))}
      </div>

      {/* DISPATCH PREVIEW */}
      <div style={{ marginTop: 30 }}>
        <h2>Dispatch Preview</h2>

        {dispatch &&
          Object.entries(dispatch.suggested_batches).map(([driverId, batch]) => (
            <div key={driverId} style={{ marginBottom: 20 }}>
              <h4>Driver {driverId}</h4>

              {batch.map((o) => (
                <div key={o.id}>
                  📦 {o.pickup} → {o.dropoff}
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}