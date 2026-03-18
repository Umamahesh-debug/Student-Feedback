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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
