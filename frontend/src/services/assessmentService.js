import { apiClient } from './apiClient';

export const getAvailableClusters = () => apiClient.get('/assessments/available-clusters');

export const startAssessment = (clusterName) =>
  apiClient.post('/assessments/start', { cluster_name: clusterName });

export const submitAssessment = (assessmentId, language, sourceCode) =>
  apiClient.post(`/assessments/${assessmentId}/submit`, {
    language,
    source_code: sourceCode,
    // integrity_score is intentionally NOT sent. The backend ignores any
    // client-supplied value and computes the authoritative integrity
    // score server-side from the persisted proctoring_logs rows.
  });

export const logProctoringEvent = (assessmentId, eventType, severity, metadata) =>
  apiClient.post(`/assessments/${assessmentId}/proctoring-log`, {
    event_type: eventType,
    severity,
    metadata,
  });