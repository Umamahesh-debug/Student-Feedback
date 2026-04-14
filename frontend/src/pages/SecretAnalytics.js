import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SecretAnalytics.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const SecretAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/analytics/comprehensive-feedback`);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const filteredCourses = data?.courses?.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getOverallDayRating = (course) => {
    if (!course.dayRatings || course.dayRatings.length === 0) return null;
    const total = course.dayRatings.reduce((sum, r) => sum + r.rating, 0);
    return (total / course.dayRatings.length).toFixed(1);
  };

  if (!data) {
    return (
      <div className="sa-page">
        <div className="sa-error">
          <h2>Unable to load data</h2>
          <p>Please check your connection and try again</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-page">
      <div className="sa-content">
        {/* Header */}
        <header className="sa-header">
          <div>
            <h1>Analytics Dashboard</h1>
            <p>Course feedback and student evaluations overview</p>
          </div>
        </header>

        {/* Metrics */}
        <div className="sa-metrics">
          <div className="sa-metric">
            <span className="sa-metric-value">{data.stats?.totalCourses || 0}</span>
            <span className="sa-metric-label">Courses</span>
          </div>
          <div className="sa-metric">
            <span className="sa-metric-value">{data.stats?.totalDayRatings || 0}</span>
            <span className="sa-metric-label">Ratings</span>
          </div>
          <div className="sa-metric">
            <span className="sa-metric-value">{data.stats?.totalEvaluations || 0}</span>
            <span className="sa-metric-label">Evaluations</span>
          </div>
          <div className="sa-metric">
            <span className="sa-metric-value">{data.stats?.totalEnrollments || 0}</span>
            <span className="sa-metric-label">Students</span>
          </div>
        </div>

        {/* Table Section */}
        <section className="sa-section">
          <div className="sa-section-header">
            <h2>All Courses</h2>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sa-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Rating</th>
                  <th>Ratings</th>
                  <th>Evaluations</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => {
                  const rating = getOverallDayRating(course);
                  return (
                    <tr key={course._id} onClick={() => navigate(`/secret-analytics/course/${course._id}`)}>
                      <td>
                        <div className="sa-course-cell">
                          <strong>{course.title}</strong>
                          <span>{course.courseCode}</span>
                        </div>
                      </td>
                      <td>{course.teacher?.name || '—'}</td>
                      <td>
                        {rating ? (
                          <span className="sa-rating">{rating}<small>/5</small></span>
                        ) : (
                          <span className="sa-no-rating">—</span>
                        )}
                      </td>
                      <td>{course.dayRatings?.length || 0}</td>
                      <td>{course.evaluations?.length || 0}</td>
                      <td>{course.enrolledStudents || 0}</td>
                      <td>
                        <span className={`sa-status sa-status-${course.status}`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="sa-arrow">→</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCourses.length === 0 && (
              <p className="sa-empty">No courses found</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SecretAnalytics;
