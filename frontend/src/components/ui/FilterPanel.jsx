import { useState } from 'react';
import { format, subDays } from 'date-fns';

export default function FilterPanel({ series, selectedSeries, onSeriesChange, dateRange, onDateRangeChange }) {
  const [startDate, setStartDate] = useState(dateRange.start || format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(dateRange.end || format(new Date(), 'yyyy-MM-dd'));

  const handleSeriesToggle = (seriesId) => {
    if (selectedSeries.includes(seriesId)) {
      onSeriesChange(selectedSeries.filter(id => id !== seriesId));
    } else {
      onSeriesChange([...selectedSeries, seriesId]);
    }
  };

  const handleSelectAll = () => {
    onSeriesChange(series.map(s => s.id));
  };

  const handleDeselectAll = () => {
    onSeriesChange([]);
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

  return (
    <div className="filter-panel" style={{ 
      padding: '1.5rem', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '4px',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{ margin: '0 0 1rem' }}>Filters</h3>

      {/* Series Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label style={{ fontWeight: '500' }}>Series:</label>
          <div>
            <button 
              onClick={handleSelectAll}
              style={{
                padding: '0.25rem 0.75rem',
                marginRight: '0.5rem',
                fontSize: '0.875rem',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Select All
            </button>
            <button 
              onClick={handleDeselectAll}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.875rem',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {series.map(s => (
            <label 
              key={s.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                padding: '0.5rem',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #ddd',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={selectedSeries.includes(s.id)}
                onChange={() => handleSeriesToggle(s.id)}
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: s.color,
                marginRight: '0.5rem'
              }}></span>
              <span style={{ fontSize: '0.875rem' }}>{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.75rem' }}>Date Range:</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          />
          <button
            onClick={handleApplyDateRange}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Apply
          </button>
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => handleQuickRange(1)} style={quickButtonStyle}>Last 24h</button>
          <button onClick={() => handleQuickRange(7)} style={quickButtonStyle}>Last 7 days</button>
          <button onClick={() => handleQuickRange(30)} style={quickButtonStyle}>Last 30 days</button>
        </div>
      </div>
    </div>
  );
}

const quickButtonStyle = {
  padding: '0.35rem 0.75rem',
  fontSize: '0.75rem',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  borderRadius: '4px',
  cursor: 'pointer'
};
