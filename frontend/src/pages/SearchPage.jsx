import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../services/dataService';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [submitted, setSubmitted] = useState(!!(searchParams.get('q') || searchParams.get('tag')));

  const { data: results = [], isLoading, isFetching } = useQuery({
    queryKey: ['search', searchParams.get('q'), searchParams.get('tag')],
    queryFn: () => dataService.getSeries({
      q: searchParams.get('q') || undefined,
      tag: searchParams.get('tag') || undefined,
    }),
    enabled: submitted,
  });

  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => dataService.getTags(),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (tag.trim()) params.tag = tag.trim();
    setSearchParams(params);
    setSubmitted(true);
  };

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const tagParam = searchParams.get('tag') || '';
    setQ(qParam);
    setTag(tagParam);
  }, [searchParams]);

  return (
    <div className="page-container">
      <h1 className="page-title">Search</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label htmlFor="search-q" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--text)' }}>
              Search by name or description
            </label>
            <input
              id="search-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. temperature, humidity..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '1rem', backgroundColor: 'var(--input-bg)', color: 'var(--text)' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label htmlFor="search-tag" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--text)' }}>
              Filter by tag
            </label>
            <input
              id="search-tag"
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. indoor, energy..."
              list="tag-suggestions"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '1rem', backgroundColor: 'var(--input-bg)', color: 'var(--text)' }}
            />
            <datalist id="tag-suggestions">
              {allTags.map(t => <option key={t.id} value={t.name} />)}
            </datalist>
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', whiteSpace: 'nowrap' }}>
            Search
          </button>
        </div>
      </form>

      {allTags.length > 0 && !submitted && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Browse by tag:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {allTags.map(t => (
              <button
                key={t.id}
                className="badge"
                onClick={() => { setTag(t.name); setSearchParams({ tag: t.name }); setSubmitted(true); }}
                style={{ cursor: 'pointer', background: 'none', border: '1px solid var(--border)' }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {submitted && (
        <>
          {isLoading || isFetching ? (
            <p style={{ color: 'var(--text-muted)' }}>Searching...</p>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <p>No results found.</p>
              <p style={{ fontSize: '0.875rem' }}>Try different keywords or browse by location.</p>
              <Link to="/browse" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>Browse locations →</Link>
            </div>
          ) : (
            <>
              <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {results.length} result{results.length !== 1 ? 's' : ''}
                {searchParams.get('q') && ` for "${searchParams.get('q')}"`}
                {searchParams.get('tag') && ` tagged "${searchParams.get('tag')}"`}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {results.map(s => (
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
                        {s.tags.map(t => (
                          <span key={t} className="badge">{t}</span>
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
        </>
      )}
    </div>
  );
}
