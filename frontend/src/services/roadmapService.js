import { apiClient } from './apiClient';

export const getRoadmap = () => apiClient.get('/roadmap/');
export const getReviewDue = () => apiClient.get('/roadmap/review-due');
export const getTopicProgress = () => apiClient.get('/roadmap/topic-progress');
export const startNode = (nodeId) => apiClient.post(`/roadmap/${nodeId}/start`, {});
export const completeNode = (nodeId) => apiClient.post(`/roadmap/${nodeId}/complete`, {});
export const getLeaderboard = () => apiClient.get('/leaderboard/');
export const getRecommendation = () => apiClient.get('/recommendations/roadmap');
