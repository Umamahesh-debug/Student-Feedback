import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseAnalytics.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const CourseAnalytics = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ratings');

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/analytics/comprehensive-feedback`);
      const foundCourse = response.data.courses.find(c => c._id === courseId);
      setCourse(foundCourse);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching course data:', error);
      setLoading(false);
    }
  };

  const getOverallDayRating = () => {
    if (!course?.dayRatings || course.dayRatings.length === 0) return null;
    const total = course.dayRatings.reduce((sum, r) => sum + r.rating, 0);
    return (total / course.dayRatings.length).toFixed(1);
  };

  const downloadCSV = () => {
    let csvContent = '';
    
    // DAY RATINGS - Student as rows, Days as columns
    csvContent += 'DAY RATINGS\n';
    
    if (course.dayRatings && course.dayRatings.length > 0) {
      // Get all unique students and days
      const studentMap = new Map();
      const allDays = new Set();
      
      course.dayRatings.forEach(r => {
        const studentName = r.student?.name || 'Unknown';
        const day = r.dayNumber;
        allDays.add(day);
        
        if (!studentMap.has(studentName)) {
          studentMap.set(studentName, {});
        }
        studentMap.get(studentName)[day] = r.rating;
      });
      
      // Sort days numerically
      const sortedDays = Array.from(allDays).sort((a, b) => a - b);
      
      // Create header row
      csvContent += 'Student';
      sortedDays.forEach(day => {
        csvContent += `,DAY${day}`;
      });
      csvContent += '\n';
      
      // Create data rows
      studentMap.forEach((dayRatings, studentName) => {
        csvContent += `"${studentName}"`;
        sortedDays.forEach(day => {
          csvContent += `,${dayRatings[day] || ''}`;
        });
        csvContent += '\n';
      });
    } else {
      csvContent += 'No day ratings available\n';
    }
    
    csvContent += '\n\nEVALUATIONS\n';
    csvContent += 'Student,Date,Q1,Q2,Q3,Q4,Q5,Q6,Q7,Q8,Q9,Q10,Q11,Q12,Q13,Q14,Q15,Q16,Q17,Q18,Q19,Q20\n';
    course.evaluations?.forEach(e => {
      const answers = e.answers || {};
      csvContent += `"${e.student?.name || 'Unknown'}","${new Date(e.createdAt).toLocaleString()}"`;
      for (let i = 1; i <= 20; i++) {
        csvContent += `,"${answers[`q${i}`] || ''}"`;
      }
      csvContent += '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.courseCode}_feedback.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const exportData = {
      course: {
        title: course.title,
        code: course.courseCode,
        teacher: course.teacher?.name,
        status: course.status
      },
      overallDayRating: getOverallDayRating(),
      totalDayRatings: course.dayRatings?.length || 0,
      totalEvaluations: course.evaluations?.length || 0,
      dayRatings: course.dayRatings?.map(r => ({
        student: r.student?.name,
        day: r.dayNumber,
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt
      })),
      evaluations: course.evaluations?.map(e => ({
        student: e.student?.name,
        answers: e.answers,
        date: e.createdAt
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.courseCode}_feedback.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!course) {
    return (
      <div className="course-container">
        <div className="error-wrapper">
          <div className="error-icon">!</div>
          <h2>Course not found</h2>
          <p>The course you're looking for doesn't exist</p>
          <button className="btn-primary" onClick={() => navigate('/secret-analytics')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const overallRating = getOverallDayRating();

  return (
    <div className="course-container">
      {/* Top Navigation Bar */}
      <nav className="top-bar">
        <button className="back-button" onClick={() => navigate('/secret-analytics')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span>Back to Dashboard</span>
        </button>
        <div className="action-buttons">
          <button className="btn-export btn-csv" onClick={downloadCSV}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <button className="btn-export btn-json" onClick={downloadJSON}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export JSON
          </button>
        </div>
      </nav>

      {/* Course Header */}
      <header className="course-header">
        <div className="course-header-content">
          <div className="course-title-area">
            <div className="title-row">
              <h1>{course.title}</h1>
              <span className={`status-badge status-${course.status}`}>{course.status}</span>
            </div>
            <div className="meta-row">
              <span className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                {course.courseCode}
              </span>
              <span className="meta-divider">•</span>
              <span className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {course.teacher?.name || 'No instructor'}
              </span>
              <span className="meta-divider">•</span>
              <span className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {course.enrolledStudents || 0} Students
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card primary-stat">
          <div className="stat-content">
            <span className="stat-number">{overallRating || '—'}</span>
            <span className="stat-subtitle">out of 5.0</span>
          </div>
          <span className="stat-title">Overall Rating</span>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-number">{course.dayRatings?.length || 0}</span>
          </div>
          <span className="stat-title">Day Ratings</span>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-number">{course.evaluations?.length || 0}</span>
          </div>
          <span className="stat-title">Evaluations</span>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="tabs-wrapper">
        <div className="tabs-nav">
          <button 
            className={`tab-button ${activeTab === 'ratings' ? 'active' : ''}`}
            onClick={() => setActiveTab('ratings')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Day Ratings
          </button>
          <button 
            className={`tab-button ${activeTab === 'evaluations' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluations')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Evaluations
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <main className="content-area">
        {activeTab === 'ratings' && (
          <div className="data-section">
            <div className="section-header">
              <h2>Day Ratings</h2>
              <span className="count-badge">{course.dayRatings?.length || 0} records</span>
            </div>
            
            {course.dayRatings?.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Day</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.dayRatings.map((rating, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                        <td className="td-student">
                          <div className="student-avatar">
                            {rating.student?.name?.charAt(0) || '?'}
                          </div>
                          <span className="student-name">{rating.student?.name || 'Unknown'}</span>
                        </td>
                        <td>
                          <span className="day-badge">Day {rating.dayNumber}</span>
                        </td>
                        <td>
                          <div className="rating-cell">
                            <div className="rating-stars">
                              {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} className={star <= rating.rating ? 'star-filled' : 'star-empty'}>★</span>
                              ))}
                            </div>
                            <span className="rating-number">{rating.rating}/5</span>
                          </div>
                        </td>
                        <td className="td-comment">
                          {rating.comment || <span className="no-data">No comment</span>}
                        </td>
                        <td className="td-date">
                          {new Date(rating.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <h3>No ratings yet</h3>
                <p>Students haven't submitted any day ratings for this course</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'evaluations' && (
          <div className="data-section">
            <div className="section-header">
              <h2>Course Evaluations</h2>
              <span className="count-badge">{course.evaluations?.length || 0} records</span>
            </div>
            
            {course.evaluations?.length > 0 ? (
              <div className="table-container evaluations-container">
                <table className="data-table evaluations-table">
                  <thead>
                    <tr>
                      <th className="sticky-col">Student</th>
                      <th className="sticky-col-date">Date</th>
                      {[...Array(20)].map((_, i) => (
                        <th key={i} className="th-question">Q{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {course.evaluations.map((evaluation, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                        <td className="td-student sticky-col">
                          <div className="student-avatar">
                            {evaluation.student?.name?.charAt(0) || '?'}
                          </div>
                          <span className="student-name">{evaluation.student?.name || 'Unknown'}</span>
                        </td>
                        <td className="td-date sticky-col-date">
                          {new Date(evaluation.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        {[...Array(20)].map((_, i) => (
                          <td key={i} className="td-answer">
                            <span className="answer-text">
                              {evaluation.answers?.[`q${i + 1}`] || '—'}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <h3>No evaluations yet</h3>
                <p>Students haven't submitted any course evaluations</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseAnalytics;
