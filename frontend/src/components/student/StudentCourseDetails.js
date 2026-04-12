import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { isCourseCompletedForEvaluation } from '../../utils/courseCompletion';
import { FiArrowLeft, FiCheckCircle, FiClock, FiCalendar, FiBook, FiUser, FiChevronDown, FiChevronUp, FiAward, FiTarget } from 'react-icons/fi';
import './StudentCourseDetails.css';

const StudentCourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [dayRatings, setDayRatings] = useState({});
  const [selectedRatings, setSelectedRatings] = useState({});
  const [ratingComments, setRatingComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState({});
  const [evaluationSubmitted, setEvaluationSubmitted] = useState(false);

  useEffect(() => {
    fetchCourseData();
    fetchEvaluationStatus();
  }, [id]);

  // Fetch all day ratings when course loads
  useEffect(() => {
    if (course && course.days) {
      course.days.forEach(day => {
        if (day.completed) {
          fetchDayRating(day.dayNumber);
        }
      });
    }
  }, [course]);

  const fetchEvaluationStatus = async () => {
    try {
      const response = await api.get(`/evaluations/my-evaluation?courseId=${id}`);
      setEvaluationSubmitted(!!response.data);
    } catch (error) {
      // If 404, evaluation not submitted yet
      setEvaluationSubmitted(false);
    }
  };

  // Refetch evaluation status when window regains focus (after navigation back)
  useEffect(() => {
    const handleFocus = () => {
      fetchEvaluationStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id]);

  // Refetch evaluation status when location changes (navigation back)
  useEffect(() => {
    if (location.state?.refreshEvaluation) {
      fetchEvaluationStatus();
      // Clear the state to avoid repeated fetches
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchCourseData = async () => {
    try {
      const [courseRes, enrollmentsRes, attendanceRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get('/enrollments/my-enrollments'),
        api.get(`/attendance/my-attendance?courseId=${id}`)
      ]);

      setCourse(courseRes.data);

      // Find enrollment for this course
      const courseEnrollment = enrollmentsRes.data.find(
        (e) => e.course && String(e.course._id) === String(id)
      );
      setEnrollment(courseEnrollment);

      // Get attendance records for this course
      const attendanceData = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
      const courseAttendance = attendanceData.find(
        (a) => a.course && String(a.course._id) === String(id)
      );
      setAttendance(courseAttendance?.records || []);

      // Expand first incomplete day by default
      if (courseRes.data.days && courseRes.data.days.length > 0) {
        const firstIncompleteIndex = courseRes.data.days.findIndex(
          (day) => !isDayCompleted(day.dayNumber)
        );
        if (firstIncompleteIndex !== -1) {
          setExpandedDays({ [firstIncompleteIndex]: true });
        } else {
          setExpandedDays({ [0]: true });
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayIndex) => {
    setExpandedDays(prev => {
      const next = { ...prev, [dayIndex]: !prev[dayIndex] };
      // If expanded now, attempt to fetch rating for that day
      if (next[dayIndex]) {
        const day = course.days && course.days[dayIndex];
        if (day && day.completed) {
          fetchDayRating(day.dayNumber);
        }
      }
      return next;
    });
  };

  const isDayCompleted = (dayNumber) => {
    // Use teacher-marked completion on course days
    if (!course || !course.days) return false;
    const day = course.days.find(d => d.dayNumber === dayNumber);
    return day ? !!day.completed : false;
  };

  const fetchDayRating = async (dayNumber) => {
    try {
      const res = await api.get(`/ratings/my?courseId=${id}&dayNumber=${dayNumber}`);
      setDayRatings(prev => ({ ...prev, [dayNumber]: res.data }));
      if (res.data && res.data.rating) {
        setSelectedRatings(prev => ({ ...prev, [dayNumber]: res.data.rating }));
        setRatingComments(prev => ({ ...prev, [dayNumber]: res.data.comment || '' }));
      }
    } catch (error) {
      console.error('Failed to fetch day rating', error);
    }
  };

  const submitDayRating = async (dayNumber, rating, comment) => {
    try {
      const res = await api.post('/ratings/day', { courseId: id, dayNumber, rating, comment });
      // Update state with the new rating data
      setDayRatings(prev => ({ ...prev, [dayNumber]: res.data }));
      setSelectedRatings(prev => ({ ...prev, [dayNumber]: res.data.rating }));
      setRatingComments(prev => ({ ...prev, [dayNumber]: res.data.comment || '' }));
      alert('Thanks for rating this day!');
    } catch (error) {
      console.error('Failed to submit rating', error);
      alert(error.response?.data?.message || 'Failed to submit rating');
    }
  };

  const ratingLabels = {
    1: 'Bad',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent'
  };

  const getDayDate = (day) => {
    if (day.date) {
      return new Date(day.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    if (course.startDate) {
      const date = new Date(course.startDate);
      date.setDate(date.getDate() + (day.dayNumber - 1));
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return null;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 50) return '#3b82f6';
    if (progress >= 25) return '#f59e0b';
    return '#6b7280';
  };

  if (loading || !course) {
    return (
      <div className="error-state">
        <p>Course not found</p>
        <button onClick={() => navigate('/student/courses')} className="btn-primary">
          Back to Courses
        </button>
      </div>
    );
  }

  const progress = enrollment?.progress || 0;
  const daysCompleted = enrollment?.daysCompleted || 0;
  const progressColor = getProgressColor(progress);

  const totalDays = course.totalDays || 0;
  const courseMarkedComplete = isCourseCompletedForEvaluation(course);

  const presentDaysForCourse = attendance.filter((a) => a.status === 'present').length;
  const courseAttendancePct =
    totalDays > 0 ? Math.round((presentDaysForCourse / totalDays) * 100) : 0;

  const isAbsentForDay = (dayNumber) => {
    const rec = attendance.find((a) => Number(a.dayNumber) === Number(dayNumber));
    return Boolean(rec && rec.status === 'absent');
  };

  const canGiveFeedback = courseMarkedComplete && courseAttendancePct >= 75;

  let overallFeedbackDisabledTitle =
    'Give overall feedback for this course';
  if (!canGiveFeedback) {
    if (!courseMarkedComplete && courseAttendancePct < 75) {
      overallFeedbackDisabledTitle =
        'All training days must be marked complete by your instructor, and attendance must be at least 75%.';
    } else if (!courseMarkedComplete) {
      overallFeedbackDisabledTitle =
        'All training days must be marked complete by your instructor before you can give overall feedback.';
    } else {
      overallFeedbackDisabledTitle = `Your attendance is ${courseAttendancePct}%. At least 75% is required for overall feedback.`;
    }
  }

  return (
    <div className="course-details-container">
      {/* Header */}
      <div className="course-header-section">
        <button className="back-btn" onClick={() => navigate('/student/courses')}>
          <FiArrowLeft />
          <span>Back to Courses</span>
        </button>

        <div className="course-header-content">
          <div className="course-title-area">
            <h1>{course.title}</h1>
            <div className="course-badges">
              <span className="course-code">{course.courseCode}</span>
              <span className={`status-badge ${course.status}`}>
                {course.status}
              </span>
            </div>
          </div>

          {course.teacher && (
            <div className="teacher-card">
              {course.teacher.profilePicture ? (
                <img 
                  src={course.teacher.profilePicture} 
                  alt={course.teacher.name}
                  className="teacher-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="teacher-avatar-fallback"
                style={{ display: course.teacher.profilePicture ? 'none' : 'flex' }}
              >
                <FiUser />
              </div>
              <span className="teacher-name">{course.teacher.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Course Description */}
      {course.description && (
        <div className="course-description-card">
          <h2>Course Description</h2>
          <p>{course.description}</p>
        </div>
      )}

      {/* Progress Card */}
      <div className="progress-card">
        <div className="progress-header">
          <h2>Your Progress</h2>
          <span className="progress-percentage" style={{ color: progressColor }}>
            {progress}%
          </span>
          {!evaluationSubmitted && (
            <button
              className="overall-feedback-btn"
              onClick={() => navigate(`/student/evaluation/${id}`)}
              disabled={!canGiveFeedback}
              title={overallFeedbackDisabledTitle}
            >
              Give Overall Feedback
            </button>
          )}
        </div>
        
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ 
              width: `${progress}%`,
              backgroundColor: progressColor 
            }}
          />
        </div>

        <div className="progress-stats">
          <div className="progress-stat">
            <FiCheckCircle style={{ color: progressColor }} />
            <span>{daysCompleted} of {course.totalDays} days completed</span>
          </div>
          <div className="progress-stat">
            <FiUser style={{ color: '#0ea5e9' }} />
            <span>
              Attendance: {courseAttendancePct}%
              {totalDays > 0 ? ` (${presentDaysForCourse} of ${totalDays} days present)` : ''}
            </span>
          </div>
          <div className="progress-stat">
            <FiClock style={{ color: '#6b7280' }} />
            <span>{course.totalDays - daysCompleted} days remaining</span>
          </div>
          {(course.startDate || course.endDate) && (
            <div className="progress-stat course-date-range">
              <FiCalendar style={{ color: '#3b5998' }} />
              <span>
                {course.startDate ? new Date(course.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                {' - '}
                {course.endDate ? new Date(course.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
              </span>
            </div>
          )}
        </div>

        {/* Evaluation Submission Status */}
        {progress === 100 && (
          <div className={`evaluation-status ${evaluationSubmitted ? 'submitted' : 'pending'}`}>
            <div className="evaluation-status-content">
              {evaluationSubmitted ? (
                <>
                  <FiCheckCircle className="status-icon success" />
                  <div className="status-text">
                    <h4>✓ Overall Feedback Submitted</h4>
                    <p>Thank you for completing the course evaluation!</p>
                  </div>
                </>
              ) : (
                <>
                  <FiClock className="status-icon pending" />
                  <div className="status-text">
                    <h4>⚠ Overall Feedback Required</h4>
                    <p>Please submit your overall feedback to unlock the certificate</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Certificate Button */}
        {progress === 100 && evaluationSubmitted && (
          <div className="certificate-prompt">
            <div className="certificate-prompt-content">
              <FiAward className="certificate-icon" />
              <div className="certificate-text">
                <h4>🎉 Congratulations! Course Completed</h4>
                <p>Your certificate is ready to view and download.</p>
              </div>
            </div>
            <button 
              className="btn-certificate"
              onClick={() => navigate(`/student/certificate/${id}`)}
            >
              <FiAward /> View Certificate
            </button>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="course-content-card">
        <div className="content-header">
          <h2>Course Content</h2>
          <p>Click on a day to view topics</p>
        </div>

        {(course.days || course.sections) && (course.days?.length > 0 || course.sections?.length > 0) ? (
          <div className="days-timeline">
            {/* New topic-based structure */}
            {course.days && course.days.length > 0 ? (
              course.days.map((day, dayIndex) => {
              const isCompleted = isDayCompleted(day.dayNumber);
              const isExpanded = expandedDays[dayIndex];
              const dayDate = getDayDate(day);
              const isToday = dayIndex === daysCompleted && !isCompleted;

              return (
                <div
                  key={dayIndex}
                  className={`day-item ${isCompleted ? 'completed' : ''} ${isToday ? 'current' : ''} ${isExpanded ? 'expanded' : ''}`}
                >
                  <div
                    className="day-header"
                    onClick={() => toggleDay(dayIndex)}
                  >
                    <div className="day-left">
                      <div className={`day-indicator ${isCompleted ? 'completed' : ''} ${isToday ? 'current' : ''}`}>
                        {isCompleted ? (
                          <FiCheckCircle />
                        ) : (
                          <span>{day.dayNumber}</span>
                        )}
                      </div>

                      <div className="day-info">
                        <h3>Day {day.dayNumber}</h3>
                        {dayDate && (
                          <span className="day-date">
                            <FiCalendar /> {dayDate}
                          </span>
                        )}
                        {day.topics && day.topics.length > 0 && (
                          <span className="topic-count">
                            {day.topics.length} topic{day.topics.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="day-right">
                      {isCompleted && (
                        <span className="completed-tag">Completed</span>
                      )}
                      {isToday && (
                        <span className="current-tag">Current</span>
                      )}
                      <button className="expand-btn">
                        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="day-content">
                      {day.topics && day.topics.length > 0 ? (
                        <div className="topics-container">
                          {day.topics.map((topic, topicIndex) => (
                            <div key={topicIndex} className="topic-card">
                              <div className="topic-header">
                                <FiBook />
                                <h4>{topic.name}</h4>
                              </div>

                              {topic.subtopics && topic.subtopics.length > 0 && (
                                <div className="subtopics-list">
                                  {topic.subtopics.map((subtopic, subIndex) => (
                                    <div key={subIndex} className="subtopic-item">
                                      <div className="subtopic-header">
                                        <FiTarget />
                                        <span className="subtopic-title">{subtopic.title}</span>
                                        {subtopic.duration && (
                                          <span className="subtopic-duration">
                                            <FiClock /> {subtopic.duration}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Rating UI: show if day marked completed by teacher */}
                          <div className="day-rating">
                            {isCompleted ? (
                              isAbsentForDay(day.dayNumber) ? (
                                <div className="not-yet" style={{ borderLeft: '3px solid #f59e0b' }}>
                                  You were marked absent for this day, so daily feedback is not available.
                                </div>
                              ) : dayRatings[day.dayNumber] ? (
                                <div className="rated-info">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="stars-wrapper">
                                      {[1, 2, 3, 4, 5].map(n => (
                                        <span key={n} className={`star-display ${n <= dayRatings[day.dayNumber].rating ? 'selected' : ''} star-${n}`}>
                                          <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
                                            <path d="M12 .587l3.668 7.431L23.327 9.9l-5.659 5.507L18.998 24 12 20.201 5.002 24l1.33-8.593L.673 9.9l7.659-1.882L12 .587z" />
                                          </svg>
                                        </span>
                                      ))}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 700 }}>{dayRatings[day.dayNumber].rating} / 5</div>
                                      {dayRatings[day.dayNumber].comment ? (
                                        <div style={{ color: '#374151', marginTop: 4 }}>{dayRatings[day.dayNumber].comment}</div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="rate-actions">
                                  <p>Rate this day (1-5):</p>
                                  <div className="star-rating" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div>
                                      <div className="stars-wrapper">
                                        {[1, 2, 3, 4, 5].map(n => {
                                          const selected = (selectedRatings[day.dayNumber] || 0) >= n;
                                          return (
                                            <button
                                              key={n}
                                              type="button"
                                              className={`star-btn ${selected ? 'selected' : ''} star-${n}`}
                                              onClick={() => setSelectedRatings(prev => ({ ...prev, [day.dayNumber]: n }))}
                                              aria-label={`Rate ${n} stars`}
                                            >
                                              <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
                                                <path d="M12 .587l3.668 7.431L23.327 9.9l-5.659 5.507L18.998 24 12 20.201 5.002 24l1.33-8.593L.673 9.9l7.659-1.882L12 .587z" />
                                              </svg>
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <div className="rating-label" style={{ marginLeft: 12, fontWeight: 600, color: '#111' }}>
                                        {selectedRatings[day.dayNumber] ? ratingLabels[selectedRatings[day.dayNumber]] : ''}
                                      </div>
                                    </div>
                                    <div className="rating-submit">
                                      <input
                                        type="text"
                                        placeholder="Optional comment"
                                        value={ratingComments[day.dayNumber] || ''}
                                        onChange={(e) => setRatingComments(prev => ({ ...prev, [day.dayNumber]: e.target.value }))}
                                        className="rating-comment"
                                      />
                                      <button
                                        className="btn-primary rating-submit-btn"
                                        onClick={() => submitDayRating(day.dayNumber, selectedRatings[day.dayNumber], ratingComments[day.dayNumber])}
                                        disabled={!selectedRatings[day.dayNumber]}
                                      >
                                        Submit
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="not-yet">This day has not been marked completed by the teacher yet.</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="empty-sections">
                          <p>No topics available for this day</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
            ) : course.sections && course.sections.length > 0 ? (
              /* Old section-based structure for backward compatibility */
              course.sections.map((day, dayIndex) => {
                const isCompleted = isDayCompleted(day.dayNumber);
                const isExpanded = expandedDays[dayIndex];
                const dayDate = day.date ? new Date(day.date).toLocaleDateString() : '';
                const isToday = dayIndex === daysCompleted && !isCompleted;

                return (
                  <div
                    key={dayIndex}
                    className={`day-item ${isCompleted ? 'completed' : ''} ${isToday ? 'current' : ''} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div
                      className="day-header"
                      onClick={() => toggleDay(dayIndex)}
                    >
                      <div className="day-left">
                        <div className={`day-indicator ${isCompleted ? 'completed' : ''} ${isToday ? 'current' : ''}`}>
                          {isCompleted ? (
                            <FiCheckCircle />
                          ) : (
                            <span>{day.dayNumber}</span>
                          )}
                        </div>

                        <div className="day-info">
                          <h3>Day {day.dayNumber}</h3>
                          {dayDate && (
                            <span className="day-date">
                              <FiCalendar /> {dayDate}
                            </span>
                          )}
                          {day.sections && day.sections.length > 0 && (
                            <span className="topic-count">
                              {day.sections.length} section{day.sections.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="day-right">
                        {isCompleted && (
                          <span className="completed-tag">Completed</span>
                        )}
                        {isToday && (
                          <span className="current-tag">Current</span>
                        )}
                        <button className="expand-btn">
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="day-content">
                        {day.sections && day.sections.length > 0 ? (
                          <div className="sections-container">
                            {day.sections.map((section, sectionIndex) => (
                              <div key={sectionIndex} className="section-card">
                                <div className="section-header">
                                  <FiBook />
                                  <h4>{section.heading}</h4>
                                </div>
                                {section.description && (
                                  <p className="section-description">{section.description}</p>
                                )}

                                {section.subSections && section.subSections.length > 0 && (
                                  <div className="subsections-list">
                                    {section.subSections.map((subSection, subIndex) => (
                                      <div key={subIndex} className="subsection-item">
                                        <div className="subsection-header">
                                          <FiTarget />
                                          <span className="subsection-title">{subSection.title}</span>
                                        </div>
                                        {subSection.description && (
                                          <p className="subsection-description">{subSection.description}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Rating UI: show if day marked completed by teacher */}
                            <div className="day-rating">
                              {isCompleted ? (
                                isAbsentForDay(day.dayNumber) ? (
                                  <div className="not-yet" style={{ borderLeft: '3px solid #f59e0b' }}>
                                    You were marked absent for this day, so daily feedback is not available.
                                  </div>
                                ) : dayRatings[day.dayNumber] ? (
                                  <div className="rated-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div className="stars-wrapper">
                                        {[1, 2, 3, 4, 5].map(n => (
                                          <span key={n} className={`star-display ${n <= dayRatings[day.dayNumber].rating ? 'selected' : ''} star-${n}`}>
                                            <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
                                              <path d="M12 .587l3.668 7.431L23.327 9.9l-5.659 5.507L18.998 24 12 20.201 5.002 24l1.33-8.593L.673 9.9l7.659-1.882L12 .587z" />
                                            </svg>
                                          </span>
                                        ))}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 700 }}>{dayRatings[day.dayNumber].rating} / 5</div>
                                        {dayRatings[day.dayNumber].comment ? (
                                          <div style={{ color: '#374151', marginTop: 4 }}>{dayRatings[day.dayNumber].comment}</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rate-actions">
                                    <p>Rate this day (1-5):</p>
                                    <div className="star-rating" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div>
                                        <div className="stars-wrapper">
                                          {[1, 2, 3, 4, 5].map(n => {
                                            const selected = (selectedRatings[day.dayNumber] || 0) >= n;
                                            return (
                                              <button
                                                key={n}
                                                type="button"
                                                className={`star-btn ${selected ? 'selected' : ''} star-${n}`}
                                                onClick={() => setSelectedRatings(prev => ({ ...prev, [day.dayNumber]: n }))}
                                                aria-label={`Rate ${n} stars`}
                                              >
                                                <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
                                                  <path d="M12 .587l3.668 7.431L23.327 9.9l-5.659 5.507L18.998 24 12 20.201 5.002 24l1.33-8.593L.673 9.9l7.659-1.882L12 .587z" />
                                                </svg>
                                              </button>
                                            );
                                          })}
                                        </div>
                                        <div className="rating-label" style={{ marginLeft: 12, fontWeight: 600, color: '#111' }}>
                                          {selectedRatings[day.dayNumber] ? ratingLabels[selectedRatings[day.dayNumber]] : ''}
                                        </div>
                                      </div>
                                      <div className="rating-submit">
                                        <input
                                          type="text"
                                          placeholder="Optional comment"
                                          value={ratingComments[day.dayNumber] || ''}
                                          onChange={(e) => setRatingComments(prev => ({ ...prev, [day.dayNumber]: e.target.value }))}
                                          className="rating-comment"
                                        />
                                        <button
                                          className="btn-primary rating-submit-btn"
                                          onClick={() => submitDayRating(day.dayNumber, selectedRatings[day.dayNumber], ratingComments[day.dayNumber])}
                                          disabled={!selectedRatings[day.dayNumber]}
                                        >
                                          Submit
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="not-yet">This day has not been marked completed by the teacher yet.</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="empty-sections">
                            <p>No sections available for this day</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-content">
                <FiBook />
                <p>No course content available</p>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-content">
            <FiBook />
            <p>No course content available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourseDetails;