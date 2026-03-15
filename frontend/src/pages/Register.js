import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import Toast from '../components/Toast';
import './Auth.css';

const BRANCHES = ['CSE', 'CSM', 'CSD', 'IT', 'EEE', 'MECH', 'MBA', 'M-TECH', 'CSC'];
const SECTIONS = ['A', 'B', 'C', 'D'];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    rollNumber: '',
    branch: '',
    section: '',
    department: '',
    designation: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);

  // OTP states
  const [otpStep, setOtpStep] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const { register } = useContext(AuthContext);
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

    try {
      const result = await register(formData);

      if (result.pendingApproval) {
        setPendingApproval(result);
        return;
      }

      if (result.pendingVerification) {
        setRegisteredEmail(result.user?.email || formData.email);
        setRegisteredName(result.user?.name || formData.name);
        setOtpStep(true);
        showToast('OTP sent to your email! Enter it below to verify.', 'success');
        return;
      }

      showToast('Registration successful!', 'success');
      if (result.role === 'student') {
        navigate('/student/dashboard');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      showToast('Please enter the 6-digit OTP.', 'error');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email: registeredEmail, otp });
      showToast(res.data.message || 'Email verified!', 'success');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid OTP. Please try again.', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-otp', { email: registeredEmail });
      showToast('New OTP sent to your email!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend OTP.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  // OTP verification screen
  if (otpStep) {
    return (
      <div className="auth-container">
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '44px', marginBottom: '8px' }}>📧</div>
          <h1>Verify Your Email</h1>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '6px' }}>
            Hi <strong>{registeredName}</strong>! We sent a 6-digit OTP to:
          </p>
          <p style={{ color: '#2563eb', fontWeight: 600, marginBottom: '24px', fontSize: '14px' }}>
            {registeredEmail}
          </p>
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
                maxLength="6"
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold' }}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={otpLoading || otp.length !== 6}
              style={{ marginBottom: '12px' }}
            >
              {otpLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>
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
          <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px' }}>
            OTP expires in 15 minutes. Check your spam folder if not found.
          </p>
        </div>
      </div>
    );
  }

  // Pending admin approval screen for teachers
  if (pendingApproval) {
    return (
      <div className="auth-container">
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
        <div className="auth-card pending-card">
          <div className="pending-icon">✅</div>
          <h1>Registration Successful!</h1>
          <div className="pending-info">
            <p className="pending-name">Welcome, {pendingApproval.user?.name}!</p>
            <p className="pending-message">
              Your teacher account has been created and is now pending admin approval.
            </p>
          </div>
          <div className="pending-details">
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{pendingApproval.user?.email}</span>
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
            An administrator will review and approve your account. You will be able to login once approved.
          </p>
          <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Go to Login
          </Link>
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
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
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
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <>
              <div className="form-group">
                <label>Roll Number</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <select name="branch" value={formData.branch} onChange={handleChange}>
                  <option value="">-- Select Branch --</option>
                  {BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <select name="section" value={formData.section} onChange={handleChange}>
                  <option value="">-- Select Section --</option>
                  {SECTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {formData.role === 'teacher' && (
            <>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
