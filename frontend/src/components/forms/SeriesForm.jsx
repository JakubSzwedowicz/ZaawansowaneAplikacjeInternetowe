import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../../services/dataService';

function TagInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  const fetchSuggestions = async (q) => {
    if (!q.trim()) { setSuggestions([]); return; }
    try {
      const tags = await dataService.getTags(q);
      setSuggestions(tags.map(t => t.name).filter(n => !value.includes(n)));
    } catch {
      setSuggestions([]);
    }
  };

  const addTag = (name) => {
    const trimmed = name.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const removeTag = (name) => {
    onChange(value.filter(t => t !== name));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className="tag-input-container" onClick={() => containerRef.current?.querySelector('input')?.focus()}>
        {value.map(tag => (
          <span key={tag} className="tag-chip">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>×</button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
            fetchSuggestions(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={value.length === 0 ? 'Add tags...' : ''}
          style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontSize: '0.9rem', flex: 1, minWidth: '80px' }}
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="tag-suggestions" role="listbox">
          {suggestions.map(s => (
            <li
              key={s}
              className="tag-suggestion-item"
              role="option"
              onMouseDown={() => addTag(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SeriesForm({ series, onSaved, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    min_value: 0,
    max_value: 100,
    color: '#007bff',
    location_id: '',
    tags: [],
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: dataService.getLocations,
  });

  useEffect(() => {
    if (series) {
      setFormData({
        name: series.name || '',
        description: series.description || '',
        unit: series.unit || '',
        min_value: series.min_value ?? 0,
        max_value: series.max_value ?? 100,
        color: series.color || '#007bff',
        location_id: series.location_id || '',
        tags: series.tags || [],
      });
    }
  }, [series]);

  const flattenLocations = (nodes, depth = 0) => {
    let result = [];
    for (const node of nodes) {
      result.push({ ...node, depth });
      if (node.children?.length) {
        result = result.concat(flattenLocations(node.children, depth + 1));
      }
    }
    return result;
  };

  const flatLocations = flattenLocations(locations);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.unit.trim()) errs.unit = 'Unit is required';
    if (formData.min_value >= formData.max_value) {
      errs.min_value = 'Min must be less than max';
    }
    if (!formData.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      errs.color = 'Color must be a valid hex color';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        location_id: formData.location_id ? parseInt(formData.location_id) : null,
      };
      if (series) {
        await dataService.updateSeries(series.id, payload);
      } else {
        await dataService.createSeries(payload);
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
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

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
        <label htmlFor="sf-name" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Name *</label>
        <input id="sf-name" type="text" name="name" value={formData.name} onChange={handleChange} style={fieldStyle(errors.name)} />
        {errors.name && <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.name}</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="sf-description" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Description</label>
        <textarea id="sf-description" name="description" value={formData.description} onChange={handleChange} rows="3" style={{ ...fieldStyle(false), fontFamily: 'inherit' }} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="sf-unit" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Unit *</label>
        <input id="sf-unit" type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g., °C, kWh, %" style={fieldStyle(errors.unit)} />
        {errors.unit && <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.unit}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label htmlFor="sf-min" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Min Value *</label>
          <input id="sf-min" type="number" name="min_value" value={formData.min_value} onChange={handleChange} step="any" style={fieldStyle(errors.min_value)} />
          {errors.min_value && <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.min_value}</span>}
        </div>
        <div>
          <label htmlFor="sf-max" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Max Value *</label>
          <input id="sf-max" type="number" name="max_value" value={formData.max_value} onChange={handleChange} step="any" style={fieldStyle(errors.max_value)} />
          {errors.max_value && <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.max_value}</span>}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="sf-color-text" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Color *</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="color" name="color" aria-label="Pick color" value={formData.color} onChange={handleChange} style={{ width: '60px', height: '40px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'var(--input-bg)' }} />
          <input id="sf-color-text" type="text" name="color" value={formData.color} onChange={handleChange} placeholder="#FF5733" style={{ ...fieldStyle(errors.color), flex: 1 }} />
        </div>
        {errors.color && <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.color}</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="sf-location" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Location</label>
        <select id="sf-location" name="location_id" value={formData.location_id} onChange={handleChange} style={fieldStyle(false)}>
          <option value="">— No location —</option>
          {flatLocations.map(loc => (
            <option key={loc.id} value={loc.id}>
              {'  '.repeat(loc.depth)}{loc.depth > 0 ? '└ ' : ''}{loc.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="sf-tags" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Tags</label>
        <div id="sf-tags">
        <TagInput value={formData.tags} onChange={(tags) => setFormData(prev => ({ ...prev, tags }))} />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Press Enter or comma to add a tag</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Saving...' : series ? 'Update Series' : 'Create Series'}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting} className="btn btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}
