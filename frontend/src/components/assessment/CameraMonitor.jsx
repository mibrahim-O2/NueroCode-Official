import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { checkCameraFrame } from '@/services/proctoringService';

const CHECK_INTERVAL_MS = 5000;

export default function CameraMonitor({ onAlert }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('requesting'); // requesting | active | denied

  useEffect(() => {
    let stream;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 240, height: 180 } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setStatus('active');
      })
      .catch(() => setStatus('denied'));

    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const hasAlertedDenied = useRef(false);

  useEffect(() => {
    if (status === 'denied' && !hasAlertedDenied.current) {
      hasAlertedDenied.current = true;
      onAlert({ reason: 'camera_denied' });
    }
    if (status === 'active') {
      // Permission was restored — allow a fresh alert if it's denied again later.
      hasAlertedDenied.current = false;
    }
  }, [status, onAlert]);

  const runCheck = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const frameBase64 = canvas.toDataURL('image/jpeg', 0.6);

    try {
      const result = await checkCameraFrame(frameBase64);
      if (result.alert) onAlert(result);
    } catch {
      // Non-critical — a failed check shouldn't disrupt the session
    }
  }, [onAlert]);

  useEffect(() => {
    if (status !== 'active') return undefined;
    const intervalId = setInterval(runCheck, CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [status, runCheck]);

  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-card p-3 shadow-card">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        {status === 'active' ? (
          <Camera className="h-3.5 w-3.5 text-status-success" />
        ) : (
          <CameraOff className="h-3.5 w-3.5 text-status-error" />
        )}
        {status === 'requesting' && 'Requesting camera access…'}
        {status === 'active' && 'Camera monitoring active'}
        {status === 'denied' && 'Camera access denied — this affects your integrity score'}
      </div>
      <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-input bg-elevated" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}