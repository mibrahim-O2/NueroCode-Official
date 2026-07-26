import { useEffect, useRef, useState, useCallback } from 'react';
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

  // Stable identities across re-renders (only change if sessionId changes),
  // so consumers using these in effect/useCallback dependency arrays don't
  // get retriggered just because unrelated state (score/log) updated.
  const emit = useCallback(
    (eventName) => socketRef.current?.emit(eventName, { sessionId }),
    [sessionId]
  );

  const emitTabSwitch = useCallback(() => emit('proctor:tab_switch'), [emit]);
  const emitPaste = useCallback(() => emit('proctor:paste'), [emit]);
  const emitCameraAlert = useCallback(() => emit('proctor:camera_alert'), [emit]);
  const emitKeystrokeAlert = useCallback(() => emit('proctor:keystroke_alert'), [emit]);

  return { connected, score, log, emitTabSwitch, emitPaste, emitCameraAlert, emitKeystrokeAlert };
}