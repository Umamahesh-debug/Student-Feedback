import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp, FiZap } from 'react-icons/fi';
import './CreateCourse.css';

const CreateCourse = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalDays: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    days: []
  });
  const [expandedDays, setExpandedDays] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingFullCourse, setGeneratingFullCourse] = useState(false);
  const [generatingSubtopics, setGeneratingSubtopics] = useState({});
  const navigate = useNavigate();

  // Initialize days array when component mounts or totalDays changes
  useEffect(() => {
    if (formData.days.length === 0 || formData.days.length !== formData.totalDays) {
      const startDate = new Date(formData.startDate || new Date());
      const daysList = [];
      for (let i = 1; i <= formData.totalDays; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + (i - 1));
        daysList.push({
          dayNumber: i,
          date: dayDate,
          topics: []
        });
      }
      setFormData(prev => ({ ...prev, days: daysList }));
    }
  }, []);

  // Generate course description based on all topics
  const generateCourseDescription = async () => {
    setGeneratingDescription(true);
    try {
      const allTopics = [];
      formData.days.forEach((day) => {
        const dayTopics = day.topics.map(t => t.name).filter(n => n);
        if (dayTopics.length > 0) {
          allTopics.push(`Day ${day.dayNumber}: ${dayTopics.join(', ')}`);
        }
      });

      if (allTopics.length === 0) {
        alert('Please add at least one topic first.');
        setGeneratingDescription(false);
        return;
      }

      const prompt = `Generate a professional course description for a training program titled "${formData.title}".

The course covers the following topics:
${allTopics.join('\n')}

The description should be:
- 2-3 paragraphs (around 150-200 words)
- Professional and engaging
- Summarize what students will learn across all days
- Highlight key skills and knowledge they will gain
- Suitable for corporate training

Only return the description text, no headings or formatting.`;

      // eslint-disable-next-line no-undef
      const response = await puter.ai.chat(prompt, {
        model: 'gemini-2.0-flash'
      });

      if (response) {
        const generatedText = typeof response === 'string' ? response.trim() : response.message?.content?.trim() || '';
        if (generatedText) {
          setFormData(prev => ({
            ...prev,
            description: generatedText
          }));
        }
      }
    } catch (error) {
      console.error('Error generating description:', error);
      alert('AI generation failed. Please enter description manually.');
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Generate subtopics for a topic based on its name
  const generateSubtopics = async (dayIndex, topicIndex, topicName) => {
    if (!topicName || topicName.trim().length < 2) {
      alert('Please enter a topic name first.');
      return;
    }

    const key = `${dayIndex}-${topicIndex}`;
    setGeneratingSubtopics(prev => ({ ...prev, [key]: true }));

    try {
      const prompt = `Generate 4-5 realistic learning subtopics for "${topicName}" with estimated durations.

Return ONLY as JSON array with no additional text:
[
  { "title": "subtopic name", "duration": "time estimate" },
  ...
]

Examples of durations: "30 minutes", "1 hour", "1.5 hours", "2 hours", "2.5 hours"
Make sure durations are realistic for learning each subtopic.`;

      // eslint-disable-next-line no-undef
      const response = await puter.ai.chat(prompt, {
        model: 'gemini-2.0-flash'
      });

      if (response) {
        const responseText = typeof response === 'string' ? response.trim() : response.message?.content?.trim() || '';

        // Parse JSON from response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const subtopics = JSON.parse(jsonMatch[0]);
          const days = [...formData.days];
          days[dayIndex].topics[topicIndex].subtopics = subtopics;
          setFormData(prev => ({ ...prev, days }));
        }
      }
    } catch (error) {
      console.error('Error generating subtopics:', error);
      alert('Failed to generate subtopics. Please add them manually.');
    } finally {
      setGeneratingSubtopics(prev => ({ ...prev, [key]: false }));
    }
  };

  const parseDurationToMinutes = (duration) => {
    if (duration === undefined || duration === null) return 60;

    const raw = String(duration).trim().toLowerCase();
    if (!raw) return 60;

    const normalized = raw.replace(/\s+/g, ' ');
    const numericMatch = normalized.match(/(\d+(?:\.\d+)?)/);
    if (!numericMatch) return null;

    const value = parseFloat(numericMatch[1]);
    if (Number.isNaN(value) || value < 0) return null;

    if (/(hour|hours|hr|hrs|\bh\b)/.test(normalized)) return Math.round(value * 60);
    if (/(minute|minutes|min|mins|\bm\b)/.test(normalized)) return Math.round(value);

    return null;
  };

  const formatMinutesAsDuration = (minutes) => {
    const safeMinutes = Math.max(15, Math.round(minutes));
    if (safeMinutes % 60 === 0) {
      const hrs = safeMinutes / 60;
      return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
    }

    if (safeMinutes > 60 && safeMinutes % 30 === 0) {
      return `${(safeMinutes / 60).toFixed(1)} hours`;
    }

    return `${safeMinutes} minutes`;
  };

  const normalizeDayToMaxSixHours = (dayTopics = []) => {
    const maxMinutes = 6 * 60;

    const normalizedTopics = dayTopics.map((topic) => ({
      name: topic.name || '',
      subtopics: Array.isArray(topic.subtopics)
        ? topic.subtopics
            .map((subtopic) => {
              const title = typeof subtopic?.title === 'string' ? subtopic.title.trim() : '';
              const parsed = parseDurationToMinutes(subtopic?.duration);
              if (!title) return null;

              return {
                title,
                minutes: parsed === null ? 60 : parsed
              };
            })
            .filter(Boolean)
        : []
    }));

    const allSubtopics = [];
    normalizedTopics.forEach((topic, topicIndex) => {
      topic.subtopics.forEach((subtopic, subtopicIndex) => {
        allSubtopics.push({ topicIndex, subtopicIndex, minutes: subtopic.minutes });
      });
    });

    const totalMinutes = allSubtopics.reduce((sum, s) => sum + s.minutes, 0);
    if (totalMinutes <= maxMinutes) {
      return normalizedTopics.map((topic) => ({
        name: topic.name,
        subtopics: topic.subtopics.map((sub) => ({
          title: sub.title,
          duration: formatMinutesAsDuration(sub.minutes)
        }))
      }));
    }

    const scale = maxMinutes / totalMinutes;
    allSubtopics.forEach(({ topicIndex, subtopicIndex, minutes }) => {
      normalizedTopics[topicIndex].subtopics[subtopicIndex].minutes = Math.max(15, Math.round(minutes * scale));
    });

    let adjustedTotal = normalizedTopics.reduce(
      (sum, topic) => sum + topic.subtopics.reduce((inner, sub) => inner + sub.minutes, 0),
      0
    );

    if (adjustedTotal > maxMinutes) {
      for (let i = normalizedTopics.length - 1; i >= 0 && adjustedTotal > maxMinutes; i -= 1) {
        const subtopics = normalizedTopics[i].subtopics;
        for (let j = subtopics.length - 1; j >= 0 && adjustedTotal > maxMinutes; j -= 1) {
          if (subtopics.length > 1) {
            adjustedTotal -= subtopics[j].minutes;
            subtopics.splice(j, 1);
          }
        }
      }
    }

    return normalizedTopics.map((topic) => ({
      name: topic.name,
      subtopics: topic.subtopics.map((sub) => ({
        title: sub.title,
        duration: formatMinutesAsDuration(sub.minutes)
      }))
    }));
  };

  const generateFullCoursePlan = async () => {
    if (!formData.title || formData.title.trim().length < 3) {
      alert('Please enter a course title first.');
      return;
    }

    const hasExistingContent = formData.days.some(
      (day) => (day.topics || []).some((topic) => (topic.name || '').trim() || (topic.subtopics || []).length > 0)
    );
    if (hasExistingContent) {
      const shouldReplace = window.confirm(
        'Existing topics/subtopics will be replaced. Do you want to continue?'
      );
      if (!shouldReplace) return;
    }

    setGeneratingFullCourse(true);
    try {
      const prompt = `Generate a complete day-wise course plan for "${formData.title}" for ${formData.totalDays} day(s).

Return ONLY valid JSON in this exact shape:
[
  {
    "dayNumber": 1,
    "topics": [
      {
        "name": "Topic name",
        "subtopics": [
          { "title": "Subtopic name", "duration": "45 minutes" },
          { "title": "Subtopic name", "duration": "1 hour" }
        ]
      }
    ]
  }
]

Rules:
- Include all day numbers from 1 to ${formData.totalDays}
- 3 to 5 topics per day
- Each topic should have 2 to 4 subtopics
- Total duration of all subtopics in each day must be 6 hours or less
- Subtopic durations must be realistic and use only minutes/hours
- Progressively structured content from fundamentals to advanced
- No markdown, no explanation, JSON only`;

      // eslint-disable-next-line no-undef
      const response = await puter.ai.chat(prompt, {
        model: 'gemini-2.0-flash'
      });

      const responseText = typeof response === 'string' ? response.trim() : response.message?.content?.trim() || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in AI response');
      }

      const generatedDays = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(generatedDays)) {
        throw new Error('Invalid AI response format');
      }

      const dayTopicMap = new Map();
      generatedDays.forEach((item) => {
        const dayNumber = parseInt(item?.dayNumber, 10);
        if (Number.isNaN(dayNumber) || dayNumber < 1 || dayNumber > formData.totalDays) return;

        const topics = Array.isArray(item?.topics)
          ? item.topics
              .map((topic) => ({
                name: typeof topic?.name === 'string' ? topic.name.trim() : '',
                subtopics: Array.isArray(topic?.subtopics)
                  ? topic.subtopics
                      .map((subtopic) => ({
                        title: typeof subtopic?.title === 'string' ? subtopic.title.trim() : '',
                        duration: typeof subtopic?.duration === 'string' ? subtopic.duration.trim() : '1 hour'
                      }))
                      .filter((subtopic) => subtopic.title)
                  : []
              }))
              .filter((topic) => topic.name)
          : [];

        dayTopicMap.set(dayNumber, normalizeDayToMaxSixHours(topics));
      });

      const updatedDays = formData.days.map((day) => ({
        ...day,
        topics: dayTopicMap.get(day.dayNumber) || []
      }));

      setFormData((prev) => ({
        ...prev,
        days: updatedDays
      }));

      const expanded = {};
      updatedDays.forEach((_, index) => {
        expanded[index] = true;
      });
      setExpandedDays(expanded);
    } catch (error) {
      console.error('Error generating full course plan:', error);
      alert('Failed to generate full course plan. Please try again.');
    } finally {
      setGeneratingFullCourse(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalDays' ? parseInt(value) : value
    }));

    if (name === 'totalDays') {
      const days = parseInt(value);
      const startDate = new Date(formData.startDate || new Date());
      const daysList = [];
      for (let i = 1; i <= days; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + (i - 1));
        daysList.push({
          dayNumber: i,
          date: dayDate,
          topics: []
        });
      }
      setFormData(prev => ({ ...prev, days: daysList }));
    }

    if (name === 'startDate') {
      const startDate = new Date(value);
      const days = formData.days.map((day, index) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + index);
        return {
          ...day,
          date: dayDate
        };
      });
      setFormData(prev => ({ ...prev, startDate: value, days }));
    }
  };

  const toggleDay = (dayIndex) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayIndex]: !prev[dayIndex]
    }));
  };

  const addTopic = (dayIndex) => {
    const days = [...formData.days];
    days[dayIndex].topics.push({
      name: '',
      subtopics: []
    });
    setFormData(prev => ({ ...prev, days }));
  };

  const removeTopic = (dayIndex, topicIndex) => {
    const days = [...formData.days];
    days[dayIndex].topics.splice(topicIndex, 1);
    setFormData(prev => ({ ...prev, days }));
  };

  const updateTopic = (dayIndex, topicIndex, field, value) => {
    const days = [...formData.days];
    days[dayIndex].topics[topicIndex][field] = value;
    setFormData(prev => ({ ...prev, days }));
  };

  const removeSubtopic = (dayIndex, topicIndex, subtopicIndex) => {
    const days = [...formData.days];
    days[dayIndex].topics[topicIndex].subtopics.splice(subtopicIndex, 1);
    setFormData(prev => ({ ...prev, days }));
  };

  const updateSubtopic = (dayIndex, topicIndex, subtopicIndex, field, value) => {
    const days = [...formData.days];
    days[dayIndex].topics[topicIndex].subtopics[subtopicIndex][field] = value;
    setFormData(prev => ({ ...prev, days }));
  };

  const validateDailySubtopicDuration = (days) => {
    const maxMinutes = 6 * 60;

    for (const day of days) {
      let totalMinutes = 0;
      const topics = Array.isArray(day.topics) ? day.topics : [];

      for (let topicIndex = 0; topicIndex < topics.length; topicIndex += 1) {
        const subtopics = Array.isArray(topics[topicIndex].subtopics) ? topics[topicIndex].subtopics : [];

        for (let subtopicIndex = 0; subtopicIndex < subtopics.length; subtopicIndex += 1) {
          const parsedMinutes = parseDurationToMinutes(subtopics[subtopicIndex].duration);

          if (parsedMinutes === null) {
            return `Invalid duration at Day ${day.dayNumber}, Topic ${topicIndex + 1}, Subtopic ${subtopicIndex + 1}. Use formats like \"30 minutes\" or \"1.5 hours\".`;
          }

          totalMinutes += parsedMinutes;
        }
      }

      if (totalMinutes > maxMinutes) {
        return `Day ${day.dayNumber} exceeds 6 hours total subtopic time. Please reduce durations.`;
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const durationError = validateDailySubtopicDuration(formData.days);
    if (durationError) {
      alert(durationError);
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        title: formData.title,
        description: formData.description || '',
        totalDays: parseInt(formData.totalDays),
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: formData.days.map((day, index) => {
          const cleanTopics = (day.topics || []).map(topic => ({
            name: topic.name || '',
            subtopics: (topic.subtopics || []).map(sub => ({
              title: sub.title || '',
              duration: sub.duration || '1 hour'
            }))
          }));

          return {
            dayNumber: day.dayNumber || (index + 1),
            topics: cleanTopics
          };
        })
      };

      const response = await api.post('/courses', submitData);
      navigate(`/teacher/courses/${response.data._id}`);
    } catch (error) {
      console.error('Create course error:', error);
      alert(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-course">
      <div className="page-header">
        <h1>Create Course</h1>
      </div>

      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-section">
          <h2>Course Information</h2>
          <div className="form-group">
            <label>Course Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter course title"
              required
            />
          </div>
          <div className="form-group">
            <label>
              Description
              {generatingDescription && (
                <span className="ai-generating">
                  <FiZap className="ai-icon spinning" /> AI Generating...
                </span>
              )}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder={generatingDescription ? "Generating description from topics..." : "Course description (will be auto-generated based on topics)"}
              disabled={generatingDescription}
            />
            <p className="form-hint">
              💡 Add topics for each day below, then click "Generate Course Description" to auto-generate based on all topics.
            </p>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate}
                required
              />
              <p className="form-hint">Course visible to students between these dates</p>
            </div>
          </div>
          <div className="form-group">
            <label>Number of Days *</label>
            <select
              name="totalDays"
              value={formData.totalDays}
              onChange={handleChange}
              required
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day} {day === 1 ? 'Day' : 'Days'}</option>
              ))}
            </select>
            <p className="form-hint">Dates will be automatically calculated from start date</p>
          </div>
        </div>

        <div className="form-section">
          <h2>Course Topics</h2>
          <p className="section-info">
            For each day, add topics. Subtopics will be auto-generated based on the topic name, or you can add them manually.
          </p>
          <div className="topics-ai-actions">
            <button
              type="button"
              className="btn-generate-full-course"
              onClick={generateFullCoursePlan}
              disabled={generatingFullCourse || !formData.title}
            >
              {generatingFullCourse ? (
                <>
                  <FiZap className="spinning" /> Generating Full Course...
                </>
              ) : (
                <>
                  <FiZap /> One-Click Full Course
                </>
              )}
            </button>
          </div>
          <div className="days-list">
            {formData.days.map((day, dayIndex) => (
              <div key={dayIndex} className="day-item">
                <div className="day-header" onClick={() => toggleDay(dayIndex)}>
                  <div>
                    <h3>Day {day.dayNumber}</h3>
                    <span className="day-date-display">
                      {day.date ? new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Date not set'}
                    </span>
                    <span className="topic-count">
                      {day.topics.length} topic{day.topics.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {expandedDays[dayIndex] ? <FiChevronUp /> : <FiChevronDown />}
                </div>

                {expandedDays[dayIndex] && (
                  <div className="day-content">
                    <div className="topics-list">
                      {day.topics.map((topic, topicIndex) => (
                        <div key={topicIndex} className="topic-item">
                          <div className="topic-header-row">
                            <h4>Topic {topicIndex + 1}</h4>
                            <button
                              type="button"
                              className="btn-remove"
                              onClick={() => removeTopic(dayIndex, topicIndex)}
                            >
                              <FiTrash2 /> Remove
                            </button>
                          </div>

                          <div className="form-group">
                            <label>Topic Name *</label>
                            <div className="topic-input-row">
                              <input
                                type="text"
                                value={topic.name}
                                onChange={(e) => updateTopic(dayIndex, topicIndex, 'name', e.target.value)}
                                placeholder="e.g., HTML, CSS, JavaScript"
                                required
                              />
                              {generatingSubtopics[`${dayIndex}-${topicIndex}`] ? (
                                <span className="ai-generating-small">
                                  <FiZap className="ai-icon spinning" /> Generating...
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="ai-generate-btn-small"
                                  onClick={() => generateSubtopics(dayIndex, topicIndex, topic.name)}
                                  disabled={!topic.name}
                                >
                                  <FiZap /> Auto-Generate
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="subtopics-section">
                            <label>Subtopics</label>
                            <div className="subtopics-list">
                              {topic.subtopics.length > 0 ? (
                                topic.subtopics.map((subtopic, subIndex) => (
                                  <div key={subIndex} className="subtopic-item">
                                    <div className="subtopic-content">
                                      <input
                                        type="text"
                                        value={subtopic.title}
                                        onChange={(e) => updateSubtopic(dayIndex, topicIndex, subIndex, 'title', e.target.value)}
                                        placeholder="Subtopic title"
                                        className="subtopic-title"
                                      />
                                      <input
                                        type="text"
                                        value={subtopic.duration}
                                        onChange={(e) => updateSubtopic(dayIndex, topicIndex, subIndex, 'duration', e.target.value)}
                                        placeholder="e.g., 1 hour"
                                        className="subtopic-duration"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      className="btn-remove-small"
                                      onClick={() => removeSubtopic(dayIndex, topicIndex, subIndex)}
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="no-subtopics">No subtopics yet. Click "Auto-Generate" to create them.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn-add-topic"
                      onClick={() => addTopic(dayIndex)}
                    >
                      <FiPlus /> Add Topic
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Generate Course Description Button */}
        {formData.days.some(day => day.topics.length > 0) && (
          <div className="ai-generate-section">
            <div className="ai-generate-info">
              <FiZap className="ai-info-icon" />
              <div>
                <h4>Generate Course Description with AI</h4>
                <p>Based on all the topics you've added, AI will create a comprehensive course description.</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-generate-description"
              onClick={generateCourseDescription}
              disabled={generatingDescription}
            >
              {generatingDescription ? (
                <>
                  <FiZap className="spinning" /> Generating...
                </>
              ) : (
                <>
                  <FiZap /> Generate Course Description
                </>
              )}
            </button>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/teacher/courses')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCourse;
