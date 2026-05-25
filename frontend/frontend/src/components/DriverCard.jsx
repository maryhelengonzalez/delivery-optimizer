export default function DriverCard({ driver }) {
  return (
    <div className="card">
      <strong>{driver.name}</strong>
      <p>Status: {driver.status}</p>
      <p>Capacity: {driver.capacity}</p>
    </div>
  );
}