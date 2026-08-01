import { apiClient } from './apiClient';

export const getTestModeStatus = () => apiClient.get('/test-mode/status');

// Roadmap
export const unlockAllNodes = () => apiClient.post('/test-mode/roadmap/unlock-all', {});
export const completeRoadmapThrough = (position) =>
  apiClient.post('/test-mode/roadmap/complete-through', { position });
export const resetRoadmapTestMode = () => apiClient.post('/test-mode/roadmap/reset', {});
export const adjustUserStats = (xp, level, streak) =>
  apiClient.post('/test-mode/user/adjust-stats', { xp, level, streak });

// Practice
export const getInstantProblem = (topic, difficulty) =>
  apiClient.get(`/test-mode/practice/instant-problem?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`);
export const simulateSubmission = (topic, difficulty, language, outcome, persist) =>
  apiClient.post('/test-mode/practice/simulate-submission', { topic, difficulty, language, outcome, persist });

// Credentials
export const simulateCredential = (badgeLevel) =>
  apiClient.post('/test-mode/credentials/simulate', { badge_level: badgeLevel });
export const clearSimulatedCredentials = () => apiClient.post('/test-mode/credentials/clear-simulated', {});