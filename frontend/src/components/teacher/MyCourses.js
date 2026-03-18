import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { FiPlus, FiEdit3, FiEye, FiTrash2, FiUsers, FiBook, FiCalendar, FiCheckCircle, FiClock, FiBarChart2 } from 'react-icons/fi';
import './MyCourses.css';

const MyCourses = () => {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('status') || 'all';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter); // all, active, draft, completed
  const [enrollmentCounts, setEnrollmentCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/my-courses');
      const coursesData = response.data;
      
      // Fetch enrollment counts for each course
      const counts = {};
      for (const course of coursesData) {
        try {
          const enrollmentRes = await api.get(`/courses/${course._id}/students`);
          counts[course._id] = enrollmentRes.data.length;
        } catch (error) {
          counts[course._id] = 0;
        }
      }
      
      setCourses(coursesData);
      setEnrollmentCounts(counts);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId, courseTitle) => {
    if (window.confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/courses/${courseId}`);
        fetchCourses();
      } catch (error) {
        alert('Failed to delete course');
      }
    }
  };

  const getFilteredCourses = () => {
    if (filter === 'all') return courses;
    return courses.filter(course => course.status === filter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'completed':
        return '#3b82f6';
      case 'draft':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FiCheckCircle />;
      case 'completed':
        return <FiBarChart2 />;
      case 'draft':
        return <FiClock />;
      default:
        return <FiClock />;
    }
  };

  const filteredCourses = getFilteredCourses();
  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'active').length,
    draft: courses.filter(c => c.status === 'draft').length,
    completed: courses.filter(c => c.status === 'completed').length
  };

  return (
    <div className="my-courses">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>My Courses</h1>
          <p>Manage and track your teaching courses</p>
        </div>
        <button className="btn-create" onClick={() => navigate('/teacher/courses/create')}>
          <FiPlus />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon total">
            <FiBook />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Active</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon draft">
            <FiClock />
          </div>
          <div className="stat-content">
            <h3>{stats.draft}</h3>
            <p>Draft</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <FiBarChart2 />
          </div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Courses
        </button>
        <button 
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button 
          className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Draft
        </button>
        <button 
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <div className="empty-state">
          <FiBook className="empty-icon" />
          <h3>No courses found</h3>
          <p>
            {filter === 'all' 
              ? "Create your first course to get started"
              : `No ${filter} courses at the moment`}
          </p>
          <button className="btn-primary" onClick={() => navigate('/teacher/courses/create')}>
            Create Course
          </button>
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map((course) => {
            const statusColor = getStatusColor(course.status);
            const statusIcon = getStatusIcon(course.status);
            const studentCount = enrollmentCounts[course._id] || 0;
            
            return (
              <div key={course._id} className="course-card">
                {/* Card Header */}
                <div className="card-header">
                  <div 
                    className="status-indicator"
                    style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                  >
                    {statusIcon}
                    <span>{course.status}</span>
                  </div>
                  <span className="course-code">{course.courseCode}</span>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">
                    {course.description || 'No description available'}
                  </p>

                  {/* Course Stats */}
                  <div className="course-stats">
                    <div className="stat-item">
                      <FiUsers className="stat-icon" />
                      <span>{studentCount}<br/>Students</span>
                    </div>
                    <div className="stat-item">
                      <FiCalendar className="stat-icon" />
                      <span>{course.totalDays}<br/>Days</span>
                    </div>
                    <div className="stat-item">
                      <FiBook className="stat-icon" />
                      <span>{course.days?.reduce((sum, day) => sum + (day.topics?.length || 0), 0) || 0}<br/>Topics</span>
                    </div>
                  </div>

                  {/* Enrollment Status */}
                  {course.status === 'active' && (
                    <div className={`enrollment-status ${course.enrollmentEnabled ? 'open' : 'closed'}`}>
                      {course.enrollmentEnabled ? '✓ Enrollment Open' : '✗ Enrollment Closed'}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="card-actions">
                  <button 
                    className="action-btn view"
                    onClick={() => navigate(`/teacher/courses/${course._id}`)}
                    title="View Course"
                  >
                    <FiEye />
                    <span>View</span>
                  </button>
                  <button 
                    className="action-btn edit"
                    onClick={() => navigate(`/teacher/courses/${course._id}/edit`)}
                    title="Edit Course"
                  >
                    <FiEdit3 />
                    <span>Edit</span>
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDelete(course._id, course.title)}
                    title="Delete Course"
                  >
                    <FiTrash2 />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCourses;