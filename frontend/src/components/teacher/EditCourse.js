import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './CreateCourse.css';

const EditCourse = () => {
  const { id } = useParams();
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        const course = res.data;

        // normalize startDate to yyyy-mm-dd
        const startDate = course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const endDate = course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '';

        // ensure day.date are plain dates for display
        const days = (course.days || []).map(day => ({
          dayNumber: day.dayNumber,
          date: day.date ? new Date(day.date) : null,
          topics: (day.topics || []).map(t => ({
            name: t.name || '',
            subtopics: (t.subtopics || []).map(st => ({ title: st.title || '', duration: st.duration || '1 hour' }))
          }))
        }));

        setFormData({
          title: course.title || '',
          description: course.description || '',
          totalDays: course.totalDays || days.length || 1,
          startDate,
          endDate,
          days
        });
      } catch (err) {
        console.error('Failed to load course for editing', err);
        alert('Failed to load course');
        navigate('/teacher/courses');
      }
    };

    fetchCourse();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'totalDays' ? parseInt(value) : value }));

    if (name === 'totalDays') {
      const days = parseInt(value);
      const start = new Date(formData.startDate || new Date());
      const daysList = [];
      for (let i = 1; i <= days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + (i - 1));
        daysList.push({ dayNumber: i, date: d, topics: [] });
      }
      setFormData(prev => ({ ...prev, days: daysList }));
    }

    if (name === 'startDate') {
      const start = new Date(value);
      const daysList = formData.days.map((day, index) => {
        const d = new Date(start);
        d.setDate(start.getDate() + index);
        return { ...day, date: d };
      });
      setFormData(prev => ({ ...prev, startDate: value, days: daysList }));
    }
  };

  const toggleDay = (dayIndex) => setExpandedDays(prev => ({ ...prev, [dayIndex]: !prev[dayIndex] }));

  const addTopic = (dayIndex) => {
    const days = [...formData.days];
    days[dayIndex].topics.push({ name: '', subtopics: [] });
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
        days: formData.days.map((day, index) => ({
          dayNumber: day.dayNumber || (index + 1),
          topics: (day.topics || []).map(topic => ({
            name: topic.name || '',
            subtopics: (topic.subtopics || []).map(sub => ({ title: sub.title || '', duration: sub.duration || '1 hour' }))
          }))
        }))
      };

      await api.put(`/courses/${id}`, submitData);
      navigate(`/teacher/courses/${id}`);
    } catch (error) {
      console.error('Update course error:', error);
      alert(error.response?.data?.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-course">
      <div className="page-header">
        <h1>Edit Course</h1>
      </div>

      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-section">
          <h2>Course Information</h2>
          <div className="form-group">
            <label>Course Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} min={formData.startDate} required />
              <p className="form-hint">Course visible to students between these dates</p>
            </div>
          </div>
          <div className="form-group">
            <label>Number of Days *</label>
            <select name="totalDays" value={formData.totalDays} onChange={handleChange} required>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day} {day === 1 ? 'Day' : 'Days'}</option>
              ))}
            </select>
            <p className="form-hint">Dates will be automatically calculated from start date</p>
          </div>
        </div>

        <div className="form-section">
          <h2>Course Topics</h2>
          <p className="section-info">For each day, add topics with subtopics.</p>
          <div className="days-list">
            {formData.days.map((day, dayIndex) => (
              <div key={dayIndex} className="day-item">
                <div className="day-header" onClick={() => toggleDay(dayIndex)}>
                  <div>
                    <h3>Day {day.dayNumber}</h3>
                    <span className="day-date-display">{day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Date not set'}</span>
                    <span className="topic-count">{day.topics.length} topic{day.topics.length !== 1 ? 's' : ''}</span>
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
                            <button type="button" className="btn-remove" onClick={() => removeTopic(dayIndex, topicIndex)}>
                              <FiTrash2 /> Remove
                            </button>
                          </div>

                          <div className="form-group">
                            <label>Topic Name *</label>
                            <input type="text" value={topic.name} onChange={(e) => updateTopic(dayIndex, topicIndex, 'name', e.target.value)} placeholder="e.g., HTML, CSS, JavaScript" required />
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
                                <p className="no-subtopics">No subtopics yet.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button type="button" className="btn-add-topic" onClick={() => addTopic(dayIndex)}>
                      <FiPlus /> Add Topic
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/teacher/courses')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCourse;
