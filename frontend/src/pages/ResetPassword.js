import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Toast from '../components/Toast';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }
    if (formData.password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password: formData.password });
      setSuccess(true);
      setToast({ message: res.data.message || 'Password reset successfully!', type: 'success' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Reset link is invalid or has expired.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
      <div className="auth-card">
        <h1>Reset Password</h1>
        {success ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ color: '#22c55e', fontWeight: 500, marginBottom: '16px' }}>
              Your password has been reset successfully!
            </p>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
              Redirecting to login...
            </p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              Enter your new password below.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  required
                  minLength="6"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            <p className="auth-link">
              <Link to="/login">Back to Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
