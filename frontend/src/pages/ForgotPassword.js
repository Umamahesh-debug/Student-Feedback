import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Toast from '../components/Toast';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // step 1 = enter email
  // step 2 = enter OTP
  // step 3 = enter new password + confirm
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      showToast('OTP sent to your email!', 'success');
      setStep(2);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      showToast('Please enter the 6-digit OTP.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', { email, otp });
      setResetToken(res.data.resetToken);
      showToast('OTP verified! Set your new password.', 'success');
      setStep(3);
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid or expired OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { resetToken, password });
      showToast(res.data.message || 'Password reset successfully!', 'success');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      showToast('New OTP sent to your email!', 'success');
      setOtp('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend OTP.', 'error');
    } finally {
      setResendLoading(false);
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

        {/* Step 1 — Enter Email */}
        {step === 1 && (
          <>
            <h1>Forgot Password</h1>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              Enter your registered email and we'll send you an OTP to reset your password.
            </p>
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
            <p className="auth-link">
              <Link to="/login">Back to Login</Link>
            </p>
          </>
        )}

        {/* Step 2 — Enter OTP */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '36px' }}>📧</div>
            <h1 style={{ textAlign: 'center' }}>Enter OTP</h1>
            <p style={{ color: '#666', fontSize: '13px', textAlign: 'center', marginBottom: '20px' }}>
              A 6-digit OTP was sent to <strong>{email}</strong>.<br />
              Enter it below to continue.
            </p>
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label>OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  style={{ textAlign: 'center', fontSize: '26px', letterSpacing: '8px', fontWeight: 'bold' }}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
            <p style={{ color: '#666', fontSize: '13px', textAlign: 'center', marginTop: '14px' }}>
              Didn't receive it?{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading}
                style={{ background: 'none', border: 'none', color: '#2563eb',
                         cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: 0 }}
              >
                {resendLoading ? 'Sending...' : 'Resend OTP'}
              </button>
            </p>
            <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', marginTop: '6px' }}>
              OTP expires in 15 minutes.
            </p>
            <p style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); }}
                style={{ background: 'none', border: 'none', color: '#6b7280',
                         cursor: 'pointer', fontSize: '13px', padding: 0 }}
              >
                ← Change email
              </button>
            </p>
          </>
        )}

        {/* Step 3 — Set New Password */}
        {step === 3 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '36px' }}>🔐</div>
            <h1 style={{ textAlign: 'center' }}>Set New Password</h1>
            <p style={{ color: '#22c55e', fontSize: '13px', textAlign: 'center', marginBottom: '20px', fontWeight: 500 }}>
              OTP verified! Enter your new password below.
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength="6"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
