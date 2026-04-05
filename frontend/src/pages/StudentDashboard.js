import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StudentDashboardHome from '../components/student/StudentDashboardHome';
import StudentCourses from '../components/student/StudentCourses';
import StudentCourseDetails from '../components/student/StudentCourseDetails';
import StudentAttendance from '../components/student/StudentAttendance';
import StudentTimetable from '../components/student/StudentTimetable';
import BrowseCourses from '../components/student/BrowseCourses';
import CourseCertificate from '../components/student/CourseCertificate';
import MyCertificates from '../components/student/MyCertificates';
import CourseEvaluation from '../components/student/CourseEvaluation';
import CertificateVerification from './CertificateVerification';
import Profile from './Profile';
import './Dashboard.css';

const StudentDashboard = () => {
  return (
    <div className="dashboard-container">
      <Sidebar isTeacher={false} />
      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardHome />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="courses/:id" element={<StudentCourseDetails />} />
          <Route path="browse" element={<BrowseCourses />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="certificates" element={<MyCertificates />} />
          <Route path="certificate/:courseId" element={<CourseCertificate />} />
          <Route path="verify-certificate" element={<CertificateVerification />} />
          <Route path="evaluation/:courseId" element={<CourseEvaluation />} />
          <Route path="profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
};

export default StudentDashboard;

