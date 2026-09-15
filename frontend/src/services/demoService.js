import { apiClient } from './apiClient';

// Demo Mode API client — same shape as the other service files. Every call
// here goes to /demo/*, which the backend restricts to the project owner
// (OWNER_EMAIL) on every route. Pages branch between these functions and
// the real service functions on DemoModeContext's demoModeEnabled; only the
// data source changes, never the component rendering it.

const seg = encodeURIComponent;

// --- Access ---------------------------------------------------------------
export const getDemoStatus = () => apiClient.get('/demo/status');
export const verifyDemoPasscode = (passcode) => apiClient.post('/demo/verify-passcode', { passcode });
export const toggleDemoMode = (enabled) => apiClient.post('/demo/toggle', { enabled });
export const exitDemoMode = () => apiClient.post('/demo/exit', {});
// scope: dashboard | roadmap | practice | challenge | interview | submissions | assessment | credentials | cohort
export const resetDemoScope = (scope) => apiClient.post(`/demo/${seg(scope)}/reset`, {});

// --- Dashboard --------------------------------------------------------------
export const getDemoDashboardCharts = () => apiClient.get('/demo/dashboard/charts');

// --- Roadmap (demo nodes are addressed by topic name, not UUID) --------------
export const getDemoRoadmap = () => apiClient.get('/demo/roadmap');
export const getDemoTopicProgress = () => apiClient.get('/demo/roadmap/topic-progress');
export const startDemoTopic = (topic) => apiClient.post(`/demo/roadmap/${seg(topic)}/start`, {});
export const completeDemoTopic = (topic) => apiClient.post(`/demo/roadmap/${seg(topic)}/complete`, {});

// --- Practice + discussions -------------------------------------------------
export const getDemoPracticeCatalog = () => apiClient.get('/demo/practice');
export const getDemoPracticeProblem = (problemKey) => apiClient.get(`/demo/practice/${seg(problemKey)}`);
export const submitDemoPractice = (problemKey, language, sourceCode) =>
  apiClient.post('/demo/practice/submit', { problem_key: problemKey, language, source_code: sourceCode });
export const getDemoDiscussions = (problemKey) => apiClient.get(`/demo/discussions/${seg(problemKey)}`);
export const postDemoDiscussion = (problemKey, comment) =>
  apiClient.post(`/demo/discussions/${seg(problemKey)}`, { comment });

// --- Challenge Gate -----------------------------------------------------------
export const getDemoChallenge = (nodeKey) => apiClient.get(`/demo/challenge/${seg(nodeKey)}`);
export const submitDemoChallengeQuestion = (nodeKey, payload) =>
  apiClient.post('/demo/challenge/submit-question', { node_key: nodeKey, ...payload });

// --- Mock Interview -----------------------------------------------------------
export const startDemoInterview = (topic) => apiClient.post('/demo/interview/start', { topic });
export const submitDemoInterview = (sessionId, language, sourceCode) =>
  apiClient.post(`/demo/interview/${seg(sessionId)}/submit`, { language, source_code: sourceCode });

// --- Assessments + proctoring -----------------------------------------------
export const getDemoAssessments = () => apiClient.get('/demo/assessments');
export const startDemoAssessment = (assessmentKey) => apiClient.post(`/demo/assessments/${seg(assessmentKey)}/start`, {});
// No integrity score is ever sent: the backend recomputes it from the
// persisted demo proctoring logs, exactly like the real assessment.
export const submitDemoAssessment = (attemptId, language, solutions) =>
  apiClient.post(`/demo/assessments/${seg(attemptId)}/submit`, { language, solutions });
export const logDemoProctoringEvent = (attemptId, eventType, severity) =>
  apiClient.post(`/demo/assessments/${seg(attemptId)}/proctoring-log`, { event_type: eventType, severity });

// --- Credentials --------------------------------------------------------------
export const getDemoCredentials = () => apiClient.get('/demo/credentials');
export const issueDemoCredential = (badgeLevel, assessmentKey) =>
  apiClient.post('/demo/credentials/issue', { badge_level: badgeLevel, assessment_key: assessmentKey });
export const getDemoVerificationNotice = (uuid) => apiClient.get(`/demo/verify/${seg(uuid)}`);
// Demo credentials must NEVER link to the real /verify page — their QR codes
// and share links always point at the demo notice page instead.
export const buildDemoVerifyUrl = (verifyUuid) => `${window.location.origin}/demo/verify/${verifyUuid}`;

// --- My Submissions + teacher comments --------------------------------------
export const getDemoMySubmissions = () => apiClient.get('/demo/submissions/mine');
export const getDemoSubmissionComments = (submissionId) =>
  apiClient.get(`/demo/submissions/${seg(submissionId)}/comments`);
export const addDemoSubmissionComment = (submissionId, comment) =>
  apiClient.post(`/demo/submissions/${seg(submissionId)}/comments`, { comment });

// --- Demo cohort ----------------------------------------------------------------
export const getDemoCohortOverview = () => apiClient.get('/demo/cohort/overview');
export const getDemoCohortLeaderboard = () => apiClient.get('/demo/cohort/leaderboard');
export const getDemoStudentTimeline = (studentId) => apiClient.get(`/demo/cohort/students/${seg(studentId)}/timeline`);
