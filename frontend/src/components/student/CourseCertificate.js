import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './CourseCertificate.css';

const CourseCertificate = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  
  const [eligibility, setEligibility] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const [surveyData, setSurveyData] = useState({
    overallSatisfaction: 5,
    contentQuality: 5,
    teachingEffectiveness: 5,
    courseMaterialQuality: 5,
    practicalApplication: 5,
    difficultyLevel: 'appropriate',
    whatYouLearned: '',
    improvements: '',
    recommendToOthers: true,
    additionalComments: ''
  });

  useEffect(() => {
    fetchEligibility();
  }, [courseId]);

  const fetchEligibility = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/certificates/eligibility/${courseId}`);
      setEligibility(response.data);
      
      if (response.data.certificateIssued) {
        // Fetch existing certificate
        const certResponse = await api.post(`/certificates/generate/${courseId}`);
        setCertificate(certResponse.data.certificate);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const handleSurveyChange = (field, value) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const submitSurvey = async () => {
    try {
      if (surveyData.whatYouLearned.length < 20) {
        setError('Please provide more detail about what you learned (minimum 20 characters)');
        return;
      }
      if (surveyData.improvements.length < 20) {
        setError('Please provide more detail about improvements (minimum 20 characters)');
        return;
      }

      setGenerating(true);
      await api.post(`/certificates/survey/${courseId}`, surveyData);
      setShowSurvey(false);
      await fetchEligibility();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit survey');
    } finally {
      setGenerating(false);
    }
  };

  const generateCertificate = async () => {
    try {
      setGenerating(true);
      const response = await api.post(`/certificates/generate/${courseId}`);
      setCertificate(response.data.certificate);
      await fetchEligibility();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCertificate = () => {
    const printContent = certificateRef.current;
    const WinPrint = window.open('', '', 'width=1200,height=1000');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Certificate - ${certificate.courseName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Great+Vibes&display=swap');

            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              margin: 0;
              padding: 40px;
              font-family: 'Georgia', serif;
              background: #f0f0f0;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
            }

            .certificate-container {
              position: relative;
              width: 900px;
              background: linear-gradient(180deg, #1a365d 0%, #1a365d 35%, #f5f5f5 35%, #ffffff 100%);
              box-shadow: 0 0 0 4px #c9a227, 0 20px 60px rgba(0,0,0,0.3);
              overflow: visible;
              min-height: auto;
            }

            .cert-top-section {
              position: relative;
              padding: 50px 40px 90px;
              text-align: center;
              background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 50%, #1a365d 100%);
            }

            .gold-corner-left {
              position: absolute;
              top: 0;
              right: 0;
              width: 0;
              height: 0;
              border-top: 100px solid #c9a227;
              border-left: 100px solid transparent;
            }

            .gold-corner-right {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 0;
              height: 0;
              border-bottom: 70px solid #c9a227;
              border-right: 70px solid transparent;
            }

            .cert-main-title {
              font-family: 'Playfair Display', 'Georgia', serif;
              font-size: 60px;
              font-weight: 400;
              letter-spacing: 15px;
              color: #ffffff;
              margin: 0;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }

            .cert-subtitle {
              font-family: 'Georgia', serif;
              font-size: 22px;
              letter-spacing: 10px;
              color: #c9a227;
              margin: 12px 0 0;
            }

            .cert-seal {
              position: absolute;
              bottom: -55px;
              left: 50%;
              transform: translateX(-50%);
              z-index: 10;
            }

            .seal-inner {
              width: 110px;
              height: 110px;
              background: linear-gradient(145deg, #d4af37 0%, #c9a227 50%, #b8860b 100%);
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.3);
              border: 5px solid #1a365d;
            }

            .seal-year {
              font-family: 'Georgia', serif;
              font-size: 24px;
              font-weight: bold;
              color: #1a365d;
            }

            .seal-text {
              font-size: 12px;
              font-weight: bold;
              letter-spacing: 3px;
              color: #1a365d;
            }

            .cert-main-section {
              position: relative;
              padding: 80px 60px 50px;
              text-align: center;
              background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
            }

            .blue-triangle-left {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 0;
              height: 0;
              border-bottom: 180px solid #1a365d;
              border-right: 180px solid transparent;
            }

            .blue-triangle-right {
              position: absolute;
              bottom: 0;
              right: 0;
              width: 0;
              height: 0;
              border-bottom: 180px solid #1a365d;
              border-left: 180px solid transparent;
            }

            .presented-text {
              font-family: 'Georgia', serif;
              font-size: 16px;
              letter-spacing: 5px;
              color: #718096;
              margin: 0 0 20px;
              text-transform: uppercase;
            }

            .recipient-name {
              font-family: 'Great Vibes', 'Brush Script MT', cursive;
              font-size: 62px;
              color: #1a365d;
              margin: 0;
              font-weight: normal;
            }

            .gold-line {
              width: 350px;
              height: 3px;
              background: linear-gradient(90deg, transparent, #c9a227, transparent);
              margin: 20px auto 30px;
            }

            .course-label {
              font-size: 13px;
              letter-spacing: 4px;
              color: #718096;
              margin: 0 0 12px;
              text-transform: uppercase;
            }

            .course-title-cert {
              font-family: 'Playfair Display', 'Georgia', serif;
              font-size: 36px;
              color: #c9a227;
              margin: 0 0 25px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 3px;
            }

            .description-text {
              font-size: 15px;
              color: #4a5568;
              line-height: 1.9;
              max-width: 650px;
              margin: 0 auto 35px;
            }

            .cert-footer-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding: 35px 30px 70px;
              position: relative;
              z-index: 5;
            }

            .footer-left, .footer-right {
              width: 220px;
            }

            .footer-right {
              display: none;
            }

            .footer-center {
              text-align: center;
            }

            .signature-line-gold {
              width: 170px;
              height: 2px;
              background: #c9a227;
              margin: 0 auto 12px;
            }

            .footer-label {
              font-size: 12px;
              letter-spacing: 3px;
              color: #718096;
              margin: 0;
              text-transform: uppercase;
            }

            .footer-value {
              font-size: 15px;
              color: #1a365d;
              font-weight: 600;
              margin: 6px 0 0;
            }

            .footer-sublabel {
              font-size: 12px;
              color: #718096;
              margin: 3px 0 0;
            }

            .certificate-badge {
              width: 55px;
              height: 55px;
              background: linear-gradient(145deg, #d4af37 0%, #c9a227 50%, #b8860b 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            .badge-icon {
              font-size: 28px;
            }

            .cert-number-footer {
              font-size: 12px;
              color: #4a5568;
              margin: 6px 0;
              font-family: 'Courier New', monospace;
            }

            .verification-footer {
              font-size: 11px;
              color: #718096;
              margin: 0;
              font-family: 'Courier New', monospace;
            }

            @media print {
              body {
                padding: 0;
                background: white;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              .certificate-container {
                box-shadow: 0 0 0 4px #c9a227;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
    }, 500);
  };

  return (
    <div className="certificate-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back to Course
      </button>

      <h1>Course Completion Certificate</h1>

      {error && <div className="error-message">{error}</div>}

      {eligibility && !certificate && (
        <div className="eligibility-section">
          <div className="eligibility-card">
            <h2>{eligibility.courseName}</h2>
            <p className="teacher-name">Instructor: {eligibility.teacherName}</p>

            <div className="eligibility-checklist">
              <h3>Certificate Requirements</h3>
              
              <div className={`requirement ${eligibility.isCourseCompleted ? 'met' : 'not-met'}`}>
                <span className="icon">{eligibility.isCourseCompleted ? '✓' : '○'}</span>
                <div className="requirement-details">
                  <span className="requirement-title">Course Completed</span>
                  <span className="requirement-status">
                    {eligibility.completedDays}/{eligibility.totalDays} days completed
                  </span>
                </div>
              </div>

              <div className={`requirement ${eligibility.meetsAttendanceRequirement ? 'met' : 'not-met'}`}>
                <span className="icon">{eligibility.meetsAttendanceRequirement ? '✓' : '○'}</span>
                <div className="requirement-details">
                  <span className="requirement-title">Attendance ≥ 50%</span>
                  <span className="requirement-status">
                    {eligibility.attendancePercentage}% ({eligibility.attendedDays}/{eligibility.completedDays} days)
                  </span>
                </div>
              </div>

              <div className={`requirement ${!eligibility.hasPendingReviews ? 'met' : 'not-met'}`}>
                <span className="icon">{!eligibility.hasPendingReviews ? '✓' : '○'}</span>
                <div className="requirement-details">
                  <span className="requirement-title">All Reviews Completed</span>
                  <span className="requirement-status">
                    {eligibility.hasPendingReviews 
                      ? `${eligibility.pendingReviews.length} pending` 
                      : 'All reviews submitted'}
                  </span>
                </div>
              </div>

              <div className={`requirement ${eligibility.surveySubmitted ? 'met' : 'not-met'}`}>
                <span className="icon">{eligibility.surveySubmitted ? '✓' : '○'}</span>
                <div className="requirement-details">
                  <span className="requirement-title">Course Evaluation</span>
                  <span className="requirement-status">
                    {eligibility.surveySubmitted ? 'Completed' : 'Not submitted'}
                  </span>
                </div>
              </div>
            </div>

            {eligibility.hasPendingReviews && (
              <div className="pending-reviews">
                <h4>⚠️ Pending Day Reviews</h4>
                <ul>
                  {eligibility.pendingReviews.map((review, index) => (
                    <li key={index}>{review.message}</li>
                  ))}
                </ul>
                <button 
                  className="btn-primary"
                  onClick={() => navigate(`/student/courses/${courseId}`)}
                >
                  Complete Day Reviews
                </button>
              </div>
            )}

            {!eligibility.hasPendingReviews && 
             eligibility.isCourseCompleted && 
             eligibility.meetsAttendanceRequirement && 
             !eligibility.surveySubmitted && (
              <button 
                className="btn-primary btn-large"
                onClick={() => navigate(`/student/evaluation/${courseId}`)}
              >
                📝 Submit Course Evaluation
              </button>
            )}

            {eligibility.canDownloadCertificate && !certificate && (
              <button 
                className="btn-success btn-large"
                onClick={generateCertificate}
                disabled={generating}
              >
                {generating ? 'Generating...' : '🎓 Generate Certificate'}
              </button>
            )}

            {!eligibility.isCourseCompleted && (
              <div className="info-message">
                <p>The course is not yet completed. Please wait for the instructor to complete all scheduled days.</p>
              </div>
            )}

            {!eligibility.meetsAttendanceRequirement && eligibility.isCourseCompleted && (
              <div className="warning-message">
                <p>Your attendance ({eligibility.attendancePercentage}%) is below the required 50%. Unfortunately, you are not eligible for a certificate.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showSurvey && (
        <div className="survey-modal-overlay">
          <div className="survey-modal">
            <h2>📋 Course Completion Survey</h2>
            <p className="survey-intro">
              Your feedback helps us improve. Please answer all questions honestly.
            </p>

            <div className="survey-form">
              <div className="rating-group">
                <label>Overall Satisfaction</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star}
                      className={`star ${surveyData.overallSatisfaction >= star ? 'filled' : ''}`}
                      onClick={() => handleSurveyChange('overallSatisfaction', star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="rating-group">
                <label>Content Quality</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star}
                      className={`star ${surveyData.contentQuality >= star ? 'filled' : ''}`}
                      onClick={() => handleSurveyChange('contentQuality', star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="rating-group">
                <label>Teaching Effectiveness</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star}
                      className={`star ${surveyData.teachingEffectiveness >= star ? 'filled' : ''}`}
                      onClick={() => handleSurveyChange('teachingEffectiveness', star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="rating-group">
                <label>Course Material Quality</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star}
                      className={`star ${surveyData.courseMaterialQuality >= star ? 'filled' : ''}`}
                      onClick={() => handleSurveyChange('courseMaterialQuality', star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="rating-group">
                <label>Practical Application</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star}
                      className={`star ${surveyData.practicalApplication >= star ? 'filled' : ''}`}
                      onClick={() => handleSurveyChange('practicalApplication', star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Difficulty Level</label>
                <select 
                  value={surveyData.difficultyLevel}
                  onChange={(e) => handleSurveyChange('difficultyLevel', e.target.value)}
                >
                  <option value="too_easy">Too Easy</option>
                  <option value="easy">Easy</option>
                  <option value="appropriate">Appropriate</option>
                  <option value="challenging">Challenging</option>
                  <option value="too_difficult">Too Difficult</option>
                </select>
              </div>

              <div className="form-group">
                <label>What did you learn from this course? *</label>
                <textarea
                  value={surveyData.whatYouLearned}
                  onChange={(e) => handleSurveyChange('whatYouLearned', e.target.value)}
                  placeholder="Describe the key learnings from this course (minimum 20 characters)..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>What improvements would you suggest? *</label>
                <textarea
                  value={surveyData.improvements}
                  onChange={(e) => handleSurveyChange('improvements', e.target.value)}
                  placeholder="Share your suggestions for course improvement (minimum 20 characters)..."
                  rows={4}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={surveyData.recommendToOthers}
                    onChange={(e) => handleSurveyChange('recommendToOthers', e.target.checked)}
                  />
                  I would recommend this course to others
                </label>
              </div>

              <div className="form-group">
                <label>Additional Comments (Optional)</label>
                <textarea
                  value={surveyData.additionalComments}
                  onChange={(e) => handleSurveyChange('additionalComments', e.target.value)}
                  placeholder="Any other feedback..."
                  rows={3}
                />
              </div>

              <div className="survey-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowSurvey(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={submitSurvey}
                  disabled={generating}
                >
                  {generating ? 'Submitting...' : 'Submit Survey'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {certificate && (
        <div className="certificate-section">
          <div className="certificate-preview" ref={certificateRef}>
            <div className="certificate-container">
              {/* Top Blue Header */}
              <div className="cert-top-header">
                <div className="gold-corner-left"></div>
                <div className="header-content">
                  <h1 className="cert-main-title">CERTIFICATE</h1>
                  <p className="cert-subtitle">OF COMPLETION</p>
                </div>
                <div className="gold-corner-right"></div>
              </div>

              {/* Main Content Area */}
              <div className="cert-main-content">
                {/* Seal */}
                <div className="cert-seal">
                  <div className="seal-inner">
                    <span className="seal-icon">🎓</span>
                  </div>
                  <div className="seal-ribbon-left"></div>
                  <div className="seal-ribbon-right"></div>
                </div>

                <p className="presented-text">PROUDLY PRESENTED TO</p>
                <h2 className="recipient-name">{certificate.studentName}</h2>
                <div className="gold-line"></div>
                
                <p className="course-label">FOR SUCCESSFULLY COMPLETING</p>
                <h3 className="course-title-cert">{certificate.courseName}</h3>
                
                <p className="description-text">
                  This certifies that the above named individual has successfully completed 
                  the training program with <strong>{certificate.completionStats.attendancePercentage}%</strong> attendance 
                  ({certificate.completionStats.attendedDays} of {certificate.completionStats.totalDays} days)
                  under the guidance of <strong>{certificate.teacherName}</strong>.
                </p>

                <div className="cert-footer-section">
                  <div className="footer-left">
                    <div className="signature-line-gold"></div>
                    <p className="footer-label">DATE</p>
                    <p className="footer-value">{new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                  
                  <div className="footer-center">
                    <p className="cert-number-footer">Certificate No: {certificate.certificateNumber}</p>
                    <p className="verification-footer">Verify: {certificate.verificationCode}</p>
                  </div>

                  <div className="footer-right">
                    <div className="signature-line-gold"></div>
                    <p className="footer-label">SIGNATURE</p>
                    <p className="footer-value">{certificate.teacherName}</p>
                    <p className="footer-sublabel">Course Instructor</p>
                  </div>
                </div>
              </div>

              {/* Bottom Gold Accent */}
              <div className="cert-bottom-accent"></div>
            </div>
          </div>

          <div className="certificate-actions">
            <button className="btn-download" onClick={downloadCertificate}>
              📥 Download Certificate
            </button>
            <button className="btn-share" onClick={() => window.print()}>
              🖨️ Print Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCertificate;
