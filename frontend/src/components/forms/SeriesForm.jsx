import { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';

export default function SeriesForm({ series, onSaved, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    min_value: 0,
    max_value: 100,
    color: '#007bff'
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (series) {
      setFormData({
        name: series.name || '',
        description: series.description || '',
        unit: series.unit || '',
        min_value: series.min_value || 0,
        max_value: series.max_value || 100,
        color: series.color || '#007bff'
      });
    }
  }, [series]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }
    
    if (formData.min_value >= formData.max_value) {
      newErrors.min_value = 'Min value must be less than max value';
      newErrors.max_value = 'Max value must be greater than min value';
    }
    
    if (!formData.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      newErrors.color = 'Color must be a valid hex color (e.g., #FF5733)';
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
      if (series) {
        await dataService.updateSeries(series.id, formData);
      } else {
        await dataService.createSeries(formData);
      }
      onSaved();
    } catch (err) {
      alert('Failed to save series: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
          Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: errors.name ? '1px solid #dc3545' : '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
        {errors.name && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.name}</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
          Unit *
        </label>
        <input
          type="text"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          placeholder="e.g., °C, kWh, %"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: errors.unit ? '1px solid #dc3545' : '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
        {errors.unit && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.unit}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
            Min Value *
          </label>
          <input
            type="number"
            name="min_value"
            value={formData.min_value}
            onChange={handleChange}
            step="any"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: errors.min_value ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
          {errors.min_value && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.min_value}</span>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
            Max Value *
          </label>
          <input
            type="number"
            name="max_value"
            value={formData.max_value}
            onChange={handleChange}
            step="any"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: errors.max_value ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
          {errors.max_value && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.max_value}</span>}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
          Color *
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            style={{
              width: '60px',
              height: '40px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          />
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="#FF5733"
            style={{
              flex: 1,
              padding: '0.5rem',
              border: errors.color ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        {errors.color && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.color}</span>}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
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
          {submitting ? 'Saving...' : series ? 'Update Series' : 'Create Series'}
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
