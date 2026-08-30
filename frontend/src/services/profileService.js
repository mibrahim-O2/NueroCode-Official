import { apiClient } from './apiClient';

export const updateProfile = (updates) => apiClient.patch('/profile/me', updates);
export const updatePreferences = (preferences) => apiClient.patch('/profile/me/preferences', { preferences });