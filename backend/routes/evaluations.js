const express = require('express');
const router = express.Router();
const { auth, isStudent, isTeacher } = require('../middleware/auth');
const Evaluation = require('../models/Evaluation');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { getStudentCourseAttendancePercent } = require('../utils/attendanceRules');
const { getPendingDayReviews } = require('../utils/pendingDayReviews');

// Evaluation questions data
const evaluationQuestions = [
  { key: 'q1', text: 'How clearly were the objectives of the training program explained?', options: ['Very Clear', 'Clear', 'Neutral', 'Unclear', 'Very Unclear'] },
  { key: 'q2', text: 'How well was the program structured?', options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'] },
  { key: 'q3', text: 'Was the duration of the program appropriate?', options: ['Too Long', 'Slightly Long', 'Appropriate', 'Slightly Short', 'Too Short'] },
  { key: 'q4', text: 'How relevant was the course content to your needs?', options: ['Very Relevant', 'Relevant', 'Neutral', 'Less Relevant', 'Not Relevant'] },
  { key: 'q5', text: 'How would you rate the quality of learning materials?', options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'] },
  { key: 'q6', text: 'How understandable was the content delivered?', options: ['Very Easy to Understand', 'Easy to Understand', 'Neutral', 'Difficult', 'Very Difficult'] },
  { key: 'q7', text: 'How knowledgeable was the trainer?', options: ['Highly Knowledgeable', 'Knowledgeable', 'Neutral', 'Less Knowledgeable', 'Not Knowledgeable'] },
  { key: 'q8', text: "How effective was the trainer's explanation style?", options: ['Very Effective', 'Effective', 'Neutral', 'Ineffective', 'Very Ineffective'] },
  { key: 'q9', text: 'How well did the trainer encourage interaction?', options: ['Very Well', 'Well', 'Neutral', 'Poorly', 'Very Poorly'] },
  { key: 'q10', text: 'How engaging were the sessions?', options: ['Highly Engaging', 'Engaging', 'Neutral', 'Less Engaging', 'Not Engaging'] },
  { key: 'q11', text: 'Did activities or discussions help your understanding?', options: ['Very Helpful', 'Helpful', 'Neutral', 'Less Helpful', 'Not Helpful'] },
  { key: 'q12', text: 'How motivated were you to attend all sessions?', options: ['Highly Motivated', 'Motivated', 'Neutral', 'Less Motivated', 'Not Motivated'] },
  { key: 'q13', text: 'How much knowledge or skill did you gain?', options: ['A Lot', 'Good Amount', 'Moderate', 'Little', 'None'] },
  { key: 'q14', text: 'How confident do you feel after completing the program?', options: ['Very Confident', 'Confident', 'Neutral', 'Less Confident', 'Not Confident'] },
  { key: 'q15', text: 'How useful is this program for your future goals?', options: ['Very Useful', 'Useful', 'Neutral', 'Less Useful', 'Not Useful'] },
  { key: 'q16', text: 'What best describes your attendance?', options: ['Attended All Sessions', 'Missed 1–2 Sessions', 'Missed Several Sessions', 'Attended Few Sessions', 'Rarely Attended'] },
  { key: 'q17', text: 'What was the main reason for missing any sessions?', options: ['No Sessions Missed', 'Timing Issues', 'Academic Workload', 'Personal Reasons', 'Technical Issues'] },
  { key: 'q18', text: 'How convenient was the session schedule?', options: ['Very Convenient', 'Convenient', 'Neutral', 'Inconvenient', 'Very Inconvenient'] },
  { key: 'q19', text: 'Overall, how satisfied are you with the program?', options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
  { key: 'q20', text: 'Would you recommend this program to others?', options: ['Definitely Yes', 'Probably Yes', 'Not Sure', 'Probably No', 'Definitely No'] }
];

// GET all evaluation questions
router.get('/questions', (req, res) => {
  res.json({
    totalQuestions: evaluationQuestions.length,
    questions: evaluationQuestions
  });
});

// GET all courses (public - no auth required)
router.get('/public/courses', async (req, res) => {
  try {
    const courses = await Course.find({ status: { $in: ['active', 'completed'] } })
      .select('title courseCode description status totalDays createdAt')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });
    
    // Get evaluation count for each course
    const coursesWithEvalCount = await Promise.all(
      courses.map(async (course) => {
        const evalCount = await Evaluation.countDocuments({ course: course._id });
        return {
          ...course.toObject(),
          evaluationCount: evalCount
        };
      })
    );
    
    res.json(coursesWithEvalCount);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit overall MCQ evaluation (student) - only after course completed
router.post('/', auth, isStudent, async (req, res) => {
  try {
    const { courseId, answers } = req.body; // answers should be object q1..q20

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Check if all course days are completed (current schema: course.days).
    // Keep legacy fallback for older documents that still use course.sections.
    const courseDays = Array.isArray(course.days) ? course.days : [];
    const totalDays = course.totalDays || courseDays.length;

    let completedDays = 0;
    if (courseDays.length > 0) {
      completedDays = courseDays.filter((d) => d.completed === true).length;
    } else {
      const legacySections = Array.isArray(course.sections) ? course.sections : [];
      completedDays = legacySections.filter((s) => s.completed === true).length;
    }

    const isCourseCompleted = totalDays > 0 && completedDays >= totalDays;

    // Also check if course status is 'completed' (for backwards compatibility)
    if (!isCourseCompleted && course.status !== 'completed') {
      return res.status(400).json({ message: 'Course is not completed yet' });
    }

    // Ensure student enrolled (check both approved and any enrollment)
    let enrollment = await Enrollment.findOne({ student: req.user.userId, course: courseId, status: 'approved' });
    if (!enrollment) {
      enrollment = await Enrollment.findOne({ student: req.user.userId, course: courseId });
    }
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

    const { percentage: attendancePct } = await getStudentCourseAttendancePercent(
      req.user.userId,
      course
    );
    if (attendancePct < 75) {
      return res.status(403).json({
        message: 'Overall feedback requires at least 75% attendance for this course'
      });
    }

    const pendingDayFeedback = await getPendingDayReviews(req.user.userId, courseId, course);
    if (pendingDayFeedback.length > 0) {
      return res.status(400).json({
        message:
          'Please submit daily feedback for all completed training days you attended before overall feedback',
        pendingReviews: pendingDayFeedback
      });
    }

    // Prevent duplicate submission
    const existing = await Evaluation.findOne({ student: req.user.userId, course: courseId });
    if (existing) return res.status(400).json({ message: 'Evaluation already submitted' });

    // Basic validation: expect answers to have keys q1..q20
    for (let i = 1; i <= 20; i++) {
      if (!("q" + i in answers)) {
        return res.status(400).json({ message: `Missing answer for q${i}` });
      }
    }

    const ev = new Evaluation({ student: req.user.userId, course: courseId, answers });
    await ev.save();
    res.status(201).json(ev);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's own evaluation for a course
router.get('/my-evaluation', auth, isStudent, async (req, res) => {
  try {
    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ message: 'courseId is required' });

    const evaluation = await Evaluation.findOne({ 
      student: req.user.userId, 
      course: courseId 
    }).populate('course', 'title courseCode');
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher fetches all evaluations for a course
router.get('/course/:courseId', auth, isTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.teacher.toString() !== req.user.userId) return res.status(403).json({ message: 'Not authorized' });

    const evaluations = await Evaluation.find({ course: courseId }).populate('student', 'name email');
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET evaluation CSV data for a specific course (public endpoint for viewing)
router.get('/export/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId).select('title courseCode');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const evaluations = await Evaluation.find({ course: courseId });
    
    // Transform to CSV-like format with Q1-Q20 columns
    const csvData = evaluations.map(ev => {
      const row = {};
      for (let i = 1; i <= 20; i++) {
        row[`Q${i}`] = ev.answers?.[`q${i}`] || '';
      }
      return row;
    });

    res.json({
      course: {
        id: course._id,
        title: course.title,
        courseCode: course.courseCode
      },
      totalResponses: csvData.length,
      columns: Array.from({ length: 20 }, (_, i) => `Q${i + 1}`),
      data: csvData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
