import { apiClient } from './apiClient';

export const getMyCredentials = () => apiClient.get('/credentials/mine');
export const getPublicCredential = (uuid) => apiClient.get(`/verify/${uuid}`);