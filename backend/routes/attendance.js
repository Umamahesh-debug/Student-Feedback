const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, isTeacher, isStudent } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const AttendanceDayImage = require('../models/AttendanceDayImage');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { uploadImage } = require('../utils/cloudinary');

// Configure multer for attendance image uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'att_' + Date.now() + '_' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Mark attendance (teacher only)
router.post('/mark', auth, isTeacher, async (req, res) => {
  try {
    const { courseId, dayNumber, attendanceData } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (dayNumber < 1 || dayNumber > course.totalDays) {
      return res.status(400).json({ message: 'Invalid day number' });
    }

    // Get enrolled students
    const enrollments = await Enrollment.find({ 
      course: courseId, 
      status: 'approved' 
    });

    const attendanceRecords = [];

    for (const data of attendanceData) {
      const { studentId, status, notes } = data;

      // Check if enrollment exists
      const enrollment = enrollments.find(e => e.student.toString() === studentId);
      if (!enrollment) {
        continue;
      }

      // Update or create attendance
      const attendance = await Attendance.findOneAndUpdate(
        { student: studentId, course: courseId, dayNumber },
        {
          student: studentId,
          course: courseId,
          dayNumber,
          status,
          notes: notes || '',
          markedBy: req.user.userId
        },
        { upsert: true, new: true }
      );

      attendanceRecords.push(attendance);

      // Update enrollment progress
      const totalAttendance = await Attendance.countDocuments({
        student: studentId,
        course: courseId,
        status: 'present'
      });

      enrollment.daysCompleted = totalAttendance;
      enrollment.progress = Math.round((totalAttendance / course.totalDays) * 100);
      await enrollment.save();
    }

    res.json({ message: 'Attendance marked successfully', attendanceRecords });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance for a specific day
router.get('/course/:courseId/day/:dayNumber', auth, isTeacher, async (req, res) => {
  try {
    const { courseId, dayNumber } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const enrollments = await Enrollment.find({ 
      course: courseId, 
      status: 'approved' 
    }).populate('student', 'name email rollNumber branch section profilePicture');

    const attendance = await Attendance.find({ 
      course: courseId, 
      dayNumber: parseInt(dayNumber) 
    });

    const attendanceMap = {};
    attendance.forEach(a => {
      attendanceMap[a.student.toString()] = a;
    });

    const result = enrollments.map(enrollment => {
      const att = attendanceMap[enrollment.student._id.toString()];
      return {
        student: enrollment.student,
        enrollmentId: enrollment._id,
        attendance: att || null,
        status: att ? att.status : null
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance history (teacher)
router.get('/history', auth, isTeacher, async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;

    const query = { markedBy: req.user.userId };
    if (courseId) query.course = courseId;

    const attendance = await Attendance.find(query)
      .populate('student', 'name email rollNumber')
      .populate('course', 'title courseCode')
      .sort({ markedAt: -1 });

    // Group by course and day
    const grouped = {};
    attendance.forEach(a => {
      const key = `${a.course._id}-${a.dayNumber}`;
      if (!grouped[key]) {
        grouped[key] = {
          course: a.course,
          dayNumber: a.dayNumber,
          date: a.markedAt,
          records: []
        };
      }
      grouped[key].records.push(a);
    });

    const result = Object.values(grouped).map(group => ({
      ...group,
      presentCount: group.records.filter(r => r.status === 'present').length,
      absentCount: group.records.filter(r => r.status === 'absent').length,
      totalCount: group.records.length,
      attendancePercentage: group.records.length > 0 
        ? Math.round((group.records.filter(r => r.status === 'present').length / group.records.length) * 100)
        : 0
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Recalculate progress for all students in a course based on attendance for a given day
router.post('/course/:courseId/day/:dayNumber/complete', auth, isTeacher, async (req, res) => {
  try {
    const { courseId, dayNumber } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Ensure valid day
    const dayNum = parseInt(dayNumber, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > course.totalDays) {
      return res.status(400).json({ message: 'Invalid day number' });
    }

    // Get all approved enrollments for this course
    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'approved'
    });

    // Mark the day as completed on course.days using dayNumber, not array index.
    // This handles cases where days are out of order or missing entries.
    if (!Array.isArray(course.days)) {
      course.days = [];
    }

    let dayIndex = course.days.findIndex((d) => Number(d.dayNumber) === dayNum);
    if (dayIndex === -1) {
      const computedDate = new Date(course.startDate || new Date());
      computedDate.setDate(computedDate.getDate() + (dayNum - 1));

      course.days.push({
        dayNumber: dayNum,
        date: computedDate,
        topics: [],
        completed: false
      });

      dayIndex = course.days.length - 1;
    }

    course.days[dayIndex].completed = true;
    course.days[dayIndex].completedAt = new Date();
    course.days[dayIndex].completedBy = req.user.userId;

    let touchedDay = true;

    // Backward compatibility for any older documents that still contain sections
    if (Array.isArray(course.sections) && course.sections[dayIndex]) {
      course.sections[dayIndex].completed = true;
      course.sections[dayIndex].completedAt = new Date();
      course.sections[dayIndex].completedBy = req.user.userId;
      touchedDay = true;
    }

    if (touchedDay) {
      course.days.sort((a, b) => Number(a.dayNumber) - Number(b.dayNumber));
      await course.save();
    }

    // For each enrollment, recalculate progress based on present attendance records
    for (const enrollment of enrollments) {
      const presentDays = await Attendance.distinct('dayNumber', {
        student: enrollment.student,
        course: courseId,
        status: 'present'
      });

      const daysCompleted = presentDays.length;
      enrollment.daysCompleted = daysCompleted;
      enrollment.progress = course.totalDays > 0
        ? Math.round((daysCompleted / course.totalDays) * 100)
        : 0;

      await enrollment.save();
    }

    res.json({ message: 'Day marked as complete and progress updated for all students' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unmark a day as completed (teacher only)
router.post('/course/:courseId/day/:dayNumber/uncomplete', auth, isTeacher, async (req, res) => {
  try {
    const { courseId, dayNumber } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const dayNum = parseInt(dayNumber, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > course.totalDays) {
      return res.status(400).json({ message: 'Invalid day number' });
    }

    let touchedDay = false;

    if (Array.isArray(course.days)) {
      const dayIndex = course.days.findIndex((d) => Number(d.dayNumber) === dayNum);
      if (dayIndex !== -1) {
        course.days[dayIndex].completed = false;
        course.days[dayIndex].completedAt = null;
        course.days[dayIndex].completedBy = null;
        touchedDay = true;
      }
    }

    const legacyIndex = dayNum - 1;
    if (Array.isArray(course.sections) && course.sections[legacyIndex]) {
      course.sections[legacyIndex].completed = false;
      course.sections[legacyIndex].completedAt = null;
      course.sections[legacyIndex].completedBy = null;
      touchedDay = true;
    }

    if (touchedDay) {
      await course.save();
    }

    res.json({ message: 'Day unmarked as complete' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student attendance (student view)
router.get('/my-attendance', auth, isStudent, async (req, res) => {
  try {
    const { courseId } = req.query;

    const query = { student: req.user.userId };
    if (courseId) query.course = courseId;

    const attendance = await Attendance.find(query)
      .populate('course', 'title courseCode totalDays')
      .sort({ dayNumber: 1 });

    // Calculate statistics
    const courseStats = {};
    attendance.forEach(a => {
      const courseId = a.course._id.toString();
      if (!courseStats[courseId]) {
        courseStats[courseId] = {
          course: a.course,
          totalDays: a.course.totalDays,
          present: 0,
          absent: 0,
          records: []
        };
      }
      courseStats[courseId].records.push(a);
      if (a.status === 'present') courseStats[courseId].present++;
      else courseStats[courseId].absent++;
    });

    const result = Object.values(courseStats).map(stat => ({
      ...stat,
      attendancePercentage: stat.totalDays > 0 
        ? Math.round((stat.present / stat.totalDays) * 100)
        : 0
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload attendance day images (class photo & attendance sheet)
router.post('/day-images/upload', auth, isTeacher, upload.fields([
  { name: 'classImage', maxCount: 1 },
  { name: 'attendanceSheetImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { courseId, dayNumber } = req.body;

    if (!courseId || !dayNumber) {
      return res.status(400).json({ message: 'courseId and dayNumber are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const dayNum = parseInt(dayNumber, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > course.totalDays) {
      return res.status(400).json({ message: 'Invalid day number' });
    }

    // Find existing record or create new one
    let dayImage = await AttendanceDayImage.findOne({ course: courseId, dayNumber: dayNum });
    if (!dayImage) {
      dayImage = new AttendanceDayImage({
        course: courseId,
        dayNumber: dayNum,
        uploadedBy: req.user.userId
      });
    }

    // Upload class image if provided
    if (req.files && req.files.classImage && req.files.classImage[0]) {
      try {
        const classImageUrl = await uploadImage(req.files.classImage[0]);
        dayImage.classImage = classImageUrl;
        // Clean up temp file
        if (fs.existsSync(req.files.classImage[0].path)) {
          fs.unlinkSync(req.files.classImage[0].path);
        }
      } catch (uploadErr) {
        console.error('Class image upload error:', uploadErr);
        if (fs.existsSync(req.files.classImage[0].path)) {
          fs.unlinkSync(req.files.classImage[0].path);
        }
      }
    }

    // Upload attendance sheet image if provided
    if (req.files && req.files.attendanceSheetImage && req.files.attendanceSheetImage[0]) {
      try {
        const sheetImageUrl = await uploadImage(req.files.attendanceSheetImage[0]);
        dayImage.attendanceSheetImage = sheetImageUrl;
        // Clean up temp file
        if (fs.existsSync(req.files.attendanceSheetImage[0].path)) {
          fs.unlinkSync(req.files.attendanceSheetImage[0].path);
        }
      } catch (uploadErr) {
        console.error('Attendance sheet image upload error:', uploadErr);
        if (fs.existsSync(req.files.attendanceSheetImage[0].path)) {
          fs.unlinkSync(req.files.attendanceSheetImage[0].path);
        }
      }
    }

    dayImage.uploadedAt = new Date();
    await dayImage.save();

    res.json({ message: 'Images uploaded successfully', dayImage });
  } catch (error) {
    // Clean up any temp files on error
    if (req.files) {
      Object.values(req.files).forEach(fileArr => {
        fileArr.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance day images for a specific course and day
router.get('/day-images/:courseId/:dayNumber', auth, async (req, res) => {
  try {
    const { courseId, dayNumber } = req.params;

    const dayImage = await AttendanceDayImage.findOne({
      course: courseId,
      dayNumber: parseInt(dayNumber, 10)
    });

    res.json(dayImage || { classImage: '', attendanceSheetImage: '' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all attendance day images for a course
router.get('/day-images/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const dayImages = await AttendanceDayImage.find({ course: courseId }).sort({ dayNumber: 1 });
    res.json(dayImages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get full attendance report data for a course (with images)
router.get('/report/:courseId', auth, isTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate('teacher', 'name email');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all enrollments
    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'approved'
    }).populate('student', 'name email rollNumber branch section');

    // Get all attendance records
    const attendance = await Attendance.find({ course: courseId }).sort({ dayNumber: 1 });

    // Get all day images
    const dayImages = await AttendanceDayImage.find({ course: courseId }).sort({ dayNumber: 1 });

    // Build day-wise data
    const daysData = [];
    for (let day = 1; day <= course.totalDays; day++) {
      const dayAttendance = attendance.filter(a => a.dayNumber === day);
      const dayImage = dayImages.find(di => di.dayNumber === day);

      const students = enrollments.map(enrollment => {
        const att = dayAttendance.find(a => a.student.toString() === enrollment.student._id.toString());
        return {
          studentId: enrollment.student._id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          rollNumber: enrollment.student.rollNumber || '',
          branch: enrollment.student.branch || '',
          section: enrollment.student.section || '',
          status: att ? att.status : 'not-marked',
          notes: att ? att.notes : ''
        };
      });

      daysData.push({
        dayNumber: day,
        sectionTitle: course.sections && course.sections[day - 1] ? course.sections[day - 1].title : `Day ${day}`,
        classImage: dayImage ? dayImage.classImage : '',
        attendanceSheetImage: dayImage ? dayImage.attendanceSheetImage : '',
        students,
        presentCount: students.filter(s => s.status === 'present').length,
        absentCount: students.filter(s => s.status === 'absent').length,
        totalStudents: students.length
      });
    }

    // Build student summary
    const studentSummary = enrollments.map(enrollment => {
      const studentAttendance = attendance.filter(a => a.student.toString() === enrollment.student._id.toString());
      const presentDays = studentAttendance.filter(a => a.status === 'present').length;
      const absentDays = studentAttendance.filter(a => a.status === 'absent').length;
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
      course: {
        title: course.title,
        courseCode: course.courseCode,
        totalDays: course.totalDays,
        teacher: course.teacher.name
      },
      daysData,
      studentSummary,
      totalStudents: enrollments.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

