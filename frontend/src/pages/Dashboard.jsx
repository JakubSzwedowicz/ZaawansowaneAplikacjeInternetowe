import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

export default function Dashboard() {
  const [series, setSeries] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [seriesData, measurementsData] = await Promise.all([
        dataService.getSeries(),
        dataService.getMeasurements({ limit: 100 })
      ]);
      setSeries(seriesData);
      setMeasurements(measurementsData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: '#c00' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>

      <div style={{ marginTop: '2rem' }}>
        <h2>Series ({series.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {series.map((s) => (
            <div key={s.id} style={{
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              borderLeft: `4px solid ${s.color}`
            }}>
              <h3 style={{ margin: '0 0 0.5rem' }}>{s.name}</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                Unit: {s.unit} | Range: {s.min_value}-{s.max_value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Recent Measurements ({measurements.length})</h2>
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
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
              {measurements.slice(0, 20).map((m) => {
                const seriesObj = series.find(s => s.id === m.series_id);
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>{m.id}</td>
                    <td style={{ padding: '0.75rem' }}>{seriesObj?.name || m.series_id}</td>
                    <td style={{ padding: '0.75rem' }}>{m.value} {seriesObj?.unit}</td>
                    <td style={{ padding: '0.75rem' }}>{new Date(m.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>{m.sensor_id ? `Sensor ${m.sensor_id}` : 'Manual'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
