const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const CourseSurvey = require('../models/CourseSurvey');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Evaluation = require('../models/Evaluation');
const { getStudentCourseAttendancePercent } = require('../utils/attendanceRules');
const { getNormalizedCourseDays } = require('../utils/courseSchedule');
const { getPendingDayReviews } = require('../utils/pendingDayReviews');

// Check certificate eligibility for a course
router.get('/eligibility/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    // Support both 'userId' and 'id' from token
    const studentId = req.user.userId || req.user.id;

    // Get course details
    const course = await Course.findById(courseId).populate('teacher', 'name');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check enrollment - accept both 'approved' status or any enrollment with progress
    let enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: 'approved'
    });

    // If not found with 'approved', check for any enrollment (some systems may not use status)
    if (!enrollment) {
      enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId
      });
    }

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    // Use course.days as primary source (current schema), fallback to legacy sections.
    const courseDays = getNormalizedCourseDays(course);
    const totalScheduledDays = course.totalDays || courseDays.length;
    const completedDaysList = courseDays.filter((d) => d.completed === true);
    const completedDays = completedDaysList.length;
    const isCourseCompleted = totalScheduledDays > 0 && completedDays >= totalScheduledDays;

    const {
      scheduledDays: attendanceScheduledDays,
      presentDays: attendedScheduledDays,
      percentage: scheduleAttendancePct
    } = await getStudentCourseAttendancePercent(studentId, course);

    // Same formula as My Attendance & evaluation (present ÷ scheduled course days)
    const attendancePercentage = scheduleAttendancePct;
    const attendedDays = attendedScheduledDays;

    const meetsAttendanceRequirement = attendancePercentage >= 50;
    const meetsEvaluationAttendanceRequirement = attendancePercentage >= 75;

    // Check for pending reviews (day ratings only, not evaluation)
    const pendingReviews = await getPendingDayReviews(studentId, courseId, course);

    // Check if survey already submitted
    const existingSurvey = await CourseSurvey.findOne({
      student: studentId,
      course: courseId
    });

    // Check if overall course evaluation submitted (also counts as survey)
    const existingEvaluation = await Evaluation.findOne({
      student: studentId,
      course: courseId
    });

    // Either survey OR evaluation is sufficient
    const surveyOrEvalCompleted = !!existingSurvey || !!existingEvaluation;

    // Check if certificate already issued
    const existingCertificate = await Certificate.findOne({
      student: studentId,
      course: courseId
    });

    const eligibility = {
      courseId,
      courseName: course.title || course.name,
      teacherName: course.teacher?.name || 'Unknown',
      isCourseCompleted,
      totalDays: totalScheduledDays,
      completedDays,
      attendanceScheduledDays,
      attendedDays,
      attendancePercentage,
      meetsAttendanceRequirement,
      meetsEvaluationAttendanceRequirement,
      pendingReviews,
      hasPendingReviews: pendingReviews.length > 0,
      surveySubmitted: surveyOrEvalCompleted,
      evaluationSubmitted: !!existingEvaluation,
      certificateIssued: !!existingCertificate,
      certificateNumber: existingCertificate?.certificateNumber || null,
      canDownloadCertificate: isCourseCompleted && 
                              meetsEvaluationAttendanceRequirement &&
                              pendingReviews.length === 0 && 
                              surveyOrEvalCompleted
    };

    res.json(eligibility);
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit course completion survey
router.post('/survey/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.userId || req.user.id;
    const {
      overallSatisfaction,
      contentQuality,
      teachingEffectiveness,
      courseMaterialQuality,
      practicalApplication,
      difficultyLevel,
      whatYouLearned,
      improvements,
      recommendToOthers,
      additionalComments
    } = req.body;

    // Validate required fields
    if (!overallSatisfaction || !contentQuality || !teachingEffectiveness ||
        !courseMaterialQuality || !practicalApplication || !difficultyLevel ||
        !whatYouLearned || !improvements || recommendToOthers === undefined) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Check if survey already exists
    const existingSurvey = await CourseSurvey.findOne({
      student: studentId,
      course: courseId
    });

    if (existingSurvey) {
      return res.status(400).json({ message: 'Survey already submitted for this course' });
    }

    // Get course and teacher info
    const course = await Course.findById(courseId).populate('teacher', 'name');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const {
      scheduledDays: totalDays,
      presentDays: attendedDays,
      percentage: attendancePercentage
    } = await getStudentCourseAttendancePercent(studentId, course);

    if (attendancePercentage < 75) {
      return res.status(403).json({
        message: 'Survey submission requires at least 75% attendance for this course'
      });
    }

    const dayFeedbackPending = await getPendingDayReviews(studentId, courseId, course);
    if (dayFeedbackPending.length > 0) {
      return res.status(400).json({
        message:
          'Please submit daily feedback for all completed training days you attended before overall feedback',
        pendingReviews: dayFeedbackPending
      });
    }

    // Create survey
    const survey = new CourseSurvey({
      student: studentId,
      course: courseId,
      teacher: course.teacher._id,
      overallSatisfaction,
      contentQuality,
      teachingEffectiveness,
      courseMaterialQuality,
      practicalApplication,
      difficultyLevel,
      whatYouLearned,
      improvements,
      recommendToOthers,
      additionalComments: additionalComments || '',
      courseStats: {
        totalDays,
        attendedDays,
        attendancePercentage,
        completionDate: new Date()
      }
    });

    await survey.save();

    res.status(201).json({
      message: 'Survey submitted successfully',
      survey
    });
  } catch (error) {
    console.error('Error submitting survey:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate and download certificate
router.post('/generate/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.userId || req.user.id;

    // Re-verify eligibility
    const course = await Course.findById(courseId).populate('teacher', 'name');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check enrollment - accept any enrollment
    let enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: 'approved'
    });

    if (!enrollment) {
      enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId
      });
    }

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    // Check completion from current course.days with legacy fallback.
    const courseDays = getNormalizedCourseDays(course);
    const totalDays = course.totalDays || courseDays.length;
    const completedDaysList = courseDays.filter((d) => d.completed === true);
    const completedDays = completedDaysList.length;
    
    if (totalDays <= 0 || completedDays < totalDays) {
      return res.status(400).json({ message: 'Course is not yet completed' });
    }

    const { presentDays: genPresentDays, percentage: genAttendancePct, scheduledDays: genScheduled } =
      await getStudentCourseAttendancePercent(studentId, course);

    if (genAttendancePct < 75) {
      return res.status(400).json({
        message:
          'Attendance requirement not met. At least 75% attendance is required to receive a certificate.'
      });
    }

    // Check pending reviews
    const pendingReviews = await getPendingDayReviews(studentId, courseId, course);
    if (pendingReviews.length > 0) {
      return res.status(400).json({ 
        message: 'Please complete all pending reviews before downloading certificate',
        pendingReviews 
      });
    }

    // Check if survey OR evaluation submitted (either one is valid)
    const survey = await CourseSurvey.findOne({
      student: studentId,
      course: courseId
    });

    const evaluation = await Evaluation.findOne({
      student: studentId,
      course: courseId
    });

    if (!survey && !evaluation) {
      return res.status(400).json({ 
        message: 'Please complete the course evaluation first' 
      });
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({
      student: studentId,
      course: courseId
    });

    const User = require('../models/User');
    const student = await User.findById(studentId);

    if (!certificate) {
      // Generate new certificate
      certificate = new Certificate({
        student: studentId,
        course: courseId,
        teacher: course.teacher._id,
        certificateNumber: Certificate.generateCertificateNumber(),
        studentName: student.name,
        courseName: course.title || course.name,
        teacherName: course.teacher.name,
        completionStats: {
          totalDays: genScheduled || completedDays,
          attendedDays: genPresentDays,
          attendancePercentage: genAttendancePct,
          courseStartDate: courseDays[0]?.date,
          courseEndDate: courseDays[courseDays.length - 1]?.date
        },
        verificationCode: Certificate.generateVerificationCode()
      });

      await certificate.save();

      // Update survey with certificate info if exists
      if (survey) {
        survey.certificateIssued = true;
        survey.certificateIssuedAt = new Date();
        survey.certificateNumber = certificate.certificateNumber;
        await survey.save();
      }
    }

    // Update download count
    certificate.downloadCount += 1;
    certificate.lastDownloadedAt = new Date();
    await certificate.save();

    res.json({
      message: 'Certificate generated successfully',
      certificate: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        teacherName: certificate.teacherName,
        completionStats: certificate.completionStats,
        issuedAt: certificate.issuedAt,
        verificationCode: certificate.verificationCode
      }
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify certificate
// Verify certificate with verification code
router.post('/verify', async (req, res) => {
  try {
    const { certificateNumber, verificationCode } = req.body;

    if (!certificateNumber || !verificationCode) {
      return res.status(400).json({
        valid: false,
        message: 'Certificate number and verification code are required'
      });
    }

    const certificate = await Certificate.findOne({
      certificateNumber,
      verificationCode
    })
      .populate('student', 'name email')
      .populate('course', 'name')
      .populate('teacher', 'name');

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid certificate number or verification code'
      });
    }

    if (!certificate.isValid) {
      return res.status(400).json({
        valid: false,
        message: 'This certificate has been invalidated'
      });
    }

    res.json({
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        teacherName: certificate.teacherName,
        issuedAt: certificate.issuedAt,
        verificationCode: certificate.verificationCode,
        completionStats: certificate.completionStats,
        downloadCount: certificate.downloadCount,
        lastDownloadedAt: certificate.lastDownloadedAt
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all certificates for a student
router.get('/my-certificates', auth, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const certificates = await Certificate.find({ student: studentId })
      .populate('course', 'name')
      .populate('teacher', 'name')
      .sort({ issuedAt: -1 });

    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course survey analytics (for teachers)
router.get('/survey-analytics/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Verify teacher owns this course
    const teacherId = req.user.userId || req.user.id;
    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const analytics = await CourseSurvey.getCourseAnalytics(courseId);
    
    // Get all surveys for detailed view
    const surveys = await CourseSurvey.find({ course: courseId })
      .populate('student', 'name')
      .select('-__v')
      .sort({ createdAt: -1 });

    // Get difficulty distribution
    const difficultyDistribution = await CourseSurvey.aggregate([
      { $match: { course: course._id } },
      { $group: { _id: '$difficultyLevel', count: { $sum: 1 } } }
    ]);

    res.json({
      analytics,
      surveys,
      difficultyDistribution
    });
  } catch (error) {
    console.error('Error fetching survey analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all survey analytics for teacher
router.get('/teacher-analytics', auth, async (req, res) => {
  try {
    const teacherId = req.user.userId || req.user.id;
    const analytics = await CourseSurvey.getTeacherAnalytics(teacherId);
    
    // Get course-wise breakdown
    const courseBreakdown = await CourseSurvey.aggregate([
      { $match: { teacher: req.user._id } },
      {
        $group: {
          _id: '$course',
          surveyCount: { $sum: 1 },
          avgSatisfaction: { $avg: '$overallSatisfaction' },
          recommendCount: { $sum: { $cond: ['$recommendToOthers', 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      {
        $project: {
          courseName: '$courseInfo.name',
          surveyCount: 1,
          avgSatisfaction: 1,
          recommendCount: 1,
          recommendPercentage: {
            $multiply: [{ $divide: ['$recommendCount', '$surveyCount'] }, 100]
          }
        }
      }
    ]);

    res.json({
      analytics,
      courseBreakdown
    });
  } catch (error) {
    console.error('Error fetching teacher analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
