import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dataService } from '../services/dataService';

function LocationTree({ nodes, currentId, onSelect }) {
  return (
    <ul className="location-tree" role="tree">
      {nodes.map(node => (
        <li key={node.id} role="treeitem" aria-expanded={node.children?.length > 0 ? true : undefined}>
          <button
            className={`location-item${currentId === node.id ? ' active' : ''}`}
            onClick={() => onSelect(node.id)}
            aria-current={currentId === node.id ? 'page' : undefined}
          >
            {node.name}
            {node.children?.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.7 }}>▶</span>}
          </button>
          {node.children?.length > 0 && (
            <ul className="location-tree" role="group">
              {node.children.map(child => (
                <li key={child.id} role="treeitem">
                  <button
                    className={`location-item${currentId === child.id ? ' active' : ''}`}
                    onClick={() => onSelect(child.id)}
                    aria-current={currentId === child.id ? 'page' : undefined}
                  >
                    {child.name}
                  </button>
                  {child.children?.length > 0 && (
                    <LocationTree nodes={child.children} currentId={currentId} onSelect={onSelect} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function BrowsePage() {
  const navigate = useNavigate();
  const { locationId } = useParams();
  const currentLocationId = locationId ? parseInt(locationId) : null;

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: dataService.getLocations,
  });

  const { data: series = [], isLoading: loadingSeries } = useQuery({
    queryKey: ['series', 'browse', currentLocationId],
    queryFn: () => dataService.getSeries(currentLocationId ? { location_id: currentLocationId } : {}),
  });

  const buildBreadcrumb = (nodes, targetId, path = []) => {
    for (const node of nodes) {
      const newPath = [...path, node];
      if (node.id === targetId) return newPath;
      const found = buildBreadcrumb(node.children || [], targetId, newPath);
      if (found) return found;
    }
    return null;
  };

  const breadcrumb = currentLocationId ? buildBreadcrumb(locations, currentLocationId) : null;
  const currentLocation = breadcrumb ? breadcrumb[breadcrumb.length - 1] : null;

  const handleLocationSelect = (id) => {
    navigate(`/browse/${id}`);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Browse by Location</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        <nav aria-label="Locations" style={{ borderRight: '1px solid var(--border)', paddingRight: '1.5rem' }}>
          <button
            className={`location-item${!currentLocationId ? ' active' : ''}`}
            onClick={() => navigate('/browse')}
            style={{ marginBottom: '0.5rem' }}
          >
            All locations
          </button>
          {loadingLocations ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</p>
          ) : (
            <LocationTree nodes={locations} currentId={currentLocationId} onSelect={handleLocationSelect} />
          )}
        </nav>

        <main>
          {breadcrumb && (
            <div style={{ marginBottom: '1.5rem' }}>
              <nav aria-label="Breadcrumb">
                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '0.35rem', flexWrap: 'wrap', fontSize: '0.875rem', alignItems: 'center' }}>
                  <li><Link to="/browse" style={{ color: 'var(--primary)' }}>All</Link></li>
                  {breadcrumb.map((loc, i) => (
                    <span key={loc.id} style={{ display: 'contents' }}>
                      <li aria-hidden style={{ color: 'var(--text-muted)' }}>›</li>
                      <li aria-current={i === breadcrumb.length - 1 ? 'page' : undefined}>
                        {i === breadcrumb.length - 1
                          ? <span style={{ color: 'var(--text)' }}>{loc.name}</span>
                          : <Link to={`/browse/${loc.id}`} style={{ color: 'var(--primary)' }}>{loc.name}</Link>
                        }
                      </li>
                    </span>
                  ))}
                </ol>
              </nav>
              {currentLocation.description && (
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>{currentLocation.description}</p>
              )}
            </div>
          )}

          {loadingSeries ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading series...</p>
          ) : series.length === 0 ? (
            <div className="empty-state">
              <p>No series found in this location.</p>
              {currentLocationId && <Link to="/browse">Browse all locations</Link>}
            </div>
          ) : (
            <>
              <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {series.length} series found
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {series.map(s => (
                  <div key={s.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: s.color, flexShrink: 0, display: 'inline-block' }} />
                      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>{s.name}</h3>
                    </div>
                    {s.description && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{s.description}</p>
                    )}
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Unit: {s.unit}</p>
                    {s.tags?.length > 0 && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {s.tags.map(tag => (
                          <Link key={tag} to={`/search?tag=${encodeURIComponent(tag)}`} className="badge">{tag}</Link>
                        ))}
                      </div>
                    )}
                    <Link to={`/?series=${s.id}`} style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--primary)' }}>
                      View measurements →
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
