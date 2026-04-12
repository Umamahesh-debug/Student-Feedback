/**
 * Normalized day list for a course (matches certificates / analytics).
 */
function getNormalizedCourseDays(course) {
  if (Array.isArray(course.days) && course.days.length > 0) {
    return [...course.days].sort((a, b) => Number(a.dayNumber) - Number(b.dayNumber));
  }

  if (Array.isArray(course.sections) && course.sections.length > 0) {
    return course.sections.map((section, index) => ({
      dayNumber: section.dayNumber || index + 1,
      date: section.date,
      completed: !!section.completed,
      sections: section.sections || []
    }));
  }

  return [];
}

module.exports = { getNormalizedCourseDays };
