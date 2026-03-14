// Fake ML model module for report insights.
// This file is intentionally lightweight and explainable for demo/review purposes.

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const round1 = (value) => Math.round(value * 10) / 10;

class ReportInsightModel {
  // Simulated classification benchmark for model comparison cards.
  // Not a trained model; deterministic output based on data volume and consistency.
  static estimateModelAccuracy({ totalEvaluations = 0, totalDayRatings = 0, averageQuestionRating = 0, averageDayRating = 0 } = {}) {
    const dataSignal = Math.min(1, (totalEvaluations + totalDayRatings) / 250);
    const qualitySignal = ((averageQuestionRating || 0) + (averageDayRating || 0)) / 10;

    const svm = clamp(71 + (dataSignal * 17) + (qualitySignal * 8), 70, 96);
    const naiveBayes = clamp(67 + (dataSignal * 15) + (qualitySignal * 7), 65, 93);

    return {
      svm: round1(svm),
      naiveBayes: round1(naiveBayes),
      note: 'Simulated benchmark for presentation only'
    };
  }

  // Pie-chart friendly sentiment classification from a 1-5 score.
  static sentimentLabel(score) {
    if (score >= 4) return 'satisfied';
    if (score === 3) return 'neutral';
    return 'dissatisfied';
  }

  // Converts raw sentiment counts to percentages for chart rendering.
  static sentimentPercentages({ satisfied = 0, neutral = 0, dissatisfied = 0 } = {}) {
    const total = satisfied + neutral + dissatisfied;
    if (!total) {
      return {
        total: 0,
        satisfied: 0,
        neutral: 0,
        dissatisfied: 0
      };
    }

    return {
      total,
      satisfied: Math.round((satisfied / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      dissatisfied: Math.round((dissatisfied / total) * 100)
    };
  }
}

module.exports = ReportInsightModel;
