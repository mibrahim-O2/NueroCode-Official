import { apiClient } from './apiClient';

export const getCohortOverview = () => apiClient.get('/admin/cohort-overview');
export const getStudentTimeline = (userId) => apiClient.get(`/admin/students/${userId}/timeline`);
export const getSkillGaps = () => apiClient.get('/admin/analytics/skill-gaps');
export const getIntegrityFlags = () => apiClient.get('/admin/analytics/integrity-flags');
export const getClassLeaderboard = () => apiClient.get('/admin/analytics/leaderboard');
export const getAllUsers = () => apiClient.get('/admin/users');
export const updateUserRole = (userId, role) => apiClient.patch(`/admin/users/${userId}/role`, { role });
export const getAllCredentialsAdmin = () => apiClient.get('/admin/credentials');
export const resetStudentRoadmap = (userId) => apiClient.post(`/admin/students/${userId}/reset-roadmap`, {});