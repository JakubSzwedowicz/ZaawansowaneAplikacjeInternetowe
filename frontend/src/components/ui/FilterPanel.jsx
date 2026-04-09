import { useState } from 'react';
import { format, subDays } from 'date-fns';

export default function FilterPanel({ series, selectedSeries, onSeriesChange, dateRange, onDateRangeChange, onQualityChange, quality }) {
  const [startDate, setStartDate] = useState(dateRange.start || format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(dateRange.end || format(new Date(), 'yyyy-MM-dd'));

  const handleSeriesToggle = (seriesId) => {
    if (selectedSeries.includes(seriesId)) {
      onSeriesChange(selectedSeries.filter(id => id !== seriesId));
    } else {
      onSeriesChange([...selectedSeries, seriesId]);
    }
  };

  const handleApplyDateRange = () => {
    onDateRangeChange({ start: startDate, end: endDate });
  };

  const handleQuickRange = (days) => {
    const end = format(new Date(), 'yyyy-MM-dd');
    const start = format(subDays(new Date(), days), 'yyyy-MM-dd');
    setStartDate(start);
    setEndDate(end);
    onDateRangeChange({ start, end });
  };

  const inputStyle = {
    padding: '0.5rem',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    fontSize: '0.875rem',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  };

  const smallBtnStyle = {
    padding: '0.35rem 0.75rem',
    fontSize: '0.75rem',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  return (
    <div className="filter-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-alt)', borderRadius: '4px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
      <h3 style={{ margin: '0 0 1rem', color: 'var(--text)' }}>Filters</h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label style={{ fontWeight: '500', color: 'var(--text)' }}>Series:</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => onSeriesChange(series.map(s => s.id))} style={smallBtnStyle}>Select All</button>
            <button onClick={() => onSeriesChange([])} style={smallBtnStyle}>Clear</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {series.map(s => (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', backgroundColor: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={selectedSeries.includes(s.id)}
                onChange={() => handleSeriesToggle(s.id)}
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: s.color, marginRight: '0.5rem', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem' }}>{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.75rem', color: 'var(--text)' }}>Date Range:</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label htmlFor="fp-start" style={{ fontSize: '0.875rem', color: 'var(--text)' }}>From</label>
          <input id="fp-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          <label htmlFor="fp-end" style={{ fontSize: '0.875rem', color: 'var(--text)' }}>to</label>
          <input id="fp-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          <button onClick={handleApplyDateRange} className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>Apply</button>
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => handleQuickRange(1)} style={smallBtnStyle}>Last 24h</button>
          <button onClick={() => handleQuickRange(7)} style={smallBtnStyle}>Last 7 days</button>
          <button onClick={() => handleQuickRange(30)} style={smallBtnStyle}>Last 30 days</button>
        </div>
      </div>

      {onQualityChange && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>Quality:</label>
          <select
            value={quality || ''}
            onChange={(e) => onQualityChange(e.target.value || null)}
            style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}
          >
            <option value="">All</option>
            <option value="good">Good</option>
            <option value="uncertain">Uncertain</option>
            <option value="bad">Bad</option>
          </select>
        </div>
      )}

    </div>
  );
}
