import { apiClient } from './apiClient';

export const getRoadmap = () => apiClient.get('/roadmap/');
export const startNode = (nodeId) => apiClient.post(`/roadmap/${nodeId}/start`, {});
export const completeNode = (nodeId) => apiClient.post(`/roadmap/${nodeId}/complete`, {});
export const getLeaderboard = () => apiClient.get('/leaderboard/');