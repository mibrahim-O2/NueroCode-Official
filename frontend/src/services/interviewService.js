import { apiClient } from './apiClient';

export const startInterview = (topic, difficulty) => apiClient.post('/interviews/start', { topic, difficulty });
export const submitInterview = (sessionId, language, sourceCode) =>
  apiClient.post(`/interviews/${sessionId}/submit`, { language, source_code: sourceCode });
export const getInterviewHistory = () => apiClient.get('/interviews/mine');