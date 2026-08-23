import { apiClient } from './apiClient';

export const generateProblem = (topic, difficulty, provider) => {
  const params = new URLSearchParams({ topic, difficulty });
  if (provider) params.set('provider', provider);
  return apiClient.get(`/problems/generate?${params.toString()}`);
};