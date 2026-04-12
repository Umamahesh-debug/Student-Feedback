const Attendance = require('../models/Attendance');

/**
 * Attendance % = distinct days marked present / scheduled course days.
 * Matches student "my-attendance" stats (present / course.totalDays).
 */
async function getStudentCourseAttendancePercent(studentId, course) {
  const scheduledDays =
    Number(course.totalDays) > 0
      ? Number(course.totalDays)
      : Array.isArray(course.days) && course.days.length > 0
        ? course.days.length
        : Array.isArray(course.sections) && course.sections.length > 0
          ? course.sections.length
          : 0;

  if (scheduledDays <= 0) return { scheduledDays: 0, presentDays: 0, percentage: 0 };

  const presentRecords = await Attendance.find({
    student: studentId,
    course: course._id,
    status: 'present'
  }).select('dayNumber');

  const presentDays = new Set(
    presentRecords.map((a) => Number(a.dayNumber)).filter((n) => !Number.isNaN(n))
  ).size;

  const percentage = Math.round((presentDays / scheduledDays) * 100);
  return { scheduledDays, presentDays, percentage };
}

async function wasAbsentOnDay(studentId, courseId, dayNumber) {
  const dayNum = Number(dayNumber);
  if (Number.isNaN(dayNum)) return false;

  const record = await Attendance.findOne({
    student: studentId,
    course: courseId,
    dayNumber: dayNum
  }).select('status');

  return Boolean(record && record.status === 'absent');
}

module.exports = {
  getStudentCourseAttendancePercent,
  wasAbsentOnDay
};
