import { apiClient } from './apiClient';

export const getAvailableClusters = () => apiClient.get('/assessments/available-clusters');

export const startAssessment = (clusterName) =>
  apiClient.post('/assessments/start', { cluster_name: clusterName });

export const submitAssessment = (assessmentId, language, sourceCode, integrityScore) =>
  apiClient.post(`/assessments/${assessmentId}/submit`, {
    language,
    source_code: sourceCode,
    integrity_score: integrityScore,
  });

export const logProctoringEvent = (assessmentId, eventType, severity, metadata) =>
  apiClient.post(`/assessments/${assessmentId}/proctoring-log`, {
    event_type: eventType,
    severity,
    metadata,
  });