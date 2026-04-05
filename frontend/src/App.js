import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Loader from './components/Loader';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Profile from './pages/Profile';
import StudentEvaluation from './pages/StudentEvaluation';
import SecretAnalytics from './pages/SecretAnalytics';
import CourseAnalytics from './pages/CourseAnalytics';
import AdminDashboard from './pages/AdminDashboard';
import Documentation from './pages/Documentation';
import PublicEvaluations from './pages/PublicEvaluations';
import CertificateVerification from './pages/CertificateVerification';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loader for 3 seconds on initial load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/doc" element={<Documentation />} />
          <Route path="/evaluations" element={<PublicEvaluations />} />
          <Route path="/evaluations/:courseId" element={<PublicEvaluations />} />
          <Route path="/verify-certificate" element={<CertificateVerification />} />
          <Route path="/secret-analytics" element={<SecretAnalytics />} />
          <Route path="/secret-analytics/course/:courseId" element={<CourseAnalytics />} />
          <Route
            path="/student/*"
            element={
              <PrivateRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/student/evaluation/:id"
            element={
              <PrivateRoute allowedRoles={["student"]}>
                <StudentEvaluation />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/*"
            element={
              <PrivateRoute allowedRoles={["teacher"]}>
                <TeacherDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

