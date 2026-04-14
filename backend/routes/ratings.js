const express = require('express');
const router = express.Router();
const { auth, isStudent, isTeacher } = require('../middleware/auth');
const DayRating = require('../models/DayRating');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { wasAbsentOnDay } = require('../utils/attendanceRules');

// Student submits a rating for a completed day
router.post('/day', auth, isStudent, async (req, res) => {
  try {
    const { courseId, dayNumber, rating, comment } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Ensure day exists and is marked completed by teacher.
    // Primary source is course.days (current schema); keep sections as legacy fallback.
    const dayNum = parseInt(dayNumber, 10);
    const completedDay = Array.isArray(course.days)
      ? course.days.find((d) => Number(d.dayNumber) === dayNum)
      : null;

    const legacySection = Array.isArray(course.sections)
      ? course.sections[dayNum - 1]
      : null;

    const isDayCompleted = Boolean((completedDay && completedDay.completed) || (legacySection && legacySection.completed));

    if (!isDayCompleted) {
      return res.status(400).json({ message: 'Day not marked completed by teacher' });
    }

    // Ensure student is enrolled - check with approved status first, then any enrollment
    let enrollment = await Enrollment.findOne({
      student: req.user.userId,
      course: courseId,
      status: 'approved'
    });
    
    if (!enrollment) {
      enrollment = await Enrollment.findOne({
        student: req.user.userId,
        course: courseId
      });
    }
    
    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    if (await wasAbsentOnDay(req.user.userId, courseId, dayNum)) {
      return res.status(403).json({
        message: 'You cannot submit daily feedback for a day you were marked absent'
      });
    }

    // Enforce one feedback per student/day/course and overwrite on resubmission.
    const dr = await DayRating.findOneAndUpdate(
      {
        student: req.user.userId,
        course: courseId,
        dayNumber: dayNum
      },
      {
        $set: {
          rating,
          comment: comment || ''
        },
        $setOnInsert: {
          student: req.user.userId,
          course: courseId,
          dayNumber: dayNum
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    res.status(200).json(dr);
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Feedback already submitted for this day. Please refresh and try again.' });
    }
    console.error('Error saving day rating:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current student's rating for a specific day
router.get('/my', auth, isStudent, async (req, res) => {
  try {
    const { courseId, dayNumber } = req.query;
    const dn = parseInt(dayNumber, 10);
    if (Number.isNaN(dn)) {
      return res.status(400).json({ message: 'Invalid dayNumber' });
    }
    const rating = await DayRating.findOne({
      student: req.user.userId,
      course: courseId,
      dayNumber: dn
    });
    res.json(rating || null);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher can fetch aggregated ratings for a course/day
router.get('/course/:courseId/day/:dayNumber', auth, isTeacher, async (req, res) => {
  try {
    const { courseId, dayNumber } = req.params;
    const ratings = await DayRating.find({ course: courseId, dayNumber }).populate('student', 'name email');
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
