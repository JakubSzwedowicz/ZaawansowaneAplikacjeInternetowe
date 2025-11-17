import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        backgroundColor: '#333',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.25rem' }}>
            IoT Platform
          </Link>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
            Dashboard
          </Link>
          {isAuthenticated && isAdmin && (
            <Link to="/manage" style={{ color: 'white', textDecoration: 'none' }}>
              Manage
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>
                {user?.username} {isAdmin && '(Admin)'}
              </Link>
              <button
                onClick={logout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0066cc',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px'
              }}
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      <main style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
        <Outlet />
      </main>
    </div>
  );
}
