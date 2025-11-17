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

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Profile Settings</h1>

      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
        <h2 style={{ marginBottom: '1rem' }}>User Information</h2>
        <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
          <div>
            <strong>Username:</strong> {user?.username}
          </div>
          <div>
            <strong>Email:</strong> {user?.email}
          </div>
          <div>
            <strong>Role:</strong> {user?.is_admin ? 'Administrator' : 'Reader'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
        <h2 style={{ marginBottom: '1rem' }}>Change Password</h2>
        
        {errors.general && (
          <div style={{ padding: '0.75rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '1rem' }}>
            {errors.general}
          </div>
        )}
        
        {success && (
          <div style={{ padding: '0.75rem', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
              Current Password *
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: errors.currentPassword ? '1px solid #dc3545' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            {errors.currentPassword && (
              <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.currentPassword}</span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
              New Password *
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: errors.newPassword ? '1px solid #dc3545' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            {errors.newPassword && (
              <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.newPassword}</span>
            )}
            <span style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginTop: '0.25rem' }}>
              Must be at least 8 characters
            </span>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
              Confirm New Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: errors.confirmPassword ? '1px solid #dc3545' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            {errors.confirmPassword && (
              <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: submitting ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '1rem'
            }}
          >
            {submitting ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
