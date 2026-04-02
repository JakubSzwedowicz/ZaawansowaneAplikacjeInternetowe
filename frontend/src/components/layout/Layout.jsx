import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Layout() {
  const { user, logout, isAdmin, isContributor, isAuthenticated } = useAuth();
  const { theme, setTheme, themes } = useTheme();

  const themeLabels = { light: 'Light', dark: 'Dark', 'high-contrast': 'HC' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <nav className="site-nav" role="navigation" aria-label="Main navigation">
        <div className="nav-links">
          <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            IoT Platform
          </Link>
          <Link to="/">Dashboard</Link>
          <Link to="/browse">Browse</Link>
          <Link to="/search">Search</Link>
          {isContributor && <Link to="/my-series">My Series</Link>}
          {isAdmin && <Link to="/admin">Admin</Link>}
        </div>

        <div className="nav-right">
          <div className="theme-switcher" role="group" aria-label="Theme">
            {themes.map(t => (
              <button
                key={t}
                className={`theme-btn${theme === t ? ' active' : ''}`}
                onClick={() => setTheme(t)}
                aria-pressed={theme === t}
                title={t}
              >
                {themeLabels[t]}
              </button>
            ))}
          </div>

          {isAuthenticated ? (
            <>
              <Link to="/profile">
                {user?.username}
                {isAdmin && ' (Admin)'}
                {!isAdmin && isContributor && ' (Contributor)'}
              </Link>
              <button className="btn btn-outline" onClick={logout} style={{ color: 'var(--nav-text)', borderColor: 'var(--nav-text)' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">Login</Link>
              <Link to="/register" style={{ color: 'var(--nav-text)' }}>Register</Link>
            </>
          )}
        </div>
      </nav>

      <main id="main-content" style={{ flex: 1 }} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
