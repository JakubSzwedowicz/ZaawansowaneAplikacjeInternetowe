import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import SeriesForm from '../components/forms/SeriesForm';

export default function MySeriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

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
            <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
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
                <button className="btn btn-outline" onClick={() => setEditing(s)}>Edit</button>
                <button className="btn btn-danger" onClick={() => handleDelete(s.id, s.name)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
