import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FiUsers, FiCheckSquare, FiBarChart2, FiFileText, FiX, FiAward } from 'react-icons/fi';
import './CourseDetails.css';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      const [courseRes, studentsRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get(`/courses/${id}/students`)
      ]);
      setCourse(courseRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await api.put(`/courses/${id}`, { status });
      fetchCourseData();
    } catch (error) {
      alert('Failed to update course status');
    }
  };

  const handleToggleEnrollment = async () => {
    try {
      const response = await api.put(`/courses/${id}/toggle-enrollment`);
      alert(response.data.message);
      fetchCourseData();
    } catch (error) {
      alert('Failed to toggle enrollment');
    }
  };

  const handleRemoveStudent = async (enrollmentId, studentName) => {
    if (window.confirm(`Are you sure you want to remove ${studentName} from this course?`)) {
      try {
        await api.delete(`/courses/${id}/students/${enrollmentId}`);
        alert('Student removed successfully');
        fetchCourseData();
      } catch (error) {
        alert('Failed to remove student');
      }
    }
  };

  if (loading || !course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="course-details">
      <div className="page-header">
        <div>
          <h1>{course.title}</h1>
          <p className="course-code">{course.courseCode}</p>
        </div>
        <div className="header-actions">
          <select
            value={course.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="status-select"
          >
            <option value="draft">Draft</option>
            <option value="active">Active (Live - Available for Enrollment)</option>
            <option value="completed">Completed</option>
          </select>
          {course.status === 'draft' && (
            <button 
              className="btn-publish"
              onClick={() => handleStatusChange('active')}
            >
              Publish Course
            </button>
          )}
        </div>
      </div>

      <div className="course-info-section">
        <div className="info-card">
          <h3>Course Information</h3>
          <p><strong>Description:</strong> {course.description || 'No description'}</p>
          <p><strong>Total Days:</strong> {course.totalDays}</p>
          <p><strong>Status:</strong> <span className={`status-badge ${course.status}`}>{course.status}</span></p>
          <p><strong>Created:</strong> {new Date(course.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="course-sections">
        <h2>Course Structure</h2>
        <div className="days-structure">
          {/* Show new topic-based structure if days exist */}
          {course.days && course.days.length > 0 ? (
            course.days.map((day, dayIndex) => (
              <div key={dayIndex} className="day-structure-card">
                <div className="day-structure-header">
                  <h3>Day {day.dayNumber}</h3>
                  <div className="day-header-right">
                    {day.date && (
                      <span className="day-date">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                    )}
                    <button
                      className="btn-day-complete"
                      style={{ backgroundColor: day.completed ? '#ef4444' : '#10b981', color: '#fff' }}
                      onClick={async () => {
                        try {
                          if (!day.completed) {
                            await api.post(`/attendance/course/${id}/day/${day.dayNumber}/complete`);
                          } else {
                            await api.post(`/attendance/course/${id}/day/${day.dayNumber}/uncomplete`);
                          }
                          fetchCourseData();
                        } catch (error) {
                          alert('Failed to update progress for this day');
                        }
                      }}
                    >
                      {day.completed ? 'Unmark Complete' : 'Mark as Complete'}
                    </button>
                  </div>
                </div>
                {day.topics && day.topics.length > 0 ? (
                  <div className="topics-structure">
                    {day.topics.map((topic, topicIndex) => (
                      <div key={topicIndex} className="topic-structure-item">
                        <div className="topic-heading">
                          <h4>{topic.name}</h4>
                        </div>
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div className="subtopics-list">
                            {topic.subtopics.map((subtopic, subIndex) => (
                              <div key={subIndex} className="subtopic-structure">
                                <div className="subtopic-title-with-duration">
                                  <strong>{subtopic.title}</strong>
                                  {subtopic.duration && (
                                    <span className="subtopic-duration-badge">{subtopic.duration}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-topics">No topics added for this day</p>
                )}
              </div>
            ))
          ) : course.sections && course.sections.length > 0 ? (
            /* Show old section-based structure for backward compatibility */
            course.sections.map((day, dayIndex) => (
              <div key={dayIndex} className="day-structure-card">
                <div className="day-structure-header">
                  <h3>Day {day.dayNumber}</h3>
                  <div className="day-header-right">
                    {day.date && (
                      <span className="day-date">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                    )}
                    <button
                      className="btn-day-complete"
                      style={{ backgroundColor: day.completed ? '#ef4444' : '#10b981', color: '#fff' }}
                      onClick={async () => {
                        try {
                          if (!day.completed) {
                            await api.post(`/attendance/course/${id}/day/${day.dayNumber}/complete`);
                          } else {
                            await api.post(`/attendance/course/${id}/day/${day.dayNumber}/uncomplete`);
                          }
                          fetchCourseData();
                        } catch (error) {
                          alert('Failed to update progress for this day');
                        }
                      }}
                    >
                      {day.completed ? 'Unmark Complete' : 'Mark as Complete'}
                    </button>
                  </div>
                </div>
                {day.sections && day.sections.length > 0 ? (
                  <div className="sections-structure">
                    {day.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="section-structure-item">
                        <div className="section-heading">
                          <h4>{section.heading}</h4>
                          {section.description && (
                            <p className="section-desc">{section.description}</p>
                          )}
                        </div>
                        {section.subSections && section.subSections.length > 0 && (
                          <div className="sub-sections-list">
                            {section.subSections.map((subSection, subIndex) => (
                              <div key={subIndex} className="sub-section-structure">
                                <strong>{subSection.title}</strong>
                                {subSection.description && (
                                  <p>{subSection.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-sections">No sections added for this day</p>
                )}
              </div>
            ))
          ) : (
            <p className="no-sections">No course content available</p>
          )}
        </div>
      </div>

      <div className="enrolled-students">
        <div className="section-header">
          <h2>Enrolled Students ({students.length})</h2>
          <div className="header-buttons">
            <button 
              className="btn-survey-analytics"
              onClick={() => navigate(`/teacher/courses/${id}/surveys`)}
            >
              <FiAward /> Survey Analytics
            </button>
            <button 
              className={`btn-toggle ${course.enrollmentEnabled ? 'enabled' : 'disabled'}`}
              onClick={handleToggleEnrollment}
            >
              {course.enrollmentEnabled ? '✓ Enrollment Open' : '✗ Enrollment Closed'}
            </button>
            <button className="btn-primary" onClick={() => navigate(`/teacher/attendance?course=${id}`)}>
              <FiCheckSquare /> Mark Attendance
            </button>
          </div>
        </div>
        <div className="students-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roll Number</th>
                <th>Progress</th>
                <th>Days Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">No students enrolled</td>
                </tr>
              ) : (
                students.map((enrollment) => (
                  <tr key={enrollment._id}>
                    <td>{enrollment.student.name}</td>
                    <td>{enrollment.student.email}</td>
                    <td>{enrollment.student.rollNumber || '-'}</td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar-small">
                          <div className="progress-fill" style={{ width: `${enrollment.progress}%` }}></div>
                        </div>
                        <span>{enrollment.progress}%</span>
                      </div>
                    </td>
                    <td>{enrollment.daysCompleted} / {course.totalDays}</td>
                    <td>
                      <div className="student-actions">
                        <button className="btn-link">View Profile</button>
                        <button 
                          className="btn-remove-student"
                          onClick={() => handleRemoveStudent(enrollment._id, enrollment.student.name)}
                        >
                          <FiX /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="quick-actions">
        <button className="action-btn" onClick={() => navigate(`/teacher/attendance?course=${id}`)}>
          <FiCheckSquare /> Mark Attendance
        </button>
        <button className="action-btn" onClick={() => navigate(`/teacher/analytics?course=${id}`)}>
          <FiBarChart2 /> View Analytics
        </button>
        <button className="action-btn" onClick={() => navigate(`/teacher/reports?course=${id}`)}>
          <FiFileText /> Generate Report
        </button>
      </div>
    </div>
  );
};

export default CourseDetails;

