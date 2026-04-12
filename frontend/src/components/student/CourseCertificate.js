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
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Poppins:wght@400;500;600;700&display=swap');

            @page {
              size: A4 portrait;
              margin: 0;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            html,
            body {
              width: 210mm;
              height: 297mm;
            }

            body {
              font-family: 'Poppins', sans-serif;
              background: #e5e7eb;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #0f172a;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            .certificate-container {
              position: relative;
              width: 210mm;
              height: 297mm;
              overflow: hidden;
              background: linear-gradient(180deg, #1e3a67 0%, #1e3a67 20%, #f8fafc 20%, #ffffff 100%);
              border: 3mm solid #c9a227;
              box-shadow: 0 8mm 20mm rgba(15, 23, 42, 0.25);
            }

            .cert-top-header {
              position: relative;
              height: 58mm;
              padding: 12mm 16mm 10mm;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              background: linear-gradient(135deg, #1f3b6b 0%, #24467b 55%, #1f3b6b 100%);
            }

            .header-content {
              text-align: center;
              z-index: 2;
            }

            .gold-corner-left,
            .gold-corner-right {
              position: absolute;
              width: 0;
              height: 0;
            }

            .gold-corner-left {
              top: 0;
              right: 0;
              border-top: 22mm solid #c9a227;
              border-left: 22mm solid transparent;
            }

            .gold-corner-right {
              bottom: 0;
              left: 0;
              border-bottom: 16mm solid #c9a227;
              border-right: 16mm solid transparent;
            }

            .cert-main-title {
              font-family: 'Playfair Display', serif;
              font-size: 16mm;
              letter-spacing: 1.8mm;
              color: #ffffff;
              line-height: 1;
              margin-bottom: 2mm;
            }

            .cert-subtitle {
              color: #d9bb63;
              font-size: 5mm;
              letter-spacing: 1.5mm;
              font-weight: 600;
            }

            .cert-main-content {
              position: relative;
              height: calc(100% - 58mm);
              padding: 26mm 16mm 14mm;
              text-align: center;
            }

            .cert-seal {
              position: absolute;
              top: -12mm;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              flex-direction: column;
              align-items: center;
              z-index: 4;
            }

            .seal-inner {
              width: 24mm;
              height: 24mm;
              border-radius: 50%;
              border: 1.2mm solid #173761;
              background: radial-gradient(circle at 35% 30%, #f1d57b 0%, #c9a227 70%, #aa8310 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2mm 5mm rgba(0, 0, 0, 0.22);
            }

            .seal-icon {
              font-size: 10mm;
            }

            .seal-ribbon-left,
            .seal-ribbon-right {
              width: 0;
              height: 0;
              border-left: 4mm solid transparent;
              border-right: 4mm solid transparent;
              border-top: 7mm solid #1f3d6c;
              margin-top: -1mm;
            }

            .seal-ribbon-left {
              position: absolute;
              left: -8mm;
              top: 20mm;
            }

            .seal-ribbon-right {
              position: absolute;
              right: -8mm;
              top: 20mm;
            }

            .presented-text {
              font-size: 3.6mm;
              letter-spacing: 1.1mm;
              font-weight: 600;
              color: #64748b;
              margin-top: 6mm;
            }

            .recipient-name {
              margin-top: 4mm;
              font-family: 'Playfair Display', serif;
              font-size: 11.5mm;
              color: #1e3a67;
              line-height: 1.15;
            }

            .gold-line {
              width: 88mm;
              height: 0.8mm;
              margin: 5mm auto 7mm;
              background: linear-gradient(90deg, transparent, #d6b451, transparent);
            }

            .course-label {
              font-size: 3.2mm;
              letter-spacing: 0.85mm;
              font-weight: 600;
              color: #64748b;
            }

            .course-title-cert {
              margin-top: 3.2mm;
              font-family: 'Playfair Display', serif;
              color: #c9a227;
              font-size: 9mm;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5mm;
              line-height: 1.15;
            }

            .description-text {
              margin: 7mm auto 0;
              max-width: 156mm;
              font-size: 3.6mm;
              line-height: 1.8;
              color: #334155;
            }

            .description-text strong {
              color: #1e3a67;
              font-weight: 700;
            }

            .cert-footer-section {
              position: absolute;
              left: 14mm;
              right: 14mm;
              bottom: 16mm;
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 8mm;
            }

            .footer-left,
            .footer-right {
              width: 60mm;
              text-align: center;
            }

            .footer-center {
              flex: 1;
              text-align: center;
              margin-bottom: 2mm;
            }

            .signature-line-gold {
              width: 45mm;
              height: 0.55mm;
              background: #c9a227;
              margin: 0 auto 2.4mm;
            }

            .footer-label {
              font-size: 2.8mm;
              letter-spacing: 0.55mm;
              color: #64748b;
              font-weight: 600;
            }

            .footer-value {
              margin-top: 1.4mm;
              font-size: 3.4mm;
              color: #1e3a67;
              font-weight: 700;
            }

            .footer-sublabel {
              margin-top: 1mm;
              font-size: 2.7mm;
              color: #64748b;
            }

            .cert-number-footer,
            .verification-footer {
              font-family: 'Courier New', monospace;
              color: #475569;
            }

            .cert-number-footer {
              font-size: 2.9mm;
              margin-bottom: 1.3mm;
            }

            .verification-footer {
              font-size: 2.7mm;
            }

            .cert-bottom-accent {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 4mm;
              background: linear-gradient(90deg, #1f3d6c 0%, #c9a227 45%, #1f3d6c 100%);
            }

            @media print {
              html,
              body {
                background: #ffffff;
              }

              .certificate-container {
                box-shadow: none;
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

              <div className={`requirement ${(eligibility.meetsEvaluationAttendanceRequirement ?? eligibility.attendancePercentage >= 75) ? 'met' : 'not-met'}`}>
                <span className="icon">{(eligibility.meetsEvaluationAttendanceRequirement ?? eligibility.attendancePercentage >= 75) ? '✓' : '○'}</span>
                <div className="requirement-details">
                  <span className="requirement-title">Attendance ≥ 75%</span>
                  <span className="requirement-status">
                    {eligibility.attendancePercentage}% (
                    {typeof eligibility.attendedDays === 'number' ? eligibility.attendedDays : '—'} present
                    {typeof eligibility.attendanceScheduledDays === 'number'
                      ? ` of ${eligibility.attendanceScheduledDays} scheduled days)`
                      : ` of ${eligibility.totalDays ?? '?'} days)`}
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
             (eligibility.meetsEvaluationAttendanceRequirement ?? eligibility.attendancePercentage >= 75) && 
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

            {eligibility.isCourseCompleted &&
             !(eligibility.meetsEvaluationAttendanceRequirement ?? eligibility.attendancePercentage >= 75) && (
              <div className="warning-message">
                <p>
                  Your attendance ({eligibility.attendancePercentage}%) is below the required 75%. Complete more
                  attended days or contact your instructor. Certificates require at least 75% attendance, plus
                  daily feedback, overall feedback, and a fully completed course.
                </p>
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
