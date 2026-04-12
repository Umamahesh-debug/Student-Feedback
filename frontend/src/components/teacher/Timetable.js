import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import { FiCalendar, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getScheduleDays, getDayCalendarDate, isSameCalendarDate } from '../../utils/courseSchedule';
import './Timetable.css';

const Timetable = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/my-courses');
      const active = (response.data || []).filter((c) => c && c.status === 'active');
      setCourses(active);
      if (active.length > 0) {
        setSelectedCourse(active[0]._id);
      } else {
        setSelectedCourse(null);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const toggleDay = (dayIndex) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayIndex]: !prev[dayIndex]
    }));
  };

  const selectedCourseData = useMemo(
    () => courses.find((c) => String(c._id) === String(selectedCourse)),
    [courses, selectedCourse]
  );

  const scheduleDays = useMemo(
    () => (selectedCourseData ? getScheduleDays(selectedCourseData) : []),
    [selectedCourseData]
  );

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const dayIndexForToday = useMemo(() => {
    if (!selectedCourseData || scheduleDays.length === 0) return -1;
    return scheduleDays.findIndex((day) => {
      const d = getDayCalendarDate(day, selectedCourseData.startDate);
      return d && isSameCalendarDate(d, today);
    });
  }, [selectedCourseData, scheduleDays, today]);

  useEffect(() => {
    if (dayIndexForToday >= 0) {
      setExpandedDays({ [dayIndexForToday]: true });
    } else if (scheduleDays.length > 0) {
      setExpandedDays({ 0: true });
    }
  }, [selectedCourse, dayIndexForToday, scheduleDays.length]);

  return (
    <div className="timetable">
      <div className="page-header">
        <h1>Timetable</h1>
        <p>View your course schedule by day with sections and sub-sections.</p>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>No active courses. Create a course to see the timetable.</p>
        </div>
      ) : (
        <>
          <div className="course-selector">
            <label>Select Course:</label>
            <select
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} ({course.totalDays} days)
                </option>
              ))}
            </select>
          </div>

          {selectedCourseData && (
            <div className="timetable-content">
              <div className="course-info-header">
                <h2>{selectedCourseData.title}</h2>
                <p>
                  Start Date:{' '}
                  {selectedCourseData.startDate
                    ? new Date(selectedCourseData.startDate).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>

              {scheduleDays.length === 0 ? (
                <div className="empty-state">
                  <p>No timetable content yet. Add day-wise topics in the course editor.</p>
                </div>
              ) : (
                <div className="days-timetable">
                  {scheduleDays.map((day, dayIndex) => {
                    const dayDate = getDayCalendarDate(day, selectedCourseData.startDate);
                    const isToday = dayDate && isSameCalendarDate(dayDate, today);
                    const isExpanded = expandedDays[dayIndex];

                    return (
                      <div
                        key={`${day.dayNumber}-${dayIndex}`}
                        className={`timetable-day-card${isToday ? ' today' : ''}`}
                      >
                        <div className="timetable-day-header" onClick={() => toggleDay(dayIndex)}>
                          <div className="day-info">
                            <h3>Day {day.dayNumber ?? dayIndex + 1}</h3>
                            {day.title && <span className="day-title-preview">{day.title}</span>}
                            {dayDate && (
                              <span className="day-date">
                                <FiCalendar />{' '}
                                {dayDate.toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                                {isToday ? ' · Today' : ''}
                              </span>
                            )}
                          </div>
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        </div>

                        {isExpanded && (
                          <div className="day-content">
                            {day.sections && day.sections.length > 0 ? (
                              <div className="sections-list">
                                {day.sections.map((section, sectionIndex) => (
                                  <div key={sectionIndex} className="section-item">
                                    <div className="section-heading">
                                      <h4>{section.heading}</h4>
                                      {section.description && (
                                        <p className="section-desc">{section.description}</p>
                                      )}
                                    </div>

                                    {section.subSections && section.subSections.length > 0 && (
                                      <div className="sub-sections-list">
                                        {section.subSections.map((subSection, subIndex) => (
                                          <div key={subIndex} className="sub-section-item">
                                            <strong>{subSection.title}</strong>
                                            {subSection.description && (
                                              <p>{subSection.description}</p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="no-sections">No sections added for this day</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Timetable;
