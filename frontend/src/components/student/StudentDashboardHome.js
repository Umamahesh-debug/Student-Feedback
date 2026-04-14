import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FiBook, FiClock, FiCheckCircle, FiUserCheck, FiAlertCircle, FiX, FiArrowRight, FiAward } from 'react-icons/fi';
import './StudentDashboard.css';

const StudentDashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, coursesRes] = await Promise.all([
        api.get('/analytics/student-dashboard'),
        api.get('/courses/my-courses')
      ]);

      setStats(analyticsRes.data);
      setCourses(coursesRes.data || []);
      
      // Mock recent activity
      setRecentActivity([
        { type: 'attendance', message: 'Attendance marked for Machine Learning Fundamentals - Day 5', date: new Date() },
        { type: 'enrollment', message: 'Enrollment request submitted for Data Science Basics', date: new Date(Date.now() - 86400000) },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = [
    {
      title: 'Enrolled Courses',
      value: stats?.totalEnrolled || 0,
      icon: FiBook,
      color: '#007bff',
      filterKey: 'enrolled',
      clickable: true
    },
    {
      title: 'In Progress',
      value: stats?.inProgress || 0,
      icon: FiClock,
      color: '#ffc107',
      filterKey: 'in-progress',
      clickable: true
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      icon: FiCheckCircle,
      color: '#28a745',
      filterKey: 'completed',
      clickable: true
    },
    {
      title: 'Attendance',
      value: `${stats?.overallAttendance || 0}%`,
      icon: FiUserCheck,
      color: '#17a2b8',
      filterKey: 'attendance',
      clickable: false
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: FiAlertCircle,
      color: '#dc3545',
      filterKey: 'pending',
      clickable: true
    },
  ];

  // Handle summary card click
  const handleCardClick = (card) => {
    if (!card.clickable) return;
    setSelectedFilter(card.filterKey);
    setShowFilterModal(true);
  };

  // Get filtered courses based on selected filter
  const getFilteredCourses = () => {
    if (!stats?.courses) return [];
    
    switch (selectedFilter) {
      case 'enrolled':
        // All enrolled courses
        return stats.courses.filter(c => c && c.course);
      case 'in-progress':
        // Courses that are not completed (progress < 100)
        return stats.courses.filter(c => 
          c && c.course && c.enrollment && c.enrollment.progress < 100
        );
      case 'completed':
        // Courses with progress = 100
        return stats.courses.filter(c => 
          c && c.course && c.enrollment && c.enrollment.progress >= 100
        );
      case 'pending':
        return (stats.pendingCourses || []).filter((c) => c && c.course);
      default:
        return [];
    }
  };

  // Get title for the filter modal
  const getFilterTitle = () => {
    switch (selectedFilter) {
      case 'enrolled':
        return 'All Enrolled Courses';
      case 'in-progress':
        return 'Courses In Progress';
      case 'completed':
        return 'Completed Courses';
      case 'pending':
        return 'Pending Approval Courses';
      default:
        return 'Courses';
    }
  };

  return (
    <div className="student-dashboard">
      <div className="page-header">
        <div>
          <h1>My Learning</h1>
          <p>Track your courses, attendance, and achievements.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/student/browse')}>
          Browse Courses
        </button>
      </div>

      <div className="summary-cards">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div 
              key={index} 
              className={`summary-card ${card.clickable ? 'clickable' : ''}`}
              onClick={() => handleCardClick(card)}
              title={card.clickable ? `Click to view ${card.title}` : ''}
            >
              <div className="card-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                <Icon />
              </div>
              <div className="card-content">
                <h3>{card.value}</h3>
                <p>{card.title}</p>
              </div>
              {card.clickable && <FiArrowRight className="card-arrow" />}
            </div>
          );
        })}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="filter-modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h2>{getFilterTitle()}</h2>
              <button className="close-btn" onClick={() => setShowFilterModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="filter-modal-body">
              {getFilteredCourses().length === 0 ? (
                <div className="empty-state">No courses found</div>
              ) : (
                <div className="filtered-courses-list">
                  {getFilteredCourses().map((item) => {
                    const course = item.course;
                    const enrollment = item.enrollment;
                    if (!course) return null;
                    
                    return (
                      <div 
                        key={course._id} 
                        className="filtered-course-item"
                        onClick={() => {
                          setShowFilterModal(false);
                          navigate(`/student/courses/${course._id}`);
                        }}
                      >
                        <div className="filtered-course-info">
                          <h4>{course.title}</h4>
                          <p>{course.description?.substring(0, 100) || 'No description'}...</p>
                          <div className="filtered-course-meta">
                            <span><FiBook /> {course.totalDays || 0} days</span>
                            {enrollment && (
                              <>
                                <span><FiCheckCircle /> {enrollment.progress || 0}% complete</span>
                                <span className={`status-tag ${enrollment.status}`}>
                                  {enrollment.status}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <FiArrowRight className="view-arrow" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-sections">
        <div className="section active-courses">
          <h2>My Active Courses</h2>
          {courses.length === 0 ? (
            <div className="empty-state">No active courses</div>
          ) : (
            <div className="course-cards">
              {courses.slice(0, 3).map((course) => {
                if (!course || !course._id) return null;
                
                const enrollment = stats?.courses?.find(
                  (c) => c.course && String(c.course._id) === String(course._id)
                )?.enrollment;
                const progress = enrollment?.progress || 0;
                const daysCompleted = enrollment?.daysCompleted || 0;
                const status = progress === 100 ? 'Completed' : 'In Progress';
                
                return (
                  <div key={course._id} className="course-card" onClick={() => navigate(`/student/courses/${course._id}`)}>
                    <div className="course-header">
                      <h3>{course.title}</h3>
                      <span className={`status-badge ${status.toLowerCase().replace(' ', '-')}`}>
                        {status}
                      </span>
                    </div>
                    <div className="course-progress">
                      <div className="progress-label">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                      </div>
                      <p className="progress-text">
                        {daysCompleted} / {course.totalDays || 0} days completed
                      </p>
                      {progress === 100 && (
                        <button
                          type="button"
                          className="btn-cert-dashboard"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/student/certificate/${course._id}`);
                          }}
                        >
                          <FiAward />
                          <span>View certificate requirements</span>
                        </button>
                      )}
                    </div>
                    {course.sections && course.sections.length > 0 && (
                      <div className="next-session">
                        <FiClock /> Next session: {course.sections[daysCompleted]?.title || 'N/A'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="section recent-activity">
          <h2>Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="empty-state">No recent activity</div>
          ) : (
            <div className="activity-list">
              {recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'attendance' && <FiUserCheck />}
                    {activity.type === 'enrollment' && <FiCheckCircle />}
                  </div>
                  <div className="activity-content">
                    <p>{activity.message}</p>
                    <span>{new Date(activity.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="quick-stats">
        <div className="stat-item">
          <h3>Total Attendance Days</h3>
          <p>{stats?.courses?.filter(c => c && c.enrollment).reduce((sum, c) => sum + (c.enrollment?.daysCompleted || 0), 0) || 0}</p>
        </div>
        <div className="stat-item">
          <h3>Average Attendance</h3>
          <p>{stats?.overallAttendance || 0}%</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardHome;

