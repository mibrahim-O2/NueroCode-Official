// src/services/challengeService.js
import { apiClient } from '@/services/apiClient';

export const challengeService = {
  /**
   * Fetch active challenge session or generate a new 25-problem set for a roadmap node
   * @param {string} nodeId - UUID of the target roadmap node
   * @param {string} [provider='gemini'] - AI provider identifier
   */
  async getChallenge(nodeId, provider = 'gemini') {
    const response = await apiClient.get(`/challenges/${nodeId}`, {
      params: { provider },
    });
    return response.data;
  },

  /**
   * Submit and evaluate code for an individual question in the challenge pool (1–25)
   * @param {string} nodeId - UUID of the target roadmap node
   * @param {Object} payload - { question_index: number, code: string, language: string }
   */
  async submitChallengeQuestion(nodeId, payload) {
    const response = await apiClient.post(`/challenges/${nodeId}/submit-question`, payload);
    return response.data;
  },

  /**
   * Submit entire challenge batch (legacy/fallback checkpoint submit)
   * @param {string} nodeId - UUID of the target roadmap node
   * @param {Object} payload - { code: string, language: string }
   */
  async submitChallenge(nodeId, payload) {
    const response = await apiClient.post(`/challenges/${nodeId}/submit`, payload);
    return response.data;
  },

  /**
   * Get challenge attempt history and mastery state for the target node
   * @param {string} nodeId - UUID of the target roadmap node
   */
  async getChallengeHistory(nodeId) {
    const response = await apiClient.get(`/challenges/${nodeId}/history`);
    return response.data;
  },
};

export default challengeService;
