import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import SeriesForm from '../components/forms/SeriesForm';
import MeasurementForm from '../components/forms/MeasurementForm';

export default function ManagePage() {
  const [series, setSeries] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [activeTab, setActiveTab] = useState('series');
  const [editingSeries, setEditingSeries] = useState(null);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);

  // Measurements filtering
  const [selectedSeriesId, setSelectedSeriesId] = useState(null);
  const [measurementsLimit, setMeasurementsLimit] = useState(50);

  useEffect(() => {
    loadSeries();
  }, []);

  useEffect(() => {
    if (selectedSeriesId) {
      loadMeasurementsForSeries(selectedSeriesId);
    }
  }, [selectedSeriesId, measurementsLimit]);

  const loadSeries = async () => {
    try {
      setLoading(true);
      const seriesData = await dataService.getSeries();
      // Ensure seriesData is an array
      if (Array.isArray(seriesData)) {
        setSeries(seriesData);
        // Auto-select first series
        if (seriesData.length > 0 && !selectedSeriesId) {
          setSelectedSeriesId(seriesData[0].id);
        }
      } else {
        console.error('Series data is not an array:', seriesData);
        setSeries([]);
      }
    } catch (err) {
      console.error('Failed to load series:', err);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMeasurementsForSeries = async (seriesId) => {
    try {
      setLoadingMeasurements(true);
      const measurementsData = await dataService.getMeasurements({
        series_ids: seriesId.toString(),
        limit: measurementsLimit
      });
      // Ensure measurementsData is an array
      if (Array.isArray(measurementsData)) {
        setMeasurements(measurementsData);
      } else {
        console.error('Measurements data is not an array:', measurementsData);
        setMeasurements([]);
      }
    } catch (err) {
      console.error('Failed to load measurements:', err);
      setMeasurements([]);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const handleDeleteSeries = async (id) => {
    if (!window.confirm('Are you sure you want to delete this series? All measurements will be deleted too.')) {
      return;
    }
    try {
      await dataService.deleteSeries(id);
      await loadSeries();
      // If deleted series was selected, select another
      if (selectedSeriesId === id && series.length > 1) {
        const otherSeries = series.find(s => s.id !== id);
        setSelectedSeriesId(otherSeries?.id || null);
      }
    } catch (err) {
      alert('Failed to delete series: ' + err.message);
    }
  };

  const handleDeleteMeasurement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this measurement?')) {
      return;
    }
    try {
      await dataService.deleteMeasurement(id);
      if (selectedSeriesId) {
        await loadMeasurementsForSeries(selectedSeriesId);
      }
    } catch (err) {
      alert('Failed to delete measurement: ' + err.message);
    }
  };

  const handleSeriesSaved = () => {
    setShowSeriesForm(false);
    setEditingSeries(null);
    loadSeries();
  };

  const handleMeasurementSaved = () => {
    setShowMeasurementForm(false);
    setEditingMeasurement(null);
    if (selectedSeriesId) {
      loadMeasurementsForSeries(selectedSeriesId);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Data Management</h1>

      <div style={{ marginTop: '2rem', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('series')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            backgroundColor: activeTab === 'series' ? '#007bff' : 'transparent',
            color: activeTab === 'series' ? 'white' : '#333',
            fontWeight: '500',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Series ({series.length})
        </button>
        <button
          onClick={() => setActiveTab('measurements')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            backgroundColor: activeTab === 'measurements' ? '#007bff' : 'transparent',
            color: activeTab === 'measurements' ? 'white' : '#333',
            fontWeight: '500',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Measurements{selectedSeriesId && measurements.length > 0 ? ` (${measurements.length} for ${series.find(s => s.id === selectedSeriesId)?.name})` : ''}
        </button>
      </div>

      {activeTab === 'series' && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Series</h2>
            <button
              onClick={() => {
                setEditingSeries(null);
                setShowSeriesForm(true);
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              + Add New Series
            </button>
          </div>

          {showSeriesForm && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h3>{editingSeries ? 'Edit Series' : 'Create New Series'}</h3>
              <SeriesForm
                series={editingSeries}
                onSaved={handleSeriesSaved}
                onCancel={() => {
                  setShowSeriesForm(false);
                  setEditingSeries(null);
                }}
              />
            </div>
          )}

          <div style={{ display: 'grid', gap: '1rem' }}>
            {series.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${s.color}`,
                  backgroundColor: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem' }}>{s.name}</h3>
                    {s.description && (
                      <p style={{ margin: '0 0 0.75rem', color: '#666', fontSize: '0.875rem' }}>
                        {s.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
                      <span><strong>Unit:</strong> {s.unit}</span>
                      <span><strong>Range:</strong> {s.min_value} - {s.max_value}</span>
                      <span><strong>Color:</strong> <span style={{ color: s.color }}>{s.color}</span></span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setEditingSeries(s);
                        setShowSeriesForm(true);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSeries(s.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'measurements' && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Measurements</h2>
            <button
              onClick={() => {
                setEditingMeasurement(null);
                setShowMeasurementForm(true);
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              + Add New Measurement
            </button>
          </div>

          {showMeasurementForm && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h3>{editingMeasurement ? 'Edit Measurement' : 'Create New Measurement'}</h3>
              <MeasurementForm
                measurement={editingMeasurement}
                series={series}
                onSaved={handleMeasurementSaved}
                onCancel={() => {
                  setShowMeasurementForm(false);
                  setEditingMeasurement(null);
                }}
              />
            </div>
          )}

          {/* Series Filter */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                Filter by Series:
              </label>
              <select
                value={selectedSeriesId || ''}
                onChange={(e) => setSelectedSeriesId(parseInt(e.target.value))}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  minWidth: '200px'
                }}
              >
                {series.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.unit})
                  </option>
                ))}
              </select>

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem' }}>Show:</label>
                <select
                  value={measurementsLimit === 10000 ? 'all' : measurementsLimit}
                  onChange={(e) => setMeasurementsLimit(e.target.value === 'all' ? 10000 : parseInt(e.target.value))}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value={50}>50 measurements</option>
                  <option value={100}>100 measurements</option>
                  <option value={200}>200 measurements</option>
                  <option value={500}>500 measurements</option>
                  <option value="all">All measurements</option>
                </select>
              </div>
            </div>
          </div>

          {loadingMeasurements ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              Loading measurements...
            </div>
          ) : measurements.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              color: '#666'
            }}>
              No measurements found for this series. Click "+ Add New Measurement" to create one.
            </div>
          ) : (
            <>
              <div style={{
                marginBottom: '1rem',
                fontSize: '0.875rem',
                color: '#666',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Showing {measurements.length} measurements for <strong>{series.find(s => s.id === selectedSeriesId)?.name}</strong></span>
                <span>Sorted by timestamp (oldest first)</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Timestamp</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Source</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((m) => {
                      const seriesObj = series.find(s => s.id === m.series_id);
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.75rem', color: '#666' }}>#{m.id}</td>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                            {m.value.toFixed(2)} {seriesObj?.unit}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {new Date(m.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: m.sensor_id ? '#e3f2fd' : '#fff3e0',
                              color: m.sensor_id ? '#1976d2' : '#e65100',
                              borderRadius: '3px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {m.sensor_id ? `Sensor ${m.sensor_id}` : 'Manual'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setEditingMeasurement(m);
                                setShowMeasurementForm(true);
                              }}
                              style={{
                                padding: '0.25rem 0.75rem',
                                marginRight: '0.5rem',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMeasurement(m.id)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
