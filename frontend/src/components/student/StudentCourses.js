import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FiBook, FiCalendar, FiUser, FiArrowRight, FiAward, FiEdit3 } from 'react-icons/fi';
import './StudentCourses.css';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courseEligibility, setCourseEligibility] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes, analyticsRes] = await Promise.all([
        api.get('/courses/my-courses'),
        api.get('/enrollments/my-enrollments'),
        api.get('/analytics/student-dashboard')
      ]);
      
      // Merge enrollment data with courses
      const coursesWithProgress = coursesRes.data.map(course => {
        const enrollment = enrollmentsRes.data.find(
          (e) => e.course && String(e.course._id) === String(course._id)
        );
        const analyticsData = analyticsRes.data.courses?.find(
          (c) => c.course && String(c.course._id) === String(course._id)
        );
        return {
          ...course,
          enrollment,
          progress: analyticsData?.progress || enrollment?.progress || 0,
          daysCompleted: analyticsData?.daysCompleted || enrollment?.daysCompleted || 0
        };
      });
      
      setCourses(coursesWithProgress);
      setEnrollments(enrollmentsRes.data);

      // Fetch eligibility for completed courses
      const eligibilityPromises = coursesWithProgress
        .filter(c => c.progress === 100)
        .map(async (course) => {
          try {
            const res = await api.get(`/certificates/eligibility/${course._id}`);
            return { courseId: course._id, data: res.data };
          } catch (err) {
            return { courseId: course._id, data: null };
          }
        });
      
      const eligibilityResults = await Promise.all(eligibilityPromises);
      const eligibilityMap = {};
      eligibilityResults.forEach(r => {
        if (r.data) eligibilityMap[r.courseId] = r.data;
      });
      setCourseEligibility(eligibilityMap);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 50) return '#3b82f6';
    if (progress >= 25) return '#f59e0b';
    return '#6b7280';
  };

  return (
    <div className="student-courses">
      <div className="page-header">
        <div>
          <h1>My Courses</h1>
          <p>Track your learning progress</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <FiBook className="empty-icon" />
          <h3>No courses enrolled</h3>
          <p>Start your learning journey by browsing available courses</p>
          <button className="btn-primary" onClick={() => navigate('/student/browse')}>
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="courses-list">
          {courses.map((course) => {
            const progressColor = getProgressColor(course.progress);
            
            return (
              <div 
                key={course._id} 
                className="course-card-simple"
                onClick={() => navigate(`/student/courses/${course._id}`)}
              >
                <div className="course-main">
                  <div className="course-icon">
                    <FiBook />
                  </div>
                  
                  <div className="course-info">
                    <h3 className="course-title">{course.title}</h3>
                    <span className="course-code">{course.courseCode}</span>
                    
                    <div className="course-meta">
                      {course.teacher && (
                        <div className="teacher-info-simple">
                          {course.teacher.profilePicture ? (
                            <img 
                              src={course.teacher.profilePicture} 
                              alt={course.teacher.name}
                              className="teacher-avatar-small"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="teacher-avatar-placeholder"
                            style={{ display: course.teacher.profilePicture ? 'none' : 'flex' }}
                          >
                            <FiUser />
                          </div>
                          <span className="teacher-name">{course.teacher.name}</span>
                        </div>
                      )}
                      
                      <div className="course-duration">
                        <FiCalendar />
                        <span>{course.totalDays} days</span>
                      </div>
                      
                      {(course.startDate || course.endDate) && (
                        <div className="course-date-range">
                          <FiCalendar />
                          <span>
                            {course.startDate ? new Date(course.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'} 
                            {' - '} 
                            {course.endDate ? new Date(course.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="course-progress">
                  <div className="progress-info">
                    <span className="progress-label">Progress</span>
                    <span className="progress-percent" style={{ color: progressColor }}>
                      {course.progress}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${course.progress}%`,
                        backgroundColor: progressColor 
                      }}
                    />
                  </div>
                  <span className="progress-days">
                    {course.daysCompleted} of {course.totalDays} days completed
                  </span>

                  {/* Show action buttons for completed courses */}
                  {course.progress === 100 && courseEligibility[course._id] && (
                    <div className="course-actions" onClick={(e) => e.stopPropagation()}>
                      {courseEligibility[course._id].pendingReviews?.some(r => r.type === 'course_evaluation') && (
                        <button 
                          className="action-btn evaluation-btn"
                          onClick={() => navigate(`/student/evaluation/${course._id}`)}
                        >
                          <FiEdit3 /> Submit Evaluation
                        </button>
                      )}
                      <button 
                        className="action-btn certificate-btn"
                        onClick={() => navigate(`/student/certificate/${course._id}`)}
                      >
                        <FiAward /> {courseEligibility[course._id].canDownloadCertificate ? 'Get Certificate' : 'View Status'}
                      </button>
                    </div>
                  )}
                </div>

                <button className="view-btn">
                  <FiArrowRight />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentCourses;