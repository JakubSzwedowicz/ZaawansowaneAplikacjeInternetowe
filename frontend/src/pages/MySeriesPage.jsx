import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import SeriesForm from '../components/forms/SeriesForm';
import MeasurementForm from '../components/forms/MeasurementForm';

function MeasurementPanel({ series, onClose }) {
  const queryClient = useQueryClient();
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: measurements = [], isLoading } = useQuery({
    queryKey: ['measurements', series.id],
    queryFn: () => dataService.getMeasurements({ series_ids: String(series.id), limit: 100 }),
  });

  const handleDelete = async (m) => {
    if (!confirm(`Delete measurement from ${format(new Date(m.timestamp), 'yyyy-MM-dd HH:mm')}?`)) return;
    try {
      await dataService.deleteMeasurement(m.id);
      queryClient.invalidateQueries({ queryKey: ['measurements', series.id] });
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSaved = () => {
    setShowAdd(false);
    setEditingMeasurement(null);
    queryClient.invalidateQueries({ queryKey: ['measurements', series.id] });
  };

  if (showAdd || editingMeasurement) {
    return (
      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--surface-alt)', borderRadius: '4px', border: '1px solid var(--border)' }}>
        <h4 style={{ margin: '0 0 1rem', color: 'var(--text)' }}>
          {editingMeasurement ? 'Edit Measurement' : 'Add Measurement'}
        </h4>
        <MeasurementForm
          measurement={editingMeasurement}
          series={[series]}
          onSaved={handleSaved}
          onCancel={() => { setShowAdd(false); setEditingMeasurement(null); }}
        />
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem' }}>
          Measurements ({isLoading ? '…' : measurements.length})
        </h4>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }} onClick={() => setShowAdd(true)}>
            + Add
          </button>
          <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }} onClick={onClose}>
            Hide
          </button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>
      ) : measurements.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No measurements yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', color: 'var(--text-muted)', fontWeight: '600' }}>Timestamp</th>
                <th style={{ textAlign: 'right', padding: '0.4rem 0.6rem', color: 'var(--text-muted)', fontWeight: '600' }}>Value ({series.unit})</th>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', color: 'var(--text-muted)', fontWeight: '600' }}>Quality</th>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', color: 'var(--text-muted)', fontWeight: '600' }}>Note</th>
                <th style={{ padding: '0.4rem 0.6rem' }} />
              </tr>
            </thead>
            <tbody>
              {measurements.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text)' }}>
                    {format(new Date(m.timestamp), 'yyyy-MM-dd HH:mm')}
                  </td>
                  <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text)', textAlign: 'right' }}>{m.value}</td>
                  <td style={{ padding: '0.4rem 0.6rem' }}>
                    {m.quality && (
                      <span className={`badge badge-${m.quality}`}>{m.quality}</span>
                    )}
                  </td>
                  <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-muted)' }}>{m.note || '—'}</td>
                  <td style={{ padding: '0.4rem 0.6rem', display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => setEditingMeasurement(m)}>Edit</button>
                    <button className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => handleDelete(m)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MySeriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedMeasurements, setExpandedMeasurements] = useState(null);

  const { data: series = [], isLoading } = useQuery({
    queryKey: ['my-series', user?.id],
    queryFn: () => dataService.getSeries({ creator_id: user?.id }),
    enabled: !!user,
  });

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete series "${name}"? This will also delete all its measurements.`)) return;
    try {
      await dataService.deleteSeries(id);
      queryClient.invalidateQueries({ queryKey: ['my-series'] });
      if (expandedMeasurements === id) setExpandedMeasurements(null);
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSaved = () => {
    setEditing(null);
    setShowCreate(false);
    queryClient.invalidateQueries({ queryKey: ['my-series'] });
    queryClient.invalidateQueries({ queryKey: ['series'] });
  };

  if (editing) {
    return (
      <div className="page-container">
        <h1 className="page-title">Edit Series</h1>
        <SeriesForm series={editing} onSaved={handleSaved} onCancel={() => setEditing(null)} />
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="page-container">
        <h1 className="page-title">New Series</h1>
        <SeriesForm onSaved={handleSaved} onCancel={() => setShowCreate(false)} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>My Series</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Series</button>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : series.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any series yet.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: '1rem' }}>
            Create your first series
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {series.map(s => (
            <div key={s.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: s.color, display: 'inline-block' }} />
                    <h3 style={{ margin: 0, color: 'var(--text)' }}>{s.name}</h3>
                  </div>
                  {s.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{s.description}</p>}
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {s.unit} · Range: {s.min_value} – {s.max_value}
                  </p>
                  {s.tags?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {s.tags.map(tag => <span key={tag} className="badge">{tag}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => setExpandedMeasurements(expandedMeasurements === s.id ? null : s.id)}
                  >
                    {expandedMeasurements === s.id ? 'Hide Measurements' : 'Measurements'}
                  </button>
                  <button className="btn btn-outline" onClick={() => setEditing(s)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(s.id, s.name)}>Delete</button>
                </div>
              </div>

              {expandedMeasurements === s.id && (
                <MeasurementPanel
                  series={s}
                  onClose={() => setExpandedMeasurements(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
