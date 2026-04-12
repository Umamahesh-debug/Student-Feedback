/**
 * Matches backend `POST /evaluations` completion rules (evaluations.js).
 */
export function isCourseCompletedForEvaluation(course) {
  if (!course) return false;
  if (course.status === 'completed') return true;

  const courseDays = Array.isArray(course.days) ? course.days : [];
  const totalDays = course.totalDays || courseDays.length;

  let completedDays = 0;
  if (courseDays.length > 0) {
    completedDays = courseDays.filter((d) => d.completed === true).length;
  } else {
    const legacySections = Array.isArray(course.sections) ? course.sections : [];
    completedDays = legacySections.filter((s) => s.completed === true).length;
  }

  return totalDays > 0 && completedDays >= totalDays;
}
