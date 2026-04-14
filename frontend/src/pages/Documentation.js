import React, { useState } from 'react';
import './Documentation.css';

const Documentation = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: '📋 Overview', icon: '🏠' },
    { id: 'getting-started', title: '🚀 Getting Started', icon: '🚀' },
    { id: 'admin', title: '👨‍💼 Admin Panel', icon: '👨‍💼' },
    { id: 'teacher', title: '👨‍🏫 Teacher Portal', icon: '👨‍🏫' },
    { id: 'student', title: '👨‍🎓 Student Portal', icon: '👨‍🎓' },
    { id: 'features', title: '✨ Features', icon: '✨' },
    { id: 'ai-ml', title: '🤖 AI & ML', icon: '🤖' },
    { id: 'api', title: '🔗 API Endpoints', icon: '🔗' },
    { id: 'tech-stack', title: '🛠️ Tech Stack', icon: '🛠️' },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="doc-container">
      {/* Sidebar Navigation */}
      <nav className="doc-sidebar">
        <div className="doc-logo">
          <span className="logo-icon">📚</span>
          <h1>VAG Training</h1>
          <p>Documentation</p>
        </div>
        <ul className="doc-nav">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                className={activeSection === section.id ? 'active' : ''}
                onClick={() => scrollToSection(section.id)}
              >
                <span className="nav-icon">{section.icon}</span>
                {section.title.split(' ').slice(1).join(' ')}
              </button>
            </li>
          ))}
        </ul>
        <div className="doc-sidebar-footer">
          <a href="/login" className="back-to-app">
            ← Back to Application
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="doc-main">
        {/* Overview Section */}
        <section id="overview" className="doc-section">
          <div className="section-header">
            <h2>📋 System Overview</h2>
            <span className="version-badge">v2.0</span>
          </div>
          <div className="overview-card">
            <h3>Student Feedback Management System</h3>
            <p>
              A comprehensive web-based platform designed for <strong>VAG Training</strong> to manage 
              courses, track student attendance, collect feedback, and generate performance analytics. 
              The system supports three user roles: <strong>Admin</strong>, <strong>Teacher</strong>, 
              and <strong>Student</strong>.
            </p>
          </div>

          <div className="highlight-grid">
            <div className="highlight-card">
              <div className="highlight-icon">🎯</div>
              <h4>Purpose</h4>
              <p>Streamline training program management with real-time feedback and analytics</p>
            </div>
            <div className="highlight-card">
              <div className="highlight-icon">👥</div>
              <h4>Users</h4>
              <p>Multi-role system for Admins, Teachers, and Students</p>
            </div>
            <div className="highlight-card">
              <div className="highlight-icon">📊</div>
              <h4>Analytics</h4>
              <p>Comprehensive reports and performance tracking</p>
            </div>
            <div className="highlight-card">
              <div className="highlight-icon">🔒</div>
              <h4>Secure</h4>
              <p>JWT authentication with role-based access control</p>
            </div>
          </div>

          <div className="urls-section">
            <h3>🔗 Application URLs</h3>
            <div className="url-cards">
              <div className="url-card">
                <span className="url-label">Production URL</span>
                <a href="https://studentfeedback-nine.vercel.app" target="_blank" rel="noopener noreferrer">
                  https://studentfeedback-nine.vercel.app
                </a>
              </div>
              <div className="url-card">
                <span className="url-label">Login Page</span>
                <a href="https://studentfeedback-nine.vercel.app/login" target="_blank" rel="noopener noreferrer">
                  https://studentfeedback-nine.vercel.app/login
                </a>
              </div>
              <div className="url-card">
                <span className="url-label">Admin Panel</span>
                <a href="https://studentfeedback-nine.vercel.app/admin" target="_blank" rel="noopener noreferrer">
                  https://studentfeedback-nine.vercel.app/admin
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section id="getting-started" className="doc-section">
          <div className="section-header">
            <h2>🚀 Getting Started</h2>
          </div>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Register as Student or Teacher</h4>
                <p>Go to the registration page and create an account</p>
                <div className="code-block">
                  <code>https://studentfeedback-nine.vercel.app/register</code>
                </div>
                <ul className="step-details">
                  <li>Select your role (Student/Teacher)</li>
                  <li>Fill in required details (Name, Email, Password)</li>
                  <li>For Students: Enter Branch and Section</li>
                  <li>For Teachers: Enter Department and Designation</li>
                </ul>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Teacher Approval (For Teachers Only)</h4>
                <p>After registration, teachers need admin approval</p>
                <div className="info-box warning">
                  <span className="info-icon">⚠️</span>
                  <p>Teachers cannot access their dashboard until approved by admin</p>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Admin Approves Teacher</h4>
                <p>Admin logs in and approves pending teachers</p>
                <div className="code-block">
                  <code>https://studentfeedback-nine.vercel.app/admin</code>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Login & Start Using</h4>
                <p>Once approved, login with your credentials</p>
                <div className="code-block">
                  <code>https://studentfeedback-nine.vercel.app/login</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Admin Section */}
        <section id="admin" className="doc-section">
          <div className="section-header">
            <h2>👨‍💼 Admin Panel</h2>
          </div>

          <div className="credentials-card">
            <h3>🔐 Admin Credentials</h3>
            <div className="credentials">
              <div className="credential-item">
                <span className="label">Email:</span>
                <span className="value">admin@vagtraining.com</span>
              </div>
              <div className="credential-item">
                <span className="label">Password:</span>
                <span className="value">Admin@123</span>
              </div>
            </div>
            <div className="credential-url">
              <span className="label">Access URL:</span>
              <a href="https://studentfeedback-nine.vercel.app/admin" target="_blank" rel="noopener noreferrer">
                https://studentfeedback-nine.vercel.app/admin
              </a>
            </div>
          </div>

          <h3>Admin Capabilities</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h4>Approve Teachers</h4>
              <p>Review and approve pending teacher registrations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>Dashboard Analytics</h4>
              <p>View comprehensive statistics and metrics</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h4>User Management</h4>
              <p>View all students and teachers, delete users</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h4>Course Overview</h4>
              <p>Monitor all courses across the platform</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h4>Enrollment Stats</h4>
              <p>Track enrollment numbers and status</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📥</div>
              <h4>Export Data</h4>
              <p>Download reports as CSV files</p>
            </div>
          </div>

          <h3>Admin Dashboard Tabs</h3>
          <div className="tabs-list">
            <div className="tab-item">
              <span className="tab-icon">📈</span>
              <div>
                <h5>Overview</h5>
                <p>Summary cards, performance metrics, distribution charts</p>
              </div>
            </div>
            <div className="tab-item">
              <span className="tab-icon">📚</span>
              <div>
                <h5>Courses</h5>
                <p>All courses with filters by status, search functionality</p>
              </div>
            </div>
            <div className="tab-item">
              <span className="tab-icon">📋</span>
              <div>
                <h5>Enrollments</h5>
                <p>Student enrollments with progress tracking</p>
              </div>
            </div>
            <div className="tab-item">
              <span className="tab-icon">👨‍🏫</span>
              <div>
                <h5>Teachers</h5>
                <p>Manage teachers, approve/revoke status</p>
              </div>
            </div>
            <div className="tab-item">
              <span className="tab-icon">👨‍🎓</span>
              <div>
                <h5>Students</h5>
                <p>View all students with branch/section filters</p>
              </div>
            </div>
            <div className="tab-item">
              <span className="tab-icon">💬</span>
              <div>
                <h5>Feedback</h5>
                <p>Feedback sentiment analysis and ratings</p>
              </div>
            </div>
            <div className="tab-item">
              <span className="tab-icon">📄</span>
              <div>
                <h5>Reports</h5>
                <p>Export data as CSV (Students, Teachers, Courses, etc.)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Teacher Section */}
        <section id="teacher" className="doc-section">
          <div className="section-header">
            <h2>👨‍🏫 Teacher Portal</h2>
          </div>

          <div className="info-box">
            <span className="info-icon">ℹ️</span>
            <p>Teachers must be approved by admin before accessing the dashboard</p>
          </div>

          <h3>Teacher Workflow</h3>
          <div className="workflow">
            <div className="workflow-step">
              <span className="workflow-num">1</span>
              <span>Register as Teacher</span>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <span className="workflow-num">2</span>
              <span>Wait for Admin Approval</span>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <span className="workflow-num">3</span>
              <span>Login to Dashboard</span>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <span className="workflow-num">4</span>
              <span>Create & Manage Courses</span>
            </div>
          </div>

          <h3>Teacher Features</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h4>Create Courses</h4>
              <p>Design multi-day courses with sections and sub-sections</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✏️</div>
              <h4>Edit Courses</h4>
              <p>Modify course content, add timetable details</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h4>Manage Enrollments</h4>
              <p>Approve or reject student enrollment requests</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h4>Mark Attendance</h4>
              <p>Take daily attendance for enrolled students</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h4>Mark Day Complete</h4>
              <p>Mark training days as completed</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>View Analytics</h4>
              <p>Track course performance and student feedback</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h4>Timetable</h4>
              <p>View and manage course schedules</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📑</div>
              <h4>Survey Analytics</h4>
              <p>Analyze student survey responses</p>
            </div>
          </div>

          <h3>Creating a Course</h3>
          <div className="process-steps">
            <div className="process-step">
              <div className="process-icon">1️⃣</div>
              <div className="process-content">
                <h5>Basic Details</h5>
                <p>Enter course title, description, start date</p>
              </div>
            </div>
            <div className="process-step">
              <div className="process-icon">2️⃣</div>
              <div className="process-content">
                <h5>Set Duration</h5>
                <p>Choose total training days (1-30 days)</p>
              </div>
            </div>
            <div className="process-step">
              <div className="process-icon">3️⃣</div>
              <div className="process-content">
                <h5>Add Sections</h5>
                <p>Create sections for each day with topics</p>
              </div>
            </div>
            <div className="process-step">
              <div className="process-icon">4️⃣</div>
              <div className="process-content">
                <h5>Activate Course</h5>
                <p>Enable enrollment and set status to Active</p>
              </div>
            </div>
          </div>
        </section>

        {/* Student Section */}
        <section id="student" className="doc-section">
          <div className="section-header">
            <h2>👨‍🎓 Student Portal</h2>
          </div>

          <h3>Student Workflow</h3>
          <div className="workflow">
            <div className="workflow-step">
              <span className="workflow-num">1</span>
              <span>Register Account</span>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <span className="workflow-num">2</span>
              <span>Browse Courses</span>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <span className="workflow-num">3</span>
              <span>Enroll in Course</span>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <span className="workflow-num">4</span>
              <span>Complete Training</span>
            </div>
          </div>

          <h3>Student Features</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h4>Browse Courses</h4>
              <p>View all available courses and enroll</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h4>My Courses</h4>
              <p>View enrolled courses and track progress</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h4>View Attendance</h4>
              <p>Check attendance records for each course</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h4>Daily Ratings</h4>
              <p>Rate each training day (1-5 stars)</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h4>Course Survey</h4>
              <p>Complete end-of-course feedback survey</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h4>Certificates</h4>
              <p>Download completion certificates</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h4>Timetable</h4>
              <p>View upcoming class schedules</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👤</div>
              <h4>Profile</h4>
              <p>Update personal information and photo</p>
            </div>
          </div>

          <h3>Certificate Requirements</h3>
          <div className="requirements-box">
            <p>To receive a course completion certificate, students must:</p>
            <ul>
              <li>✅ Complete all training days</li>
              <li>✅ Maintain minimum 75% attendance</li>
              <li>✅ Submit course evaluation survey</li>
              <li>✅ Achieve 100% course progress</li>
            </ul>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="doc-section">
          <div className="section-header">
            <h2>✨ Key Features</h2>
          </div>

          <div className="features-showcase">
            <div className="feature-showcase-item">
              <div className="showcase-icon">🔐</div>
              <div className="showcase-content">
                <h4>Authentication & Authorization</h4>
                <ul>
                  <li>JWT-based secure authentication</li>
                  <li>Role-based access control (Admin/Teacher/Student)</li>
                  <li>Teacher approval workflow</li>
                  <li>Persistent login sessions</li>
                </ul>
              </div>
            </div>

            <div className="feature-showcase-item">
              <div className="showcase-icon">📚</div>
              <div className="showcase-content">
                <h4>Course Management</h4>
                <ul>
                  <li>Multi-day course creation (1-30 days)</li>
                  <li>Sections and sub-sections structure</li>
                  <li>Auto-generated course codes</li>
                  <li>Course status management (Draft/Active/Completed)</li>
                </ul>
              </div>
            </div>

            <div className="feature-showcase-item">
              <div className="showcase-icon">📋</div>
              <div className="showcase-content">
                <h4>Attendance System</h4>
                <ul>
                  <li>Daily attendance marking</li>
                  <li>Present/Absent/Late status</li>
                  <li>Attendance percentage calculation</li>
                  <li>Attendance reports and exports</li>
                </ul>
              </div>
            </div>

            <div className="feature-showcase-item">
              <div className="showcase-icon">💬</div>
              <div className="showcase-content">
                <h4>Feedback & Evaluation</h4>
                <ul>
                  <li>Daily rating system (1-5 stars)</li>
                  <li>Comprehensive course surveys</li>
                  <li>Anonymous feedback option</li>
                  <li>Sentiment analysis</li>
                </ul>
              </div>
            </div>

            <div className="feature-showcase-item">
              <div className="showcase-icon">📊</div>
              <div className="showcase-content">
                <h4>Analytics & Reports</h4>
                <ul>
                  <li>Real-time dashboard analytics</li>
                  <li>Branch-wise student distribution</li>
                  <li>Course performance metrics</li>
                  <li>CSV export functionality</li>
                </ul>
              </div>
            </div>

            <div className="feature-showcase-item">
              <div className="showcase-icon">🎓</div>
              <div className="showcase-content">
                <h4>Certificates</h4>
                <ul>
                  <li>Auto-generated completion certificates</li>
                  <li>PDF download option</li>
                  <li>Certificate verification</li>
                  <li>Attendance-based eligibility</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* AI & ML Section */}
        <section id="ai-ml" className="doc-section">
          <div className="section-header">
            <h2>🤖 AI & Machine Learning</h2>
            <span className="version-badge">NEW</span>
          </div>

          <div className="ai-intro-card">
            <div className="ai-intro-icon">🧠</div>
            <div className="ai-intro-content">
              <h3>Intelligent Features Powered by AI</h3>
              <p>
                Our platform integrates cutting-edge AI and Machine Learning capabilities to enhance 
                the user experience and automate repetitive tasks. We leverage Google's Gemini AI 
                for intelligent content generation.
              </p>
            </div>
          </div>

          <h3>Current AI Features</h3>
          <div className="ai-features-grid">
            <div className="ai-feature-card active">
              <div className="ai-feature-status">✅ Live</div>
              <div className="ai-feature-icon">📝</div>
              <h4>Auto Course Description</h4>
              <p>When teachers create a course, AI automatically generates a professional course description based on the title.</p>
              <div className="ai-tech-badge">
                <span>Gemini 1.5 Flash</span>
              </div>
            </div>
          </div>

          <h3>Upcoming AI Features (Roadmap)</h3>
          <div className="ai-features-grid">
            <div className="ai-feature-card upcoming">
              <div className="ai-feature-status">🔜 Coming Soon</div>
              <div className="ai-feature-icon">💬</div>
              <h4>Sentiment Analysis</h4>
              <p>Automatically analyze student feedback to detect positive, negative, or neutral sentiment patterns.</p>
              <div className="ai-tech-badge">
                <span>NLP</span>
                <span>Gemini Pro</span>
              </div>
            </div>

            <div className="ai-feature-card upcoming">
              <div className="ai-feature-status">🔜 Coming Soon</div>
              <div className="ai-feature-icon">📊</div>
              <h4>Predictive Analytics</h4>
              <p>Predict student performance, course completion rates, and identify at-risk students early.</p>
              <div className="ai-tech-badge">
                <span>Machine Learning</span>
                <span>TensorFlow</span>
              </div>
            </div>

            <div className="ai-feature-card upcoming">
              <div className="ai-feature-status">🔜 Coming Soon</div>
              <div className="ai-feature-icon">🎯</div>
              <h4>Smart Recommendations</h4>
              <p>Recommend courses to students based on their interests, past enrollments, and skill gaps.</p>
              <div className="ai-tech-badge">
                <span>Collaborative Filtering</span>
              </div>
            </div>

            <div className="ai-feature-card upcoming">
              <div className="ai-feature-status">🔜 Coming Soon</div>
              <div className="ai-feature-icon">📄</div>
              <h4>Auto Content Generation</h4>
              <p>Generate course sections, quiz questions, and learning materials using AI assistance.</p>
              <div className="ai-tech-badge">
                <span>Gemini Pro</span>
                <span>LLM</span>
              </div>
            </div>

            <div className="ai-feature-card upcoming">
              <div className="ai-feature-status">🔜 Coming Soon</div>
              <div className="ai-feature-icon">🗣️</div>
              <h4>AI Chatbot Assistant</h4>
              <p>Interactive chatbot to answer student queries about courses, schedules, and learning materials.</p>
              <div className="ai-tech-badge">
                <span>Conversational AI</span>
                <span>RAG</span>
              </div>
            </div>

            <div className="ai-feature-card upcoming">
              <div className="ai-feature-status">🔜 Coming Soon</div>
              <div className="ai-feature-icon">📈</div>
              <h4>Attendance Prediction</h4>
              <p>Predict student attendance patterns and send proactive reminders to improve participation.</p>
              <div className="ai-tech-badge">
                <span>Time Series ML</span>
              </div>
            </div>
          </div>

          <div className="ai-tech-stack">
            <h3>AI Technology Stack</h3>
            <div className="ai-tech-items">
              <div className="ai-tech-item">
                <span className="tech-logo">🔮</span>
                <div>
                  <h5>Google Gemini AI</h5>
                  <p>Content generation & NLP</p>
                </div>
              </div>
              <div className="ai-tech-item">
                <span className="tech-logo">🧮</span>
                <div>
                  <h5>TensorFlow.js</h5>
                  <p>Client-side ML models</p>
                </div>
              </div>
              <div className="ai-tech-item">
                <span className="tech-logo">🐍</span>
                <div>
                  <h5>Python ML Services</h5>
                  <p>Backend ML processing</p>
                </div>
              </div>
              <div className="ai-tech-item">
                <span className="tech-logo">📊</span>
                <div>
                  <h5>Scikit-learn</h5>
                  <p>Predictive models</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* API Section */}
        <section id="api" className="doc-section">
          <div className="section-header">
            <h2>🔗 API Endpoints</h2>
          </div>

          <div className="api-section">
            <h3>Base URL</h3>
            <div className="code-block">
              <code>/api</code>
            </div>

            <h3>Authentication</h3>
            <div className="api-table">
              <div className="api-row header">
                <span>Method</span>
                <span>Endpoint</span>
                <span>Description</span>
              </div>
              <div className="api-row">
                <span className="method post">POST</span>
                <span>/auth/register</span>
                <span>Register new user</span>
              </div>
              <div className="api-row">
                <span className="method post">POST</span>
                <span>/auth/login</span>
                <span>User login</span>
              </div>
              <div className="api-row">
                <span className="method get">GET</span>
                <span>/auth/me</span>
                <span>Get current user</span>
              </div>
            </div>

            <h3>Courses</h3>
            <div className="api-table">
              <div className="api-row header">
                <span>Method</span>
                <span>Endpoint</span>
                <span>Description</span>
              </div>
              <div className="api-row">
                <span className="method get">GET</span>
                <span>/courses</span>
                <span>Get all active courses</span>
              </div>
              <div className="api-row">
                <span className="method post">POST</span>
                <span>/courses</span>
                <span>Create course (Teacher)</span>
              </div>
              <div className="api-row">
                <span className="method get">GET</span>
                <span>/courses/:id</span>
                <span>Get course details</span>
              </div>
              <div className="api-row">
                <span className="method put">PUT</span>
                <span>/courses/:id</span>
                <span>Update course</span>
              </div>
            </div>

            <h3>Enrollments</h3>
            <div className="api-table">
              <div className="api-row header">
                <span>Method</span>
                <span>Endpoint</span>
                <span>Description</span>
              </div>
              <div className="api-row">
                <span className="method post">POST</span>
                <span>/enrollments</span>
                <span>Enroll in course</span>
              </div>
              <div className="api-row">
                <span className="method get">GET</span>
                <span>/enrollments/course/:id</span>
                <span>Get course enrollments</span>
              </div>
              <div className="api-row">
                <span className="method put">PUT</span>
                <span>/enrollments/:id/status</span>
                <span>Update enrollment status</span>
              </div>
            </div>

            <h3>Admin</h3>
            <div className="api-table">
              <div className="api-row header">
                <span>Method</span>
                <span>Endpoint</span>
                <span>Description</span>
              </div>
              <div className="api-row">
                <span className="method post">POST</span>
                <span>/admin/login</span>
                <span>Admin login</span>
              </div>
              <div className="api-row">
                <span className="method get">GET</span>
                <span>/admin/dashboard-analytics</span>
                <span>Get dashboard stats</span>
              </div>
              <div className="api-row">
                <span className="method put">PUT</span>
                <span>/admin/approve-teacher/:id</span>
                <span>Approve teacher</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section id="tech-stack" className="doc-section">
          <div className="section-header">
            <h2>🛠️ Technology Stack</h2>
          </div>

          <div className="tech-grid">
            <div className="tech-category">
              <h3>Frontend</h3>
              <div className="tech-items">
                <div className="tech-item">
                  <span className="tech-icon">⚛️</span>
                  <span>React.js 18</span>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">🛣️</span>
                  <span>React Router v6</span>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">🎨</span>
                  <span>CSS3</span>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">📡</span>
                  <span>Axios</span>
                </div>
              </div>
            </div>

            <div className="tech-category">
              <h3>Backend</h3>
              <div className="tech-items">
                <div className="tech-item">
                  <span className="tech-icon">🟢</span>
                  <span>Node.js</span>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">🚂</span>
                  <span>Express.js</span>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">🔐</span>
                  <span>JWT Authentication</span>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">📁</span>
                  <span>Multer (File Upload)</span>
                </div>
              </div>
            </div>

            <div className="tech-category">
              <h3>Database</h3>
              <div className="tech-items">
                <div className="tech-item">
                  <span className="tech-icon">🍃</span>
                  <span>MongoDB Atlas</span>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">📦</span>
                  <span>Mongoose ODM</span>
                </div>
              </div>
            </div>

            <div className="tech-category">
              <h3>Deployment</h3>
              <div className="tech-items">
                <div className="tech-item">
                  <span className="tech-icon">▲</span>
                  <span>Vercel (Frontend)</span>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">🚀</span>
                  <span>Render (Backend)</span>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">☁️</span>
                  <span>Cloudinary (Images)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-section">
            <h3>📧 Support & Contact</h3>
            <p>For technical support or inquiries, please contact the development team.</p>
            <div className="contact-info">
              <div className="contact-item">
                <span>📧</span>
                <span>admin@vagtraining.com</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="doc-footer">
          <p>© 2026 VAG Training - Student Feedback Management System</p>
          <p>Documentation v2.0 | Last Updated: January 2026</p>
        </footer>
      </main>
    </div>
  );
};

export default Documentation;
