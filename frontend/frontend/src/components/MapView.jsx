import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix marker icons (VERY IMPORTANT for React Leaflet)
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function MapView({ orders = [] }) {
  // Default center (NYC area)
  const center = [40.73, -73.98];

  return (
    <MapContainer center={center} zoom={12} style={{ height: "500px", width: "100%" }}>
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {orders.map((order) => {
        const route = order.routes?.A?.geometry || [];

        // convert [lon, lat] → [lat, lon]
        const path = route.map(([lng, lat]) => [lat, lng]);

        return (
          <div key={order.id}>
            {/* Pickup marker */}
            {order.pickup_lat && (
              <Marker position={[order.pickup_lat, order.pickup_lon]} />
            )}

            {/* Dropoff marker */}
            {order.dropoff_lat && (
              <Marker position={[order.dropoff_lat, order.dropoff_lon]} />
            )}

            {/* Route line */}
            {path.length > 0 && (
              <Polyline positions={path} color="blue" />
            )}
          </div>
        );
      })}
    </MapContainer>
  );
}