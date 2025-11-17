import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { dataService } from '../../services/dataService';

export default function MeasurementForm({ measurement, series, onSaved, onCancel }) {
  const [formData, setFormData] = useState({
    series_id: '',
    value: '',
    timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (measurement) {
      setFormData({
        series_id: measurement.series_id,
        value: measurement.value,
        timestamp: format(new Date(measurement.timestamp), "yyyy-MM-dd'T'HH:mm")
      });
    } else if (series.length > 0) {
      setFormData(prev => ({
        ...prev,
        series_id: series[0].id
      }));
    }
  }, [measurement, series]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.series_id) {
      newErrors.series_id = 'Please select a series';
    }
    
    if (formData.value === '' || isNaN(formData.value)) {
      newErrors.value = 'Please enter a valid number';
    } else {
      // Validate against series min/max
      const selectedSeries = series.find(s => s.id === parseInt(formData.series_id));
      if (selectedSeries) {
        const val = parseFloat(formData.value);
        if (val < selectedSeries.min_value || val > selectedSeries.max_value) {
          newErrors.value = `Value must be between ${selectedSeries.min_value} and ${selectedSeries.max_value} ${selectedSeries.unit}`;
        }
      }
    }
    
    if (!formData.timestamp) {
      newErrors.timestamp = 'Please select a date and time';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const payload = {
        series_id: parseInt(formData.series_id),
        value: parseFloat(formData.value),
        timestamp: new Date(formData.timestamp).toISOString()
      };
      
      if (measurement) {
        await dataService.updateMeasurement(measurement.id, payload);
      } else {
        await dataService.createMeasurement(payload);
      }
      onSaved();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      if (typeof errorMsg === 'string' && errorMsg.includes('min_value') || errorMsg.includes('max_value')) {
        setErrors({ value: errorMsg });
      } else {
        alert('Failed to save measurement: ' + errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? value : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const selectedSeries = series.find(s => s.id === parseInt(formData.series_id));

  return (
    <form onSubmit={handleSubmit} onKeyPress={handleKeyPress} style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
          Series *
        </label>
        <select
          name="series_id"
          value={formData.series_id}
          onChange={handleChange}
          disabled={!!measurement}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: errors.series_id ? '1px solid #dc3545' : '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            backgroundColor: measurement ? '#f5f5f5' : 'white',
            cursor: measurement ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">Select a series...</option>
          {series.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.unit})
            </option>
          ))}
        </select>
        {errors.series_id && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.series_id}</span>}
        {measurement && (
          <span style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>
            Cannot change series for existing measurement
          </span>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
          Value * {selectedSeries && (
            <span style={{ fontWeight: 'normal', color: '#666', fontSize: '0.875rem' }}>
              (Range: {selectedSeries.min_value} - {selectedSeries.max_value} {selectedSeries.unit})
            </span>
          )}
        </label>
        <input
          type="number"
          name="value"
          value={formData.value}
          onChange={handleChange}
          step="any"
          placeholder={selectedSeries ? `Enter value in ${selectedSeries.unit}` : 'Enter value'}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: errors.value ? '1px solid #dc3545' : '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
        {errors.value && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.value}</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
          Timestamp *
        </label>
        <input
          type="datetime-local"
          name="timestamp"
          value={formData.timestamp}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: errors.timestamp ? '1px solid #dc3545' : '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
        {errors.timestamp && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.timestamp}</span>}
      </div>

      <div style={{ 
        padding: '0.75rem', 
        backgroundColor: '#e7f3ff', 
        borderRadius: '4px', 
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        color: '#004085'
      }}>
        💡 Tip: Press <kbd style={{ padding: '0.1rem 0.3rem', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '3px' }}>Enter</kbd> to submit the form quickly
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: submitting ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '1rem'
          }}
        >
          {submitting ? 'Saving...' : measurement ? 'Update Measurement' : 'Create Measurement'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'white',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
