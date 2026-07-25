import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useProctoringSocket(sessionId) {
  const socketRef = useRef(null);
  const [score, setScore] = useState(100);
  const [log, setLog] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return undefined;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('proctor:join', sessionId);
    });

    socket.on('proctor:state', (state) => {
      setScore(state.score);
      setLog(state.log);
    });

    socket.on('proctor:score_update', ({ score: newScore }) => setScore(newScore));

    socket.on('proctor:log_update', (entry) => {
      setLog((prev) => [entry, ...prev].slice(0, 50));
    });

    socket.on('disconnect', () => setConnected(false));

    return () => socket.disconnect();
  }, [sessionId]);

  const emit = (eventName) => socketRef.current?.emit(eventName, { sessionId });

  return {
    connected,
    score,
    log,
    emitTabSwitch: () => emit('proctor:tab_switch'),
    emitPaste: () => emit('proctor:paste'),
    emitCameraAlert: () => emit('proctor:camera_alert'),
    emitKeystrokeAlert: () => emit('proctor:keystroke_alert'),
  };
}