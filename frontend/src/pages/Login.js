import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import Toast from '../components/Toast';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [emailNotVerified, setEmailNotVerified] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPendingApproval(null);
    setEmailNotVerified(null);

    try {
      const user = await login(formData.email, formData.password);
      showToast('Login successful!', 'success');
      setTimeout(() => {
        if (user.role === 'student') {
          navigate('/student/dashboard');
        } else {
          navigate('/teacher/dashboard');
        }
      }, 800);
    } catch (err) {
      if (err.response?.data?.pendingApproval) {
        setPendingApproval(err.response.data);
      } else if (err.response?.data?.emailNotVerified) {
        setEmailNotVerified(err.response.data.email);
        showToast('Please verify your email before logging in.', 'error');
      } else {
        showToast(err.response?.data?.message || 'Login failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!emailNotVerified) return;
    setResendLoading(true);
    try {
      await api.post('/auth/resend-otp', { email: emailNotVerified });
      showToast('Verification email resent! Please check your inbox.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend verification email.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  // Show pending approval screen
  if (pendingApproval) {
    return (
      <div className="auth-container">
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
        <div className="auth-card pending-card">
          <div className="pending-icon">⏳</div>
          <h1>Approval Pending</h1>
          <div className="pending-info">
            <p className="pending-name">Welcome, {pendingApproval.userInfo?.name}!</p>
            <p className="pending-message">
              Your teacher account is currently under review. An administrator will verify your account shortly.
            </p>
          </div>
          <div className="pending-details">
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{pendingApproval.userInfo?.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Role:</span>
              <span className="detail-value">Teacher</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value status-pending">⏳ Pending Verification</span>
            </div>
          </div>
          <p className="pending-note">
            You will be able to access the Teacher Portal once your account is approved.
          </p>
          <button
            className="btn-secondary"
            onClick={() => setPendingApproval(null)}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
      <div className="auth-card">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '12px' }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', color: '#2563eb' }}>
              Forgot Password?
            </Link>
          </div>
          {emailNotVerified && (
            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px',
                          padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#92400e' }}>
              Your email is not verified yet.{' '}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                style={{ background: 'none', border: 'none', color: '#2563eb',
                         cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '13px' }}
              >
                {resendLoading ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
