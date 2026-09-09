import { apiClient } from '@/services/apiClient';

// apiClient.get / apiClient.post return the parsed JSON body directly
// (see services/apiClient.js) — there is no axios-style { data } wrapper.

export const challengeService = {
  /**
   * Fetch the student's challenge session for a roadmap node, generating a
   * fresh 10-problem pool (4 easy / 4 medium / 2 hard) if none exists.
   * Returns { challenge, practice_count, practice_threshold, is_capable }.
   * @param {string} nodeId  UUID of the target roadmap node
   * @param {string} [provider]  optional AI provider override (admin-gated server-side)
   */
  async getChallenge(nodeId, provider) {
    const params = new URLSearchParams();
    if (provider) params.set('provider', provider);
    const qs = params.toString();
    return await apiClient.get(`/challenges/${nodeId}${qs ? `?${qs}` : ''}`);
  },

  /**
   * Grade one question in the pool.
   * @param {string} nodeId
   * @param {Object} payload  { question_index: number, code: string, language: string }
   * Returns { passed, passed_count, total_count, results, question_index,
   *           solved_count, total_questions, all_completed, score, status, node_completion }.
   */
  async submitChallengeQuestion(nodeId, payload) {
    return await apiClient.post(`/challenges/${nodeId}/submit-question`, payload);
  },

  /**
   * The single challenge session for this node, wrapped as { challenges: [...] }.
   */
  async getChallengeHistory(nodeId) {
    return await apiClient.get(`/challenges/${nodeId}/history`);
  },
};

export default challengeService;
