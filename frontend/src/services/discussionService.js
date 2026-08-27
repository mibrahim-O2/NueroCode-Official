import { apiClient } from './apiClient';

export const getDiscussions = (problemId) => apiClient.get(`/problems/${problemId}/discussions`);
export const postDiscussion = (problemId, comment) =>
  apiClient.post(`/problems/${problemId}/discussions`, { comment });