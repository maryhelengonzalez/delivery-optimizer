export default function DispatchPanel({ dispatch }) {
  return (
    <div className="card">
      <h2>🚚 Dispatch Preview</h2>

      {dispatch ? (
        <>
          <p>Drivers: {dispatch.available_drivers}</p>
          <p>Orders: {dispatch.pending_orders}</p>

          <pre style={{ fontSize: 12 }}>
            {JSON.stringify(dispatch.suggested_batches, null, 2)}
          </pre>
        </>
      ) : (
        <p>Loading dispatch...</p>
      )}
    </div>
  );
}