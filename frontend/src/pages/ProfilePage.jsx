import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function ProfilePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    
    if (!validate()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      await authService.changePassword(formData.currentPassword, formData.newPassword);
      setSuccess('Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        setErrors({ general: err.response?.data?.detail || 'Failed to change password' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setSuccess('');
  };

  const fieldStyle = (hasError) => ({
    width: '100%',
    padding: '0.5rem',
    border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: '4px',
    fontSize: '1rem',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text)',
  });

  return (
    <div className="page-container" style={{ maxWidth: '600px' }}>
      <h1 className="page-title">Profile Settings</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text)' }}>User Information</h2>
        <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text)' }}>
          <div><strong>Username:</strong> {user?.username}</div>
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Role:</strong> {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Viewer'}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Change Password</h2>

        {errors.general && (
          <div role="alert" className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {errors.general}
          </div>
        )}

        {success && (
          <div role="alert" className="alert alert-success" style={{ marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="pp-current" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--text)' }}>
              Current Password *
            </label>
            <input
              id="pp-current"
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              style={fieldStyle(errors.currentPassword)}
            />
            {errors.currentPassword && (
              <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.currentPassword}</span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="pp-new" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--text)' }}>
              New Password *
            </label>
            <input
              id="pp-new"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              style={fieldStyle(errors.newPassword)}
            />
            {errors.newPassword && (
              <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.newPassword}</span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              Must be at least 8 characters
            </span>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="pp-confirm" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: 'var(--text)' }}>
              Confirm New Password *
            </label>
            <input
              id="pp-confirm"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={fieldStyle(errors.confirmPassword)}
            />
            {errors.confirmPassword && (
              <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
