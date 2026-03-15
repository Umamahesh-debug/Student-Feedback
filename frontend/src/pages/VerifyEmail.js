import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import './Auth.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setMessage(res.data.message);
        setStatus('success');
      } catch (err) {
        setMessage(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
            <h1>Verifying Email</h1>
            <p style={{ color: '#666' }}>Please wait while we verify your email address...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
            <h1>Email Verified!</h1>
            <p style={{ color: '#22c55e', fontWeight: 500, marginBottom: '20px' }}>{message}</p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
            <h1>Verification Failed</h1>
            <p style={{ color: '#ef4444', marginBottom: '20px' }}>{message}</p>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
              If your link has expired, you can request a new verification email from the login page.
            </p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
