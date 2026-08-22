import { apiClient } from './apiClient';

export const getCohortOverview = () => apiClient.get('/admin/cohort-overview');
export const getStudentTimeline = (userId) => apiClient.get(`/admin/students/${userId}/timeline`);
export const getSkillGaps = () => apiClient.get('/admin/analytics/skill-gaps');
export const getIntegrityFlags = () => apiClient.get('/admin/analytics/integrity-flags');
export const getClassLeaderboard = () => apiClient.get('/admin/analytics/leaderboard');
export const getAllUsers = () => apiClient.get('/admin/users');
export const updateUserRole = (userId, role, reason) => apiClient.patch(`/admin/users/${userId}/role`, { role, reason });
export const getAllCredentialsAdmin = () => apiClient.get('/admin/credentials');
export const getAuditLogs = () => apiClient.get('/admin/audit-logs');

export const resetDashboard = (userId, reason) => apiClient.post(`/admin/students/${userId}/reset/dashboard`, { reason });
export const resetRoadmapModule = (userId, reason) => apiClient.post(`/admin/students/${userId}/reset/roadmap`, { reason });
export const resetPractice = (userId, reason) => apiClient.post(`/admin/students/${userId}/reset/practice`, { reason });
export const resetAssessments = (userId, reason) => apiClient.post(`/admin/students/${userId}/reset/assessments`, { reason });
export const resetCredentialsModule = (userId, reason) => apiClient.post(`/admin/students/${userId}/reset/credentials`, { reason });
export const resetFullStudent = (userId, reason) => apiClient.post(`/admin/students/${userId}/reset/full`, { reason });