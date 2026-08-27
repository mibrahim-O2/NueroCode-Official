import { apiClient } from './apiClient';

export const getOfficialSolution = (problemId) => apiClient.get(`/problems/${problemId}/solution`);