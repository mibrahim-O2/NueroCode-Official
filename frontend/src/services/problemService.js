import { apiClient } from './apiClient';

export const generateProblem = (topic, difficulty) =>
  apiClient.get(`/problems/generate?topic=${encodeURIComponent(topic)}&difficulty=${encodeURIComponent(difficulty)}`);