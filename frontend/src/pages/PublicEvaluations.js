import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PublicEvaluations.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const PublicEvaluations = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evalData, setEvalData] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch evaluation data when courseId changes
  useEffect(() => {
    if (courseId) {
      fetchEvaluationData(courseId);
    } else {
      setEvalData(null);
    }
  }, [courseId]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/evaluations/public/courses`);
      setCourses(res.data);
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluationData = async (id) => {
    setEvalLoading(true);
    try {
      const res = await axios.get(`${API_URL}/evaluations/export/${id}`);
      setEvalData(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load evaluation data');
      setEvalData(null);
    } finally {
      setEvalLoading(false);
    }
  };

  const copyApiUrl = (id) => {
    const url = `${API_URL}/evaluations/export/${id}`;
    navigator.clipboard.writeText(url);
    alert('API URL copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="public-eval-container">
        <div className="public-eval-loading">
          <div className="public-eval-spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-eval-container">
      <header className="public-eval-header">
        <h1>📊 Public Evaluation Data</h1>
        <p>Access evaluation responses for any course without authentication</p>
      </header>

      <div className="public-eval-content">
        {/* Courses List */}
        <aside className="public-eval-sidebar">
          <h2>📚 Courses</h2>
          <div className="public-eval-course-list">
            {courses.length === 0 ? (
              <p className="no-courses">No courses available</p>
            ) : (
              courses.map(course => (
                <div
                  key={course._id}
                  className={`public-eval-course-item ${courseId === course._id ? 'active' : ''}`}
                  onClick={() => navigate(`/evaluations/${course._id}`)}
                >
                  <div className="course-item-info">
                    <span className="course-item-title">{course.title}</span>
                    <span className="course-item-code">{course.courseCode}</span>
                    <span className="course-item-teacher">By: {course.teacher?.name || 'Unknown'}</span>
                  </div>
                  <div className="course-item-meta">
                    <span className={`course-status ${course.status}`}>{course.status}</span>
                    <span className="course-eval-count">{course.evaluationCount} responses</span>
                  </div>
                  <div className="course-item-actions">
                    <button
                      className="btn-copy"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyApiUrl(course._id);
                      }}
                      title="Copy API URL"
                    >
                      📋
                    </button>
                    <button
                      className="btn-api"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`${API_URL}/evaluations/export/${course._id}`, '_blank');
                      }}
                      title="Open JSON API"
                    >
                      GET
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Evaluation Data Display */}
        <main className="public-eval-main">
          {!courseId ? (
            <div className="public-eval-placeholder">
              <div className="placeholder-icon">👈</div>
              <h3>Select a Course</h3>
              <p>Choose a course from the list to view its evaluation data</p>
              <div className="api-info">
                <h4>API Endpoints</h4>
                <code>GET /api/evaluations/public/courses</code>
                <p>Returns list of all courses with evaluation counts</p>
                <code>GET /api/evaluations/export/:courseId</code>
                <p>Returns evaluation data for a specific course</p>
              </div>
            </div>
          ) : evalLoading ? (
            <div className="public-eval-loading">
              <div className="public-eval-spinner"></div>
              <p>Loading evaluation data...</p>
            </div>
          ) : error ? (
            <div className="public-eval-error">
              <span>❌</span>
              <p>{error}</p>
            </div>
          ) : evalData ? (
            <div className="eval-data-container">
              <div className="eval-data-header">
                <div className="eval-course-info">
                  <h2>{evalData.course?.title}</h2>
                  <span className="eval-course-code">{evalData.course?.courseCode}</span>
                </div>
                <div className="eval-data-stats">
                  <div className="stat-item">
                    <span className="stat-value">{evalData.totalResponses}</span>
                    <span className="stat-label">Responses</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{evalData.columns?.length || 20}</span>
                    <span className="stat-label">Questions</span>
                  </div>
                </div>
              </div>

              <div className="eval-api-url">
                <label>API URL:</label>
                <code>{`${API_URL}/evaluations/export/${courseId}`}</code>
                <button onClick={() => copyApiUrl(courseId)}>Copy</button>
              </div>

              {evalData.data?.length > 0 ? (
                <div className="eval-table-wrapper">
                  <table className="eval-data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        {evalData.columns?.map(col => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {evalData.data.map((row, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          {evalData.columns?.map(col => (
                            <td key={col}>{row[col] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-eval-data">
                  <span>📭</span>
                  <p>No evaluation responses yet for this course</p>
                </div>
              )}

              <div className="eval-json-preview">
                <h4>JSON Response Preview</h4>
                <pre>{JSON.stringify(evalData, null, 2)}</pre>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default PublicEvaluations;
