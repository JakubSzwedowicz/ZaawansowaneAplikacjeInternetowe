export default function MeasurementTable({ measurements, series, highlightedId, onRowClick }) {
  if (measurements.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        No measurements to display
      </div>
    );
  }

  return (
    <div className="table-container" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Series</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Timestamp</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Source</th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((m) => {
            const seriesObj = series.find(s => s.id === m.series_id);
            const isHighlighted = m.id === highlightedId;
            
            return (
              <tr 
                key={m.id} 
                data-id={m.id}
                onClick={() => onRowClick && onRowClick(m.id)}
                style={{ 
                  borderBottom: '1px solid #eee',
                  backgroundColor: isHighlighted ? '#fff3cd' : 'transparent',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (onRowClick && !isHighlighted) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (onRowClick && !isHighlighted) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <td style={{ padding: '0.75rem' }}>{m.id}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: seriesObj?.color || '#999',
                    marginRight: '0.5rem'
                  }}></span>
                  {seriesObj?.name || `Series ${m.series_id}`}
                </td>
                <td style={{ padding: '0.75rem', fontWeight: isHighlighted ? 'bold' : 'normal' }}>
                  {m.value.toFixed(2)} {seriesObj?.unit}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {new Date(m.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {m.sensor_id ? `Sensor ${m.sensor_id}` : 'Manual'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
