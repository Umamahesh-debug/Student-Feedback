import React, { useState } from 'react';
import axios from 'axios';
import './CertificateVerification.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CertificateVerification = () => {
  const [formData, setFormData] = useState({
    certificateNumber: '',
    verificationCode: ''
  });
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear previous results when user starts typing
    if (verificationResult) {
      setVerificationResult(null);
    }
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const response = await axios.post(`${API_URL}/certificates/verify`, formData);
      setVerificationResult(response.data);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('Failed to verify certificate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="certificate-verification">
      <div className="verification-container">
        <div className="verification-header">
          <h1>🔍 Certificate Verification</h1>
          <p>Verify the authenticity of a certificate using its number and verification code</p>
        </div>

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="form-group">
            <label htmlFor="certificateNumber">Certificate Number</label>
            <input
              type="text"
              id="certificateNumber"
              name="certificateNumber"
              value={formData.certificateNumber}
              onChange={handleInputChange}
              placeholder="e.g., SF-2026-MN2R84TS-SVWU"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="verificationCode">Verification Code</label>
            <input
              type="text"
              id="verificationCode"
              name="verificationCode"
              value={formData.verificationCode}
              onChange={handleInputChange}
              placeholder="e.g., GOKP-J4ZH-I0E7"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-verify"
            disabled={loading || !formData.certificateNumber || !formData.verificationCode}
          >
            {loading ? 'Verifying...' : 'Verify Certificate'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <div className="error-icon">❌</div>
            <p>{error}</p>
          </div>
        )}

        {verificationResult && verificationResult.valid && (
          <div className="verification-success">
            <div className="success-icon">✅</div>
            <h2>Certificate Verified Successfully!</h2>

            <div className="certificate-details">
              <div className="detail-row">
                <span className="label">Certificate Number:</span>
                <span className="value">{verificationResult.certificate.certificateNumber}</span>
              </div>

              <div className="detail-row">
                <span className="label">Student Name:</span>
                <span className="value">{verificationResult.certificate.studentName}</span>
              </div>

              <div className="detail-row">
                <span className="label">Course:</span>
                <span className="value">{verificationResult.certificate.courseName}</span>
              </div>

              <div className="detail-row">
                <span className="label">Instructor:</span>
                <span className="value">{verificationResult.certificate.teacherName}</span>
              </div>

              <div className="detail-row">
                <span className="label">Issued Date:</span>
                <span className="value">{formatDate(verificationResult.certificate.issuedAt)}</span>
              </div>

              <div className="detail-row">
                <span className="label">Attendance:</span>
                <span className="value">
                  {verificationResult.certificate.completionStats.attendancePercentage}% (
                  {verificationResult.certificate.completionStats.attendedDays}/
                  {verificationResult.certificate.completionStats.totalDays} days)
                </span>
              </div>

              {verificationResult.certificate.downloadCount > 0 && (
                <div className="detail-row">
                  <span className="label">Download Count:</span>
                  <span className="value">{verificationResult.certificate.downloadCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {verificationResult && !verificationResult.valid && (
          <div className="verification-invalid">
            <div className="invalid-icon">⚠️</div>
            <h2>Certificate Not Valid</h2>
            <p>{verificationResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerification;