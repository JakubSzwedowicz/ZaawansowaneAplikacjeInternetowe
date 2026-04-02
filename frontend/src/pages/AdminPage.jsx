import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

function NewContentPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['new-content'],
    queryFn: dataService.getNewContent,
  });

  if (isLoading) return <p style={{ color: 'var(--text-muted)' }}>Loading...</p>;

  if (!data?.since) {
    return <p style={{ color: 'var(--text-muted)' }}>Log in and out to track new content since your last visit.</p>;
  }

  const since = new Date(data.since).toLocaleString();

  return (
    <div>
      <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Since your last login ({since}):
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '400px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{data.series_count}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>new series</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{data.measurements_count}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>new measurements</div>
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, onBlock, onUnblock }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (u.is_blocked) await onUnblock(u.id);
      else await onBlock(u.id);
    } finally {
      setLoading(false);
    }
  };

  const roleBadgeColor = { admin: '#dc3545', contributor: '#28a745', viewer: '#6c757d' };

  return (
    <tr>
      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>{u.username}</td>
      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>{u.email}</td>
      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', backgroundColor: roleBadgeColor[u.role] + '22', color: roleBadgeColor[u.role], border: `1px solid ${roleBadgeColor[u.role]}` }}>
          {u.role}
        </span>
      </td>
      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: u.is_blocked ? 'var(--danger)' : 'var(--success)', fontWeight: '500', fontSize: '0.875rem' }}>
          {u.is_blocked ? 'Blocked' : 'Active'}
        </span>
      </td>
      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}
      </td>
      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`btn ${u.is_blocked ? 'btn-outline' : 'btn-danger'}`}
          style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
        >
          {loading ? '...' : u.is_blocked ? 'Unblock' : 'Block'}
        </button>
      </td>
    </tr>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('new-content');

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: dataService.getUsers,
    enabled: tab === 'users',
  });

  const handleBlock = async (id) => {
    await dataService.blockUser(id);
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const handleUnblock = async (id) => {
    await dataService.unblockUser(id);
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const tabStyle = (t) => ({
    padding: '0.5rem 1.25rem',
    border: 'none',
    borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
    background: 'none',
    color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
    cursor: 'pointer',
    fontWeight: tab === t ? '600' : '400',
    fontSize: '0.95rem',
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Admin Panel</h1>

      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', gap: '0' }}>
        <button style={tabStyle('new-content')} onClick={() => setTab('new-content')}>New Content</button>
        <button style={tabStyle('users')} onClick={() => setTab('users')}>Users</button>
      </div>

      {tab === 'new-content' && (
        <section aria-label="New content since last login">
          <h2 className="section-title">New Since Last Login</h2>
          <NewContentPanel />
        </section>
      )}

      {tab === 'users' && (
        <section aria-label="User management">
          <h2 className="section-title">Users</h2>
          {loadingUsers ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading users...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--surface)' }}>
                <thead>
                  <tr>
                    {['Username', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(col => (
                      <th key={col} style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <UserRow
                      key={u.id}
                      u={u}
                      onBlock={handleBlock}
                      onUnblock={handleUnblock}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
