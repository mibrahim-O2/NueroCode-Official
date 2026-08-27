import { apiClient } from './apiClient';

export const getMySubmissions = () => apiClient.get('/submissions/mine');
export const getComments = (submissionId) => apiClient.get(`/submissions/${submissionId}/comments`);
export const addComment = (submissionId, comment) =>
  apiClient.post(`/submissions/${submissionId}/comments`, { comment });