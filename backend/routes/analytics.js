const express = require('express');
const router = express.Router();
const { auth, isTeacher, isStudent } = require('../middleware/auth');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');

// Get dashboard analytics (teacher)
router.get('/dashboard', auth, isTeacher, async (req, res) => {
  try {
    const teacherId = req.user.userId;

    // Get all courses
    const courses = await Course.find({ teacher: teacherId });
    const courseIds = courses.map(c => c._id);

    // Get enrollments
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });
    const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
    const pendingEnrollments = enrollments.filter(e => e.status === 'pending');

    // Get attendance data
    const attendanceRecords = await Attendance.find({ 
      course: { $in: courseIds } 
    });

    // Calculate metrics
    const totalCourses = courses.length;
    const activeCourses = courses.filter(c => c.status === 'active').length;
    const totalStudents = new Set(approvedEnrollments.map(e => e.student.toString())).size;
    const pendingRequests = pendingEnrollments.length;

    // Calculate average attendance
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const totalAttendanceRecords = attendanceRecords.length;
    const avgAttendance = totalAttendanceRecords > 0 
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0;

    // Calculate completion rate based on day-to-day evaluation completion
    // This is calculated as: (total completed days / total days) * 100
    let totalDays = 0;
    let completedDays = 0;
    
    courses.forEach(course => {
      if (course.sections && course.sections.length > 0) {
        totalDays += course.sections.length;
        completedDays += course.sections.filter(s => s.completed).length;
      }
    });
    
    const completionRate = totalDays > 0 
      ? Math.round((completedDays / totalDays) * 100)
      : 0;

    // Get active courses list
    const activeCoursesData = courses
      .filter(c => c.status === 'active')
      .map(c => ({
        _id: c._id,
        title: c.title,
        courseCode: c.courseCode,
        totalDays: c.totalDays,
        completedDays: c.sections ? c.sections.filter(s => s.completed).length : 0,
        enrolledCount: approvedEnrollments.filter(e => e.course.toString() === c._id.toString()).length
      }));

    res.json({
      totalCourses,
      activeCourses,
      totalStudents,
      pendingRequests,
      avgAttendance,
      completionRate,
      totalDays,
      completedDays,
      activeCoursesData,
      courses: courses.map(c => {
        const courseCompletedDays = c.sections ? c.sections.filter(s => s.completed).length : 0;
        const courseTotalDays = c.sections ? c.sections.length : 0;
        return {
          ...c.toObject(),
          enrolledCount: approvedEnrollments.filter(e => e.course.toString() === c._id.toString()).length,
          pendingCount: pendingEnrollments.filter(e => e.course.toString() === c._id.toString()).length,
          completedDays: courseCompletedDays,
          dayCompletionRate: courseTotalDays > 0 ? Math.round((courseCompletedDays / courseTotalDays) * 100) : 0
        };
      })
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student dashboard analytics
router.get('/student-dashboard', auth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.userId;

    const enrollments = await Enrollment.find({ student: studentId })
      .populate('course', 'title courseCode totalDays status');

    const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
    const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
    const approvedWithCourse = approvedEnrollments.filter(e => e.course);
    const pendingWithCourse = pendingEnrollments.filter(e => e.course);

    const totalEnrolled = approvedWithCourse.length;
    const inProgress = approvedWithCourse.filter(e => 
      e.course.status === 'active' && e.progress < 100
    ).length;
    const completed = approvedWithCourse.filter(e => e.progress === 100).length;

    // Calculate overall attendance
    const courseIds = approvedWithCourse.map(e => e.course._id).filter(Boolean);
    const attendanceRecords = await Attendance.find({ 
      student: studentId, 
      course: { $in: courseIds } 
    });

    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
    const totalDays = approvedWithCourse.reduce((sum, e) => sum + (e.course?.totalDays || 0), 0);
    const overallAttendance = totalDays > 0 
      ? Math.round((presentCount / totalDays) * 100)
      : 0;

    res.json({
      totalEnrolled,
      inProgress,
      completed,
      overallAttendance,
      pendingApprovals: pendingWithCourse.length,
      pendingCourses: pendingWithCourse.map(e => ({
        course: e.course,
        progress: e.progress,
        daysCompleted: e.daysCompleted,
        enrollment: e
      })),
      courses: approvedWithCourse.map(e => ({
        course: e.course,
        progress: e.progress,
        daysCompleted: e.daysCompleted,
        enrollment: e
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Program effectiveness analytics
router.get('/effectiveness', auth, isTeacher, async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const courses = await Course.find({ teacher: teacherId });
    const courseIds = courses.map(c => c._id);

    const enrollments = await Enrollment.find({ 
      course: { $in: courseIds }, 
      status: 'approved' 
    });

    const feedbacks = await Feedback.find({ course: { $in: courseIds } });

    const courseStats = courses.map(course => {
      const courseEnrollments = enrollments.filter(e => 
        e.course.toString() === course._id.toString()
      );
      const courseFeedbacks = feedbacks.filter(f => 
        f.course.toString() === course._id.toString()
      );

      // Calculate completion rate based on day-to-day completion
      const completedDays = course.sections ? course.sections.filter(s => s.completed).length : 0;
      const totalDays = course.sections ? course.sections.length : 0;
      const completionRate = totalDays > 0
        ? Math.round((completedDays / totalDays) * 100)
        : 0;

      return {
        course,
        studentCount: courseEnrollments.length,
        completionRate,
        completedDays,
        totalDays,
        averageRating: 4.5, // Placeholder
        engagementScore: 85, // Placeholder
        feedbackCount: courseFeedbacks.length
      };
    });

    res.json(courseStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Program distribution analytics
router.get('/distribution', auth, isTeacher, async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const courses = await Course.find({ teacher: teacherId });
    const courseIds = courses.map(c => c._id);

    const enrollments = await Enrollment.find({ 
      course: { $in: courseIds }, 
      status: 'approved' 
    });

    const distribution = courses.map(course => {
      const count = enrollments.filter(e => 
        e.course.toString() === course._id.toString()
      ).length;
      return {
        courseName: course.title,
        enrollmentCount: count
      };
    });

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Attendance summary
router.get('/attendance-summary', auth, isTeacher, async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const courses = await Course.find({ teacher: teacherId });
    const courseIds = courses.map(c => c._id);

    const attendanceRecords = await Attendance.find({ 
      course: { $in: courseIds } 
    });

    const courseAttendance = courses.map(course => {
      const records = attendanceRecords.filter(a => 
        a.course.toString() === course._id.toString()
      );
      const present = records.filter(a => a.status === 'present').length;
      const total = records.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        courseName: course.title,
        present,
        absent: total - present,
        total,
        percentage
      };
    });

    const overallPresent = attendanceRecords.filter(a => a.status === 'present').length;
    const overallTotal = attendanceRecords.length;
    const overallPercentage = overallTotal > 0 
      ? Math.round((overallPresent / overallTotal) * 100)
      : 0;

    res.json({
      overall: {
        present: overallPresent,
        absent: overallTotal - overallPresent,
        total: overallTotal,
        percentage: overallPercentage
      },
      byCourse: courseAttendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// SECRET ROUTE: Get comprehensive feedback data for all courses
router.get('/comprehensive-feedback', async (req, res) => {
  try {
    const Evaluation = require('../models/Evaluation');
    const CourseSurvey = require('../models/CourseSurvey');
    const DayRating = require('../models/DayRating');
    const User = require('../models/User');

    // Get all courses with teacher info
    const courses = await Course.find()
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    // Get all evaluations
    const evaluations = await Evaluation.find()
      .populate('student', 'name email')
      .populate('course', 'title courseCode')
      .sort({ createdAt: -1 });

    // Get all course surveys
    const surveys = await CourseSurvey.find()
      .populate('student', 'name email')
      .populate('course', 'title courseCode')
      .sort({ createdAt: -1 });

    // Get all day ratings
    const dayRatings = await DayRating.find()
      .populate('student', 'name email')
      .populate('course', 'title courseCode')
      .sort({ createdAt: -1 });

    // Get enrollments for statistics
    const enrollments = await Enrollment.find()
      .populate('student', 'name email')
      .populate('course', 'title');

    // Organize data by course
    const courseData = courses.map(course => {
      const courseEvaluations = evaluations.filter(e => 
        e.course && e.course._id.toString() === course._id.toString()
      );
      
      const courseSurveys = surveys.filter(s => 
        s.course && s.course._id.toString() === course._id.toString()
      );
      
      const courseDayRatings = dayRatings.filter(d => 
        d.course && d.course._id.toString() === course._id.toString()
      );

      const courseEnrollments = enrollments.filter(e => 
        e.course && e.course._id.toString() === course._id.toString()
      );

      // Calculate evaluation statistics
      const evaluationStats = courseEvaluations.length > 0 ? {
        totalResponses: courseEvaluations.length,
        averageScores: calculateAverageEvaluationScores(courseEvaluations)
      } : null;

      // Calculate survey statistics
      const surveyStats = courseSurveys.length > 0 ? {
        totalResponses: courseSurveys.length,
        averageRatings: calculateAverageSurveyRatings(courseSurveys)
      } : null;

      // Calculate day rating statistics
      const dayRatingStats = courseDayRatings.length > 0 ? {
        totalRatings: courseDayRatings.length,
        averageRating: (courseDayRatings.reduce((sum, d) => sum + d.rating, 0) / courseDayRatings.length).toFixed(2)
      } : null;

      return {
        _id: course._id,
        title: course.title,
        courseCode: course.courseCode,
        teacher: course.teacher,
        status: course.status,
        totalDays: course.sections?.length || 0,
        enrolledStudents: courseEnrollments.filter(e => e.status === 'approved').length,
        evaluations: courseEvaluations,
        surveys: courseSurveys,
        dayRatings: courseDayRatings,
        evaluationStats,
        surveyStats,
        dayRatingStats,
        createdAt: course.createdAt
      };
    });

    // Overall statistics
    const stats = {
      totalCourses: courses.length,
      totalEvaluations: evaluations.length,
      totalSurveys: surveys.length,
      totalDayRatings: dayRatings.length,
      totalEnrollments: enrollments.filter(e => e.status === 'approved').length
    };

    res.json({
      stats,
      courses: courseData,
      allEvaluations: evaluations,
      allSurveys: surveys,
      allDayRatings: dayRatings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate average evaluation scores
function calculateAverageEvaluationScores(evaluations) {
  const questions = [
    'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10',
    'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20'
  ];

  const questionLabels = {
    q1: 'Course Clarity',
    q2: 'Content Quality',
    q3: 'Appropriateness',
    q4: 'Relevance',
    q5: 'Excellence',
    q6: 'Understanding',
    q7: 'Knowledge Level',
    q8: 'Effectiveness',
    q9: 'Outcomes',
    q10: 'Engagement',
    q11: 'Helpfulness',
    q12: 'Motivation',
    q13: 'Content Amount',
    q14: 'Confidence',
    q15: 'Usefulness',
    q16: 'Attendance',
    q17: 'Session Completion',
    q18: 'Convenience',
    q19: 'Satisfaction',
    q20: 'Recommendation'
  };

  const scores = {};
  questions.forEach(q => {
    const values = evaluations
      .map(e => {
        const answer = e.answers[q];
        // Convert text answers to numeric values
        const scoreMap = {
          'Clear': 5, 'Good': 4, 'Appropriate': 3, 'Relevant': 4, 'Excellent': 5,
          'Very Easy to Understand': 5, 'Highly Knowledgeable': 5, 'Effective': 4,
          'Very Well': 5, 'Engaging': 4, 'Helpful': 4, 'Motivated': 4,
          'Good Amount': 4, 'Confident': 4, 'Very Useful': 5, 'Attended All Sessions': 5,
          'No Sessions Missed': 5, 'Very Convenient': 5, 'Very Satisfied': 5,
          'Probably No': 1, 'Maybe': 3, 'Definitely Yes': 5
        };
        return scoreMap[answer] || 3;
      })
      .filter(v => v !== undefined);
    
    scores[q] = values.length > 0 
      ? { 
          label: questionLabels[q],
          average: (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2),
          responses: values.length
        }
      : null;
  });

  return scores;
}

// Helper function to calculate average survey ratings
function calculateAverageSurveyRatings(surveys) {
  const ratingFields = [
    'overallSatisfaction',
    'contentQuality',
    'teachingEffectiveness',
    'courseMaterialQuality',
    'practicalApplication'
  ];

  const ratings = {};
  ratingFields.forEach(field => {
    const values = surveys.map(s => s[field]).filter(v => v !== undefined && v !== null);
    ratings[field] = values.length > 0
      ? (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2)
      : 0;
  });

  return ratings;
}

// Seed test evaluation data
router.post('/seed-test-evaluations', async (req, res) => {
  try {
    const Evaluation = require('../models/Evaluation');
    const User = require('../models/User');
    const Course = require('../models/Course');
    
    // Get all courses and students
    const courses = await Course.find();
    const students = await User.find({ role: 'student' });
    
    if (courses.length === 0 || students.length === 0) {
      return res.status(400).json({ message: 'No courses or students found' });
    }
    
    const answerOptions = {
      q1: ['Clear', 'Somewhat Clear', 'Unclear'],
      q2: ['Good', 'Average', 'Poor'],
      q3: ['Appropriate', 'Somewhat Appropriate', 'Not Appropriate'],
      q4: ['Relevant', 'Somewhat Relevant', 'Not Relevant'],
      q5: ['Excellent', 'Good', 'Average'],
      q6: ['Very Easy to Understand', 'Easy', 'Difficult'],
      q7: ['Highly Knowledgeable', 'Knowledgeable', 'Average'],
      q8: ['Effective', 'Somewhat Effective', 'Not Effective'],
      q9: ['Very Well', 'Well', 'Average'],
      q10: ['Engaging', 'Somewhat Engaging', 'Boring'],
      q11: ['Helpful', 'Somewhat Helpful', 'Not Helpful'],
      q12: ['Motivated', 'Somewhat Motivated', 'Not Motivated'],
      q13: ['Good Amount', 'Too Much', 'Too Little'],
      q14: ['Confident', 'Somewhat Confident', 'Not Confident'],
      q15: ['Very Useful', 'Useful', 'Not Useful'],
      q16: ['Attended All Sessions', 'Missed Few', 'Missed Many'],
      q17: ['No Sessions Missed', 'Missed Few', 'Missed Many'],
      q18: ['Very Convenient', 'Convenient', 'Inconvenient'],
      q19: ['Very Satisfied', 'Satisfied', 'Not Satisfied'],
      q20: ['Definitely Yes', 'Maybe', 'Probably No']
    };
    
    const testNames = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Ross', 'Edward King', 'Fiona Apple', 'George Miller', 'Hannah Montana'];
    
    let createdCount = 0;
    
    for (const course of courses) {
      // Create 3-5 random evaluations per course
      const numEvaluations = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numEvaluations; i++) {
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        
        const answers = {};
        for (let q = 1; q <= 20; q++) {
          const key = `q${q}`;
          const options = answerOptions[key];
          answers[key] = options[Math.floor(Math.random() * options.length)];
        }
        
        // Check if evaluation already exists
        const existingEval = await Evaluation.findOne({
          student: randomStudent._id,
          course: course._id
        });
        
        if (!existingEval) {
          await Evaluation.create({
            student: randomStudent._id,
            course: course._id,
            answers,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          });
          createdCount++;
        }
      }
    }
    
    res.json({ message: `Created ${createdCount} test evaluations` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

