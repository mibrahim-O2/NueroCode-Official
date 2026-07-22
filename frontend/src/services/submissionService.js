import { apiClient } from './apiClient';

export const submitCode = (problemId, language, sourceCode) =>
  apiClient.post('/submissions/execute', {
    problem_id: problemId,
    language,
    source_code: sourceCode,
  });