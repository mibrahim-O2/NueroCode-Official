import { apiClient } from './apiClient';

export const checkCameraFrame = (frameBase64) =>
  apiClient.post('/proctoring/camera-check', { frame: frameBase64 });

export const checkKeystrokeRhythm = (intervalsMs) =>
  apiClient.post('/proctoring/keystroke-check', { intervals_ms: intervalsMs });