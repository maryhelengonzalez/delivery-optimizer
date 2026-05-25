import { useState } from "react";
import axios from "axios";

export default function OrderCard({ order }) {
  const [selected, setSelected] = useState(order.route_type);

  const selectRoute = async (routeType) => {
    try {
      await axios.post("http://127.0.0.1:8000/select-route", {
        order_id: order.id,
        route_type: routeType,
      });

      setSelected(routeType);
    } catch (err) {
      console.log("Error selecting route", err);
    }
  };

  return (
    <div className="border p-4 rounded-xl mb-4 shadow">

      {/* ---------------- ORDER INFO ---------------- */}
      <p className="font-bold">
        {order.pickup_address} → {order.dropoff_address}
      </p>

      {/* ---------------- STATUS (FIXED) ---------------- */}
      <div style={{ marginTop: 5, fontWeight: "bold" }}>
        Status: {order.status || "pending"}
      </div>

      {/* ---------------- ROUTE BUTTONS ---------------- */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => selectRoute("A")}
          className={`px-3 py-1 rounded ${
            selected === "A" ? "bg-green-500 text-white" : "bg-gray-200"
          }`}
        >
          🟢 Route A
        </button>

        <button
          onClick={() => selectRoute("B")}
          className={`px-3 py-1 rounded ${
            selected === "B" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          🔵 Route B
        </button>

        <button
          onClick={() => selectRoute("C")}
          className={`px-3 py-1 rounded ${
            selected === "C" ? "bg-yellow-500 text-white" : "bg-gray-200"
          }`}
        >
          🟡 Route C
        </button>
      </div>

      {/* ---------------- DEBUG INFO ---------------- */}
      <p className="mt-2 text-sm">
        Selected Route: {selected || "none"}
      </p>
    </div>
  );
}