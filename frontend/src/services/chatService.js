import { apiClient } from './apiClient';

export const askChatbot = (message, topic) =>
  apiClient.post('/chatbot/', { message, topic, mode: 'practice' });