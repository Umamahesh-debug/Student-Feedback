import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  FiBook, FiCalendar, FiClock, FiSettings, FiLogOut, 
  FiBarChart2, FiUsers, FiCheckSquare, FiFileText, FiAward 
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ isTeacher = false }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { path: '/student/dashboard', label: 'My Learning', icon: FiBook },
    { path: '/student/browse', label: 'Browse Courses', icon: FiBook },
    { path: '/student/courses', label: 'My Courses', icon: FiBook },
    { path: '/student/attendance', label: 'Attendance', icon: FiCalendar },
    { path: '/student/timetable', label: 'Timetable', icon: FiClock },
    { path: '/student/certificates', label: 'Certificates', icon: FiAward },
    { path: '/student/verify-certificate', label: 'Verify Certificate', icon: FiFileText },
  ];

  const teacherLinks = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: FiBarChart2 },
    { path: '/teacher/courses', label: 'My Courses', icon: FiBook },
    { path: '/teacher/enrollments', label: 'Enrollments', icon: FiUsers },
    { path: '/teacher/attendance', label: 'Attendance', icon: FiCheckSquare },
    { path: '/teacher/analytics', label: 'Program Analytics', icon: FiBarChart2 },
    { path: '/teacher/timetable', label: 'Timetable', icon: FiClock },
    { path: '/teacher/verify-certificate', label: 'Verify Certificate', icon: FiFileText },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>VAG Training</h2>
        <p>Analytics & Management</p>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} />
            ) : (
              <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            )}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.name || 'User'}</p>
            <p className="user-role">{user?.role === 'teacher' ? 'Teacher' : 'Student'}</p>
          </div>
        </div>
        <Link to={isTeacher ? '/teacher/profile' : '/student/profile'} className="nav-link">
          <FiSettings />
          <span>Profile</span>
        </Link>
        <button onClick={handleLogout} className="nav-link logout-btn">
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

