import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './MyCertificates.css';

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await api.get('/certificates/my-certificates');
      setCertificates(response.data);
    } catch (err) {
      setError('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-certificates">
      <h1>🎓 My Certificates</h1>
      <p className="subtitle">Your course completion achievements</p>

      {error && <div className="error-message">{error}</div>}

      {certificates.length === 0 ? (
        <div className="no-certificates">
          <div className="empty-icon">📜</div>
          <h3>No Certificates Yet</h3>
          <p>Complete courses with at least 75% attendance, daily feedback, and overall feedback to earn certificates.</p>
          <Link to="/student/courses" className="btn-primary">
            Browse My Courses
          </Link>
        </div>
      ) : (
        <div className="certificates-grid">
          {certificates.map(cert => (
            <div key={cert._id} className="certificate-card">
              <div className="certificate-icon">🎓</div>
              <div className="certificate-details">
                <h3>{cert.courseName}</h3>
                <p className="instructor">Instructor: {cert.teacherName}</p>
                <div className="certificate-meta">
                  <span className="cert-number">{cert.certificateNumber}</span>
                  <span className="cert-date">
                    Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="certificate-stats">
                  <div className="stat">
                    <span className="value">{cert.completionStats.attendancePercentage}%</span>
                    <span className="label">Attendance</span>
                  </div>
                  <div className="stat">
                    <span className="value">{cert.completionStats.attendedDays}/{cert.completionStats.totalDays}</span>
                    <span className="label">Days</span>
                  </div>
                  <div className="stat">
                    <span className="value">{cert.downloadCount}</span>
                    <span className="label">Downloads</span>
                  </div>
                </div>
                <Link 
                  to={`/student/certificate/${cert.course._id || cert.course}`} 
                  className="btn-view"
                >
                  View Certificate
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
