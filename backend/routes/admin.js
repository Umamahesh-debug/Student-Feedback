const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const AttendanceDayImage = require('../models/AttendanceDayImage');
const Evaluation = require('../models/Evaluation');
const DayRating = require('../models/DayRating');
const Feedback = require('../models/Feedback');

// Hardcoded Admin Credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@vagtraining.com',
  password: 'Admin@123'
};

// Admin Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    return res.json({
      token,
      user: {
        email: ADMIN_CREDENTIALS.email,
        role: 'admin',
        name: 'Administrator'
      }
    });
  }

  return res.status(401).json({ message: 'Invalid admin credentials' });
});

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all users (students and teachers)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');

    res.json({
      totalUsers: users.length,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      pendingTeachers: teachers.filter(t => !t.verifiedTeacher).length,
      students,
      teachers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve teacher
router.put('/approve-teacher/:userId', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'teacher') {
      return res.status(400).json({ message: 'User is not a teacher' });
    }

    user.verifiedTeacher = true;
    await user.save();

    res.json({ message: 'Teacher approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Revoke teacher approval
router.put('/revoke-teacher/:userId', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'teacher') {
      return res.status(400).json({ message: 'User is not a teacher' });
    }

    user.verifiedTeacher = false;
    await user.save();

    res.json({ message: 'Teacher approval revoked', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/user/:userId', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Comprehensive Dashboard Analytics
router.get('/dashboard-analytics', verifyAdmin, async (req, res) => {
  try {
    // Get all data
    const [users, courses, enrollments, evaluations, dayRatings] = await Promise.all([
      User.find().select('-password'),
      Course.find().populate('teacher', 'name email'),
      Enrollment.find().populate('student', 'name email branch section').populate('course', 'title courseCode'),
      Evaluation.find().populate('student', 'name').populate('course', 'title'),
      DayRating.find().populate('student', 'name').populate('course', 'title')
    ]);

    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');

    // Course Stats
    const activeCourses = courses.filter(c => c.status === 'active');
    const completedCourses = courses.filter(c => c.status === 'completed');
    const draftCourses = courses.filter(c => c.status === 'draft');

    // Enrollment Stats
    const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
    const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
    
    // Progress & Completion
    const completedStudents = approvedEnrollments.filter(e => e.progress === 100);
    const avgProgress = approvedEnrollments.length > 0 
      ? Math.round(approvedEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / approvedEnrollments.length)
      : 0;

    // Attendance calculation
    const attendanceRecords = await Attendance.find();
    let totalPresent = 0;
    let totalAttendanceRecords = 0;
    attendanceRecords.forEach(record => {
      if (record.records) {
        record.records.forEach(r => {
          totalAttendanceRecords++;
          if (r.status === 'present') totalPresent++;
        });
      }
    });
    const avgAttendance = totalAttendanceRecords > 0 ? Math.round((totalPresent / totalAttendanceRecords) * 100) : 0;

    // Day Ratings Analysis
    const avgDayRating = dayRatings.length > 0
      ? (dayRatings.reduce((sum, r) => sum + r.rating, 0) / dayRatings.length).toFixed(1)
      : 0;

    // Branch-wise student distribution
    const branchDistribution = {};
    students.forEach(s => {
      const branch = s.branch || 'Not Specified';
      branchDistribution[branch] = (branchDistribution[branch] || 0) + 1;
    });

    // Section-wise distribution
    const sectionDistribution = {};
    students.forEach(s => {
      const section = s.section || 'Not Specified';
      sectionDistribution[section] = (sectionDistribution[section] || 0) + 1;
    });

    // Department-wise teacher distribution
    const departmentDistribution = {};
    teachers.forEach(t => {
      const dept = t.department || 'Not Specified';
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
    });

    // Course-wise enrollment count
    const courseEnrollments = {};
    enrollments.forEach(e => {
      if (e.course) {
        const courseId = e.course._id.toString();
        if (!courseEnrollments[courseId]) {
          courseEnrollments[courseId] = {
            title: e.course.title,
            code: e.course.courseCode,
            count: 0,
            approved: 0,
            pending: 0
          };
        }
        courseEnrollments[courseId].count++;
        if (e.status === 'approved') courseEnrollments[courseId].approved++;
        if (e.status === 'pending') courseEnrollments[courseId].pending++;
      }
    });

    // Feedback Sentiment (based on day ratings)
    const positiveFeedback = dayRatings.filter(r => r.rating >= 4).length;
    const neutralFeedback = dayRatings.filter(r => r.rating === 3).length;
    const negativeFeedback = dayRatings.filter(r => r.rating <= 2).length;

    // Monthly registrations (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRegistrations = {};
    users.filter(u => new Date(u.createdAt) >= sixMonthsAgo).forEach(u => {
      const month = new Date(u.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyRegistrations[month] = (monthlyRegistrations[month] || 0) + 1;
    });

    res.json({
      // Summary Stats
      summary: {
        totalUsers: users.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        pendingTeachers: teachers.filter(t => !t.verifiedTeacher).length,
        approvedTeachers: teachers.filter(t => t.verifiedTeacher).length
      },
      
      // Course Stats
      courses: {
        total: courses.length,
        active: activeCourses.length,
        completed: completedCourses.length,
        draft: draftCourses.length,
        list: courses.map(c => ({
          _id: c._id,
          title: c.title,
          courseCode: c.courseCode,
          status: c.status,
          teacher: c.teacher?.name || 'Unassigned',
          totalDays: c.totalDays,
          startDate: c.startDate,
          enrolledCount: courseEnrollments[c._id.toString()]?.approved || 0
        }))
      },

      // Enrollment Stats
      enrollments: {
        total: enrollments.length,
        approved: approvedEnrollments.length,
        pending: pendingEnrollments.length,
        courseWise: Object.values(courseEnrollments)
      },

      // Performance Metrics
      performance: {
        avgProgress,
        avgAttendance,
        avgDayRating: parseFloat(avgDayRating),
        completionRate: approvedEnrollments.length > 0 
          ? Math.round((completedStudents.length / approvedEnrollments.length) * 100) 
          : 0,
        totalCompletions: completedStudents.length
      },

      // Feedback Analysis
      feedback: {
        totalRatings: dayRatings.length,
        totalEvaluations: evaluations.length,
        sentiment: {
          positive: positiveFeedback,
          neutral: neutralFeedback,
          negative: negativeFeedback
        }
      },

      // Distributions
      distributions: {
        branches: branchDistribution,
        sections: sectionDistribution,
        departments: departmentDistribution,
        monthlyRegistrations
      },

      // Raw data for tables
      students,
      teachers,
      recentEnrollments: enrollments.slice(0, 20)
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get courses for management
router.get('/courses', verifyAdmin, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email department')
      .sort({ createdAt: -1 });
    
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    enrollmentCounts.forEach(e => {
      countMap[e._id.toString()] = e.count;
    });

    const coursesWithStats = courses.map(c => ({
      ...c.toObject(),
      enrolledCount: countMap[c._id.toString()] || 0
    }));

    res.json(coursesWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export data endpoint
router.get('/export/:type', verifyAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    let data;

    switch (type) {
      case 'students':
        data = await User.find({ role: 'student' }).select('-password');
        break;
      case 'teachers':
        data = await User.find({ role: 'teacher' }).select('-password');
        break;
      case 'courses':
        data = await Course.find().populate('teacher', 'name email');
        break;
      case 'enrollments':
        data = await Enrollment.find()
          .populate('student', 'name email branch')
          .populate('course', 'title courseCode');
        break;
      case 'evaluations':
        const evalQuery = {};
        if (req.query.courseId) {
          evalQuery.course = req.query.courseId;
        }
        const evaluations = await Evaluation.find(evalQuery)
          .populate('student', 'name email rollNumber branch section')
          .populate('course', 'title courseCode');
        
        // Transform evaluations to flat rows with only question columns in numerical order
        data = evaluations.map(ev => {
          const row = {};
          
          // Add questions in numerical order (Q1, Q2, Q3... Q20)
          for (let i = 1; i <= 20; i++) {
            const key = `q${i}`;
            row[`Q${i}`] = ev.answers?.[key] || '';
          }
          
          return row;
        });
        break;
      case 'attendance':
        // Pivot format: rows = students, columns = Day1..DayN
        const attQuery = {};
        if (req.query.courseId) {
          attQuery.course = req.query.courseId;
        }
        const attRecords = await Attendance.find(attQuery)
          .populate('student', 'name email rollNumber branch section')
          .populate('course', 'title courseCode');

        // Get courses involved to know totalDays
        const courseIds = [...new Set(attRecords.map(r => r.course?._id?.toString()).filter(Boolean))];
        const attCourses = await Course.find({ _id: { $in: courseIds } }).select('title courseCode totalDays');
        const courseMap = {};
        attCourses.forEach(c => { courseMap[c._id.toString()] = c; });

        // Get enrolled students per course
        const attEnrollments = await Enrollment.find(
          courseIds.length === 1 ? { course: courseIds[0] } : { course: { $in: courseIds } }
        ).populate('student', 'name email rollNumber branch section');

        // Build pivot per course
        const pivotRows = [];
        const groupedByCourse = {};
        
        // Group attendance records by course
        attRecords.forEach(r => {
          const cid = r.course?._id?.toString();
          if (!cid) return;
          if (!groupedByCourse[cid]) groupedByCourse[cid] = [];
          groupedByCourse[cid].push(r);
        });

        // Also include courses with enrolled students but no attendance yet
        attEnrollments.forEach(enr => {
          const cid = enr.course?.toString();
          if (cid && !groupedByCourse[cid]) groupedByCourse[cid] = [];
        });

        for (const cid of Object.keys(groupedByCourse)) {
          const course = courseMap[cid];
          if (!course) continue;
          const totalDays = course.totalDays || 1;
          const records = groupedByCourse[cid];

          // Build lookup: studentId -> { dayNumber -> status }
          const studentAttMap = {};
          records.forEach(r => {
            const sid = r.student?._id?.toString();
            if (!sid) return;
            if (!studentAttMap[sid]) {
              studentAttMap[sid] = {
                name: r.student.name,
                email: r.student.email,
                rollNumber: r.student.rollNumber || '',
                branch: r.student.branch || '',
                section: r.student.section || '',
                days: {}
              };
            }
            studentAttMap[sid].days[r.dayNumber] = r.status;
          });

          // Also add enrolled students who may have no attendance
          attEnrollments
            .filter(e => e.course?.toString() === cid && e.student)
            .forEach(e => {
              const sid = e.student._id.toString();
              if (!studentAttMap[sid]) {
                studentAttMap[sid] = {
                  name: e.student.name,
                  email: e.student.email,
                  rollNumber: e.student.rollNumber || '',
                  branch: e.student.branch || '',
                  section: e.student.section || '',
                  days: {}
                };
              }
            });

          // Build rows for this course
          for (const sid of Object.keys(studentAttMap)) {
            const s = studentAttMap[sid];
            const row = {
              course: course.title,
              courseCode: course.courseCode,
              studentName: s.name,
              email: s.email,
              rollNumber: s.rollNumber,
              branch: s.branch,
              section: s.section
            };
            for (let d = 1; d <= totalDays; d++) {
              row[`Day${d}`] = s.days[d] || 'Not Marked';
            }
            pivotRows.push(row);
          }
        }
        data = pivotRows;
        break;
      case 'feedback':
        data = await Feedback.find()
          .populate('student', 'name email rollNumber branch')
          .populate('course', 'title courseCode');
        break;
      case 'dayratings':
        // Pivot format: rows = students, columns = Day1_Rating, Day1_Comment...
        const drQuery = {};
        if (req.query.courseId) {
          drQuery.course = req.query.courseId;
        }
        const drRecords = await DayRating.find(drQuery)
          .populate('student', 'name email rollNumber branch section')
          .populate('course', 'title courseCode');

        const drCourseIds = [...new Set(drRecords.map(r => r.course?._id?.toString()).filter(Boolean))];
        const drCourses = await Course.find({ _id: { $in: drCourseIds } }).select('title courseCode totalDays');
        const drCourseMap = {};
        drCourses.forEach(c => { drCourseMap[c._id.toString()] = c; });

        // Group by course
        const drGrouped = {};
        drRecords.forEach(r => {
          const cid = r.course?._id?.toString();
          if (!cid) return;
          if (!drGrouped[cid]) drGrouped[cid] = [];
          drGrouped[cid].push(r);
        });

        const drPivotRows = [];
        for (const cid of Object.keys(drGrouped)) {
          const course = drCourseMap[cid];
          if (!course) continue;
          const totalDays = course.totalDays || 1;
          const records = drGrouped[cid];

          // Build lookup: studentId -> { dayNumber -> { rating, comment } }
          const studentMap = {};
          records.forEach(r => {
            const sid = r.student?._id?.toString();
            if (!sid) return;
            if (!studentMap[sid]) {
              studentMap[sid] = {
                name: r.student.name,
                email: r.student.email,
                rollNumber: r.student.rollNumber || '',
                branch: r.student.branch || '',
                days: {}
              };
            }
            studentMap[sid].days[r.dayNumber] = { rating: r.rating, comment: r.comment || '' };
          });

          for (const sid of Object.keys(studentMap)) {
            const s = studentMap[sid];
            const row = {
              course: course.title,
              courseCode: course.courseCode,
              studentName: s.name,
              email: s.email,
              rollNumber: s.rollNumber,
              branch: s.branch
            };
            for (let d = 1; d <= totalDays; d++) {
              row[`Day${d}_Rating`] = s.days[d] ? s.days[d].rating : 'Not Rated';
              row[`Day${d}_Comment`] = s.days[d] ? s.days[d].comment : '';
            }
            drPivotRows.push(row);
          }
        }
        data = drPivotRows;
        break;
      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all courses with attendance report data (structured, with images)
router.get('/attendance-reports', verifyAdmin, async (req, res) => {
  try {
    const courses = await Course.find().populate('teacher', 'name email').sort({ createdAt: -1 });

    const result = [];

    for (const course of courses) {
      // Get enrollments
      const enrollments = await Enrollment.find({
        course: course._id,
        status: 'approved'
      }).populate('student', 'name email rollNumber branch section');

      // Get attendance
      const attendance = await Attendance.find({ course: course._id }).sort({ dayNumber: 1 });

      // Get day images
      const dayImages = await AttendanceDayImage.find({ course: course._id }).sort({ dayNumber: 1 });

      // Build day-wise data
      const daysData = [];
      for (let day = 1; day <= course.totalDays; day++) {
        const dayAtt = attendance.filter(a => a.dayNumber === day);
        const dayImg = dayImages.find(di => di.dayNumber === day);

        const students = enrollments.map(enrollment => {
          const att = dayAtt.find(a => a.student.toString() === enrollment.student._id.toString());
          return {
            name: enrollment.student.name,
            rollNumber: enrollment.student.rollNumber || '',
            branch: enrollment.student.branch || '',
            section: enrollment.student.section || '',
            status: att ? att.status : 'not-marked'
          };
        });

        daysData.push({
          dayNumber: day,
          sectionTitle: course.sections && course.sections[day - 1] ? course.sections[day - 1].title : `Day ${day}`,
          classImage: dayImg ? dayImg.classImage : '',
          attendanceSheetImage: dayImg ? dayImg.attendanceSheetImage : '',
          students,
          presentCount: students.filter(s => s.status === 'present').length,
          absentCount: students.filter(s => s.status === 'absent').length,
          totalStudents: students.length
        });
      }

      // Build student summary
      const studentSummary = enrollments.map(enrollment => {
        const stuAtt = attendance.filter(a => a.student.toString() === enrollment.student._id.toString());
        const presentDays = stuAtt.filter(a => a.status === 'present').length;
        const absentDays = stuAtt.filter(a => a.status === 'absent').length;
        return {
          name: enrollment.student.name,
          email: enrollment.student.email,
          rollNumber: enrollment.student.rollNumber || '',
          branch: enrollment.student.branch || '',
          section: enrollment.student.section || '',
          presentDays,
          absentDays,
          totalDays: course.totalDays,
          percentage: course.totalDays > 0 ? Math.round((presentDays / course.totalDays) * 100) : 0
        };
      });

      result.push({
        courseId: course._id,
        title: course.title,
        courseCode: course.courseCode || '',
        teacher: course.teacher ? course.teacher.name : 'Unknown',
        totalDays: course.totalDays,
        totalStudents: enrollments.length,
        daysData,
        studentSummary
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get single course attendance report data (with images)
router.get('/attendance-reports/:courseId', verifyAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate('teacher', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'approved'
    }).populate('student', 'name email rollNumber branch section');

    const attendance = await Attendance.find({ course: courseId }).sort({ dayNumber: 1 });
    const dayImages = await AttendanceDayImage.find({ course: courseId }).sort({ dayNumber: 1 });

    const daysData = [];
    for (let day = 1; day <= course.totalDays; day++) {
      const dayAtt = attendance.filter(a => a.dayNumber === day);
      const dayImg = dayImages.find(di => di.dayNumber === day);

      const students = enrollments.map(enrollment => {
        const att = dayAtt.find(a => a.student.toString() === enrollment.student._id.toString());
        return {
          name: enrollment.student.name,
          email: enrollment.student.email,
          rollNumber: enrollment.student.rollNumber || '',
          branch: enrollment.student.branch || '',
          section: enrollment.student.section || '',
          status: att ? att.status : 'not-marked'
        };
      });

      daysData.push({
        dayNumber: day,
        sectionTitle: course.sections && course.sections[day - 1] ? course.sections[day - 1].title : `Day ${day}`,
        classImage: dayImg ? dayImg.classImage : '',
        attendanceSheetImage: dayImg ? dayImg.attendanceSheetImage : '',
        students,
        presentCount: students.filter(s => s.status === 'present').length,
        absentCount: students.filter(s => s.status === 'absent').length,
        totalStudents: students.length
      });
    }

    const studentSummary = enrollments.map(enrollment => {
      const stuAtt = attendance.filter(a => a.student.toString() === enrollment.student._id.toString());
      const presentDays = stuAtt.filter(a => a.status === 'present').length;
      const absentDays = stuAtt.filter(a => a.status === 'absent').length;
      return {
        name: enrollment.student.name,
        email: enrollment.student.email,
        rollNumber: enrollment.student.rollNumber || '',
        branch: enrollment.student.branch || '',
        section: enrollment.student.section || '',
        presentDays,
        absentDays,
        totalDays: course.totalDays,
        percentage: course.totalDays > 0 ? Math.round((presentDays / course.totalDays) * 100) : 0
      };
    });

    res.json({
      courseId: course._id,
      title: course.title,
      courseCode: course.courseCode || '',
      teacher: course.teacher ? course.teacher.name : 'Unknown',
      totalDays: course.totalDays,
      totalStudents: enrollments.length,
      daysData,
      studentSummary
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get comprehensive course full report (attendance + ratings + images)
router.get('/course-full-report/:courseId', verifyAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate('teacher', 'name email department');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'approved'
    }).populate('student', 'name email rollNumber branch section');

    const attendance = await Attendance.find({ course: courseId }).sort({ dayNumber: 1 });
    const dayImages = await AttendanceDayImage.find({ course: courseId }).sort({ dayNumber: 1 });
    const dayRatings = await DayRating.find({ course: courseId }).populate('student', 'name');
    const evaluations = await Evaluation.find({ course: courseId });

    const evaluationQuestionConfig = [
      { key: 'q1', text: 'How clearly were the objectives of the training program explained?', category: 'content', scoreMap: { 'Very Clear': 5, 'Clear': 4, 'Neutral': 3, 'Unclear': 2, 'Very Unclear': 1 } },
      { key: 'q2', text: 'How well was the program structured?', category: 'content', scoreMap: { 'Excellent': 5, 'Good': 4, 'Average': 3, 'Poor': 2, 'Very Poor': 1 } },
      { key: 'q3', text: 'Was the duration of the program appropriate?', category: 'content', scoreMap: { 'Appropriate': 5, 'Slightly Long': 3, 'Slightly Short': 3, 'Too Long': 2, 'Too Short': 2 } },
      { key: 'q4', text: 'How relevant was the course content to your needs?', category: 'content', scoreMap: { 'Very Relevant': 5, 'Relevant': 4, 'Neutral': 3, 'Less Relevant': 2, 'Not Relevant': 1 } },
      { key: 'q5', text: 'How would you rate the quality of learning materials?', category: 'content', scoreMap: { 'Excellent': 5, 'Good': 4, 'Average': 3, 'Poor': 2, 'Very Poor': 1 } },
      { key: 'q6', text: 'How understandable was the content delivered?', category: 'content', scoreMap: { 'Very Easy to Understand': 5, 'Easy to Understand': 4, 'Neutral': 3, 'Difficult': 2, 'Very Difficult': 1 } },
      { key: 'q7', text: 'How knowledgeable was the trainer?', category: 'trainer', scoreMap: { 'Highly Knowledgeable': 5, 'Knowledgeable': 4, 'Neutral': 3, 'Less Knowledgeable': 2, 'Not Knowledgeable': 1 } },
      { key: 'q8', text: 'How effective was the trainer\'s explanation style?', category: 'trainer', scoreMap: { 'Very Effective': 5, 'Effective': 4, 'Neutral': 3, 'Ineffective': 2, 'Very Ineffective': 1 } },
      { key: 'q9', text: 'How well did the trainer encourage interaction?', category: 'trainer', scoreMap: { 'Very Well': 5, 'Well': 4, 'Neutral': 3, 'Poorly': 2, 'Very Poorly': 1 } },
      { key: 'q10', text: 'How engaging were the sessions?', category: 'trainer', scoreMap: { 'Highly Engaging': 5, 'Engaging': 4, 'Neutral': 3, 'Less Engaging': 2, 'Not Engaging': 1 } },
      { key: 'q11', text: 'Did activities or discussions help your understanding?', category: 'trainer', scoreMap: { 'Very Helpful': 5, 'Helpful': 4, 'Neutral': 3, 'Less Helpful': 2, 'Not Helpful': 1 } },
      { key: 'q12', text: 'How motivated were you to attend all sessions?', category: 'outcomes', scoreMap: { 'Highly Motivated': 5, 'Motivated': 4, 'Neutral': 3, 'Less Motivated': 2, 'Not Motivated': 1 } },
      { key: 'q13', text: 'How much knowledge or skill did you gain?', category: 'outcomes', scoreMap: { 'A Lot': 5, 'Good Amount': 4, 'Moderate': 3, 'Little': 2, 'None': 1 } },
      { key: 'q14', text: 'How confident do you feel after completing the program?', category: 'outcomes', scoreMap: { 'Very Confident': 5, 'Confident': 4, 'Neutral': 3, 'Less Confident': 2, 'Not Confident': 1 } },
      { key: 'q15', text: 'How useful is this program for your future goals?', category: 'outcomes', scoreMap: { 'Very Useful': 5, 'Useful': 4, 'Neutral': 3, 'Less Useful': 2, 'Not Useful': 1 } },
      { key: 'q16', text: 'What best describes your attendance?', category: 'logistics', scoreMap: { 'Attended All Sessions': 5, 'Missed 1–2 Sessions': 4, 'Missed Several Sessions': 3, 'Attended Few Sessions': 2, 'Rarely Attended': 1 } },
      { key: 'q17', text: 'What was the main reason for missing any sessions?', category: 'logistics', scoreMap: { 'No Sessions Missed': 5, 'Timing Issues': 3, 'Academic Workload': 3, 'Personal Reasons': 2, 'Technical Issues': 2 } },
      { key: 'q18', text: 'How convenient was the session schedule?', category: 'logistics', scoreMap: { 'Very Convenient': 5, 'Convenient': 4, 'Neutral': 3, 'Inconvenient': 2, 'Very Inconvenient': 1 } },
      { key: 'q19', text: 'Overall, how satisfied are you with the program?', category: 'outcomes', scoreMap: { 'Very Satisfied': 5, 'Satisfied': 4, 'Neutral': 3, 'Dissatisfied': 2, 'Very Dissatisfied': 1 } },
      { key: 'q20', text: 'Would you recommend this program to others?', category: 'outcomes', scoreMap: { 'Definitely Yes': 5, 'Probably Yes': 4, 'Not Sure': 3, 'Probably No': 2, 'Definitely No': 1 } }
    ];

    const daysData = [];
    for (let day = 1; day <= course.totalDays; day++) {
      const dayAtt = attendance.filter(a => a.dayNumber === day);
      const dayImg = dayImages.find(di => di.dayNumber === day);
      const dayRats = dayRatings.filter(r => r.dayNumber === day);

      // Get section info from course.sections array
      const sectionInfo = course.sections && course.sections[day - 1] ? course.sections[day - 1] : null;
      
      // Get section title - try nested sections array first, then fallback
      let sectionTitle = `Day ${day}`;
      let sectionDescription = '';
      if (sectionInfo) {
        // Check if there's a nested sections array with headings
        if (sectionInfo.sections && sectionInfo.sections.length > 0 && sectionInfo.sections[0].heading) {
          sectionTitle = sectionInfo.sections.map(s => s.heading).filter(h => h).join(' | ') || `Day ${day}`;
          sectionDescription = sectionInfo.sections.map(s => s.description).filter(d => d).join(' • ');
        } else if (sectionInfo.title) {
          // Fallback to title field if it exists
          sectionTitle = sectionInfo.title;
          sectionDescription = sectionInfo.description || '';
        }
      }

      const students = enrollments.map(enrollment => {
        const att = dayAtt.find(a => a.student.toString() === enrollment.student._id.toString());
        return {
          name: enrollment.student.name,
          email: enrollment.student.email,
          rollNumber: enrollment.student.rollNumber || '',
          branch: enrollment.student.branch || '',
          section: enrollment.student.section || '',
          status: att ? att.status : 'not-marked'
        };
      });

      // Calculate average rating for the day
      const avgRating = dayRats.length > 0 
        ? (dayRats.reduce((sum, r) => sum + r.rating, 0) / dayRats.length).toFixed(1)
        : 0;

      // Get rating distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      dayRats.forEach(r => {
        ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
      });

      // Get rating comments
      const ratingComments = dayRats
        .filter(r => r.comment && r.comment.trim())
        .map(r => ({
          student: r.student ? r.student.name : 'Anonymous',
          rating: r.rating,
          comment: r.comment
        }));

      daysData.push({
        dayNumber: day,
        sectionTitle: sectionTitle,
        sectionDescription: sectionDescription,
        completed: sectionInfo ? sectionInfo.completed : false,
        completedAt: sectionInfo ? sectionInfo.completedAt : null,
        classImage: dayImg ? dayImg.classImage : '',
        attendanceSheetImage: dayImg ? dayImg.attendanceSheetImage : '',
        students,
        presentCount: students.filter(s => s.status === 'present').length,
        absentCount: students.filter(s => s.status === 'absent').length,
        totalStudents: students.length,
        avgRating: parseFloat(avgRating),
        totalRatings: dayRats.length,
        ratingDistribution,
        ratingComments
      });
    }

    const totalDayRatings = dayRatings.length;
    const overallDayRating = totalDayRatings > 0
      ? parseFloat((dayRatings.reduce((sum, r) => sum + r.rating, 0) / totalDayRatings).toFixed(1))
      : 0;

    const questionPerformance = evaluationQuestionConfig.map((question) => {
      let totalScore = 0;
      let responseCount = 0;

      evaluations.forEach((evaluation) => {
        const selectedAnswer = evaluation.answers?.[question.key];
        if (!selectedAnswer) return;
        const mappedScore = question.scoreMap[selectedAnswer];
        if (typeof mappedScore !== 'number') return;
        totalScore += mappedScore;
        responseCount += 1;
      });

      const average = responseCount > 0 ? parseFloat((totalScore / responseCount).toFixed(1)) : 0;
      return {
        key: question.key,
        question: question.text,
        category: question.category,
        average,
        responseCount
      };
    });

    const validQuestionAverages = questionPerformance.filter((q) => q.responseCount > 0);
    const overallQuestionRating = validQuestionAverages.length > 0
      ? parseFloat((validQuestionAverages.reduce((sum, q) => sum + q.average, 0) / validQuestionAverages.length).toFixed(1))
      : 0;

    const categoryMap = {
      trainer: 'Trainer',
      content: 'Content',
      logistics: 'Logistics',
      outcomes: 'Outcomes'
    };

    const categoryPerformance = Object.keys(categoryMap).map((categoryKey) => {
      const items = validQuestionAverages.filter((q) => q.category === categoryKey);
      const average = items.length > 0
        ? parseFloat((items.reduce((sum, item) => sum + item.average, 0) / items.length).toFixed(1))
        : 0;
      return {
        key: categoryKey,
        label: categoryMap[categoryKey],
        average,
        questionCount: items.length
      };
    });

    const lowerRatedQuestions = validQuestionAverages
      .filter((q) => q.average > 0)
      .sort((a, b) => a.average - b.average)
      .slice(0, 5);

    const lowQuestionAlerts = lowerRatedQuestions
      .filter((q) => q.average <= 3.8)
      .map((q) => `Immediate improvement required for: ${q.question} (Avg ${q.average}/5).`);

    const lowCategoryAlerts = categoryPerformance
      .filter((category) => category.questionCount > 0 && category.average > 0 && category.average <= 3.9)
      .map((category) => `Strengthen ${category.label.toLowerCase()} delivery to improve overall learner experience (Avg ${category.average}/5).`);

    const lowDayAlerts = daysData
      .filter((day) => day.totalRatings > 0 && day.avgRating <= 3.8)
      .map((day) => `Review Day ${day.dayNumber} (${day.sectionTitle}) engagement and content flow (Avg ${day.avgRating}/5).`)
      .slice(0, 2);

    const keyImprovementAreas = [
      ...lowCategoryAlerts,
      ...lowQuestionAlerts,
      ...lowDayAlerts
    ].slice(0, 6);

    if (keyImprovementAreas.length === 0) {
      keyImprovementAreas.push('Maintain current training quality and continue collecting detailed learner feedback for continuous improvement.');
    }

    const positivePercent = totalDayRatings > 0
      ? Math.round((dayRatings.filter((rating) => rating.rating >= 4).length / totalDayRatings) * 100)
      : 0;

    res.json({
      courseId: course._id,
      title: course.title,
      description: course.description || '',
      courseCode: course.courseCode || '',
      teacher: course.teacher ? {
        name: course.teacher.name,
        email: course.teacher.email,
        department: course.teacher.department || ''
      } : null,
      totalDays: course.totalDays,
      totalStudents: enrollments.length,
      totalEvaluations: evaluations.length,
      startDate: course.startDate,
      endDate: course.endDate,
      status: course.status,
      daysData,
      aiAnalysis: {
        totalFeedbacks: totalDayRatings,
        averageDayRating: overallDayRating,
        averageQuestionRating: overallQuestionRating,
        positivePercent,
        questionPerformance,
        categoryPerformance,
        lowerRatedQuestions,
        keyImprovementAreas
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
