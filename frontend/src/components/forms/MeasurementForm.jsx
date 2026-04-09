import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { dataService } from '../../services/dataService';

const QUALITY_OPTIONS = ['', 'good', 'uncertain', 'bad'];

export default function MeasurementForm({ measurement, series, onSaved, onCancel }) {
  const [formData, setFormData] = useState({
    series_id: '',
    value: '',
    timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    note: '',
    quality: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (measurement) {
      setFormData({
        series_id: measurement.series_id,
        value: measurement.value,
        timestamp: format(new Date(measurement.timestamp), "yyyy-MM-dd'T'HH:mm"),
        note: measurement.note || '',
        quality: measurement.quality || '',
      });
    } else if (series.length > 0) {
      setFormData(prev => ({ ...prev, series_id: series[0].id }));
    }
  }, [measurement, series]);

  const validate = () => {
    const errs = {};
    if (!formData.series_id) errs.series_id = 'Please select a series';
    if (formData.value === '' || isNaN(formData.value)) {
      errs.value = 'Please enter a valid number';
    } else {
      const selectedSeries = series.find(s => s.id === parseInt(formData.series_id));
      if (selectedSeries) {
        const val = parseFloat(formData.value);
        if (val < selectedSeries.min_value || val > selectedSeries.max_value) {
          errs.value = `Value must be between ${selectedSeries.min_value} and ${selectedSeries.max_value} ${selectedSeries.unit}`;
        }
      }
    }
    if (!formData.timestamp) errs.timestamp = 'Please select a date and time';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        series_id: parseInt(formData.series_id),
        value: parseFloat(formData.value),
        timestamp: new Date(formData.timestamp).toISOString(),
        note: formData.note || null,
        quality: formData.quality || null,
      };
      if (measurement) {
        await dataService.updateMeasurement(measurement.id, payload);
      } else {
        await dataService.createMeasurement(payload);
      }
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      if (typeof msg === 'string' && (msg.includes('range') || msg.includes('value'))) {
        setErrors({ value: msg });
      } else {
        alert('Failed to save measurement: ' + msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const selectedSeries = series.find(s => s.id === parseInt(formData.series_id));

  const fieldStyle = (err) => ({
    width: '100%',
    padding: '0.5rem',
    border: `1px solid ${err ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: '4px',
    fontSize: '1rem',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  });

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="mf-series" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Series *</label>
        <select
          id="mf-series"
          name="series_id"
          value={formData.series_id}
          onChange={handleChange}
          disabled={!!measurement}
          style={{ ...fieldStyle(errors.series_id), cursor: measurement ? 'not-allowed' : 'pointer' }}
        >
          <option value="">Select a series...</option>
          {series.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
          ))}
        </select>
        {errors.series_id && <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.series_id}</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="mf-value" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
          Value *{selectedSeries && (
            <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {' '}(Range: {selectedSeries.min_value} – {selectedSeries.max_value} {selectedSeries.unit})
            </span>
          )}
        </label>
        <input
          id="mf-value"
          type="number"
          name="value"
          value={formData.value}
          onChange={handleChange}
          step="any"
          style={fieldStyle(errors.value)}
        />
        {errors.value && <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.value}</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="mf-timestamp" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Timestamp *</label>
        <input id="mf-timestamp" type="datetime-local" name="timestamp" value={formData.timestamp} onChange={handleChange} style={fieldStyle(errors.timestamp)} />
        {errors.timestamp && <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.timestamp}</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="mf-quality" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Quality</label>
        <select id="mf-quality" name="quality" value={formData.quality} onChange={handleChange} style={fieldStyle(false)}>
          {QUALITY_OPTIONS.map(q => (
            <option key={q} value={q}>{q || '— Not set —'}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="mf-note" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Note</label>
        <textarea id="mf-note" name="note" value={formData.note} onChange={handleChange} rows="2" placeholder="Optional note..." style={{ ...fieldStyle(false), fontFamily: 'inherit', resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Saving...' : measurement ? 'Update Measurement' : 'Create Measurement'}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting} className="btn btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}
