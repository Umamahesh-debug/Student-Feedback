const Attendance = require('../models/Attendance');
const DayRating = require('../models/DayRating');
const { getNormalizedCourseDays } = require('./courseSchedule');

/**
 * Days where the student must submit a day rating: teacher-marked completed days,
 * excluding days marked absent. Skips only explicit "absent"; "not marked" still requires feedback.
 */
async function findDayRatingForDay(studentId, courseId, dn) {
  const n = Number(dn);
  let r = await DayRating.findOne({ student: studentId, course: courseId, dayNumber: n });
  if (r) return r;
  return DayRating.findOne({
    student: studentId,
    course: courseId,
    dayNumber: { $in: [n, String(n)] }
  });
}

async function getPendingDayReviewsForCompletedDays(studentId, courseId, completedDays) {
  const pendingReviews = [];

  const dayRecords = await Attendance.find({ student: studentId, course: courseId }).select(
    'dayNumber status'
  );
  const statusByDay = new Map(dayRecords.map((a) => [Number(a.dayNumber), a.status]));

  for (const day of completedDays) {
    const dn = Number(day.dayNumber);
    if (statusByDay.get(dn) === 'absent') continue;

    const dayRating = await findDayRatingForDay(studentId, courseId, day.dayNumber);

    if (!dayRating) {
      const topicFromTopics = day.topics && day.topics[0] ? day.topics[0].name : null;
      const topicFromSections =
        day.sections && day.sections[0]
          ? day.sections[0].heading || day.sections[0].title
          : null;
      const topic = topicFromTopics || topicFromSections || `Day ${day.dayNumber}`;

      const dayDate = day.date ? new Date(day.date).toLocaleDateString() : `Day ${day.dayNumber}`;
      pendingReviews.push({
        type: 'day_feedback',
        date: day.date,
        dayNumber: day.dayNumber,
        topic,
        message: `Please submit feedback for ${topic} (${dayDate})`
      });
    }
  }

  return pendingReviews;
}

async function getPendingDayReviews(studentId, courseId, course) {
  const courseDays = getNormalizedCourseDays(course);
  const completedDaysList = courseDays.filter((d) => d.completed === true);
  return getPendingDayReviewsForCompletedDays(studentId, courseId, completedDaysList);
}

module.exports = {
  getPendingDayReviews,
  getPendingDayReviewsForCompletedDays
};
