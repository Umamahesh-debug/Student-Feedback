/**
 * Normalize course schedule for timetable UIs.
 * Current courses use `days` + `topics`/`subtopics`; older data may use `sections`.
 */
export function getScheduleDays(course) {
  if (!course) return [];

  if (Array.isArray(course.sections) && course.sections.length > 0) {
    return course.sections;
  }

  const days = course.days;
  if (!Array.isArray(days) || days.length === 0) return [];

  return days.map((day, index) => {
    const dayNumber = day.dayNumber ?? index + 1;
    const topics = Array.isArray(day.topics) ? day.topics : [];
    const sections = topics.map((topic) => ({
      heading: topic.name || 'Topic',
      description: '',
      subSections: (Array.isArray(topic.subtopics) ? topic.subtopics : []).map((st) => ({
        title: st.title || '',
        description: st.duration ? `Duration: ${st.duration}` : ''
      }))
    }));

    return {
      dayNumber,
      title: topics.length ? topics.map((t) => t.name).filter(Boolean).join(' · ') : `Day ${dayNumber}`,
      sections,
      date: day.date
    };
  });
}

export function getDayCalendarDate(day, courseStartDate) {
  if (day?.date) {
    const d = new Date(day.date);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (!courseStartDate) return null;
  const start = new Date(courseStartDate);
  if (Number.isNaN(start.getTime())) return null;
  const n = day.dayNumber != null ? day.dayNumber : 1;
  const date = new Date(start);
  date.setDate(date.getDate() + (n - 1));
  return date;
}

export function isSameCalendarDate(a, b) {
  if (!a || !b) return false;
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}
