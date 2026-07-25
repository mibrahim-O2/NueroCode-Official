import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- Proctoring session state (in-memory, per session id) -----------------
// Persisted logging to Supabase's proctoring_logs table happens in Phase 12,
// once real assessment_id values exist for the NOT NULL foreign key. This
// server owns the live, real-time view of a session while it's active.

const sessions = new Map();

const PENALTIES = {
  tab_switch: 5,
  paste: 8,
  camera_alert: 10,
  keystroke_alert: 6,
};

const SEVERITY = {
  tab_switch: 'medium',
  paste: 'high',
  camera_alert: 'critical',
  keystroke_alert: 'high',
};

function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      tabSwitchCount: 0,
      pasteCount: 0,
      cameraAlerts: 0,
      keystrokeAlerts: 0,
      score: 100,
      log: [],
    });
  }
  return sessions.get(sessionId);
}

function recomputeScore(session) {
  const penalty =
    session.tabSwitchCount * PENALTIES.tab_switch +
    session.pasteCount * PENALTIES.paste +
    session.cameraAlerts * PENALTIES.camera_alert +
    session.keystrokeAlerts * PENALTIES.keystroke_alert;
  session.score = Math.max(0, 100 - penalty);
  return session.score;
}

function pushLog(session, type, message, severity) {
  const entry = { type, message, severity, timestamp: new Date().toISOString() };
  session.log.unshift(entry);
  session.log = session.log.slice(0, 50);
  return entry;
}

io.on('connection', (socket) => {
  socket.on('proctor:join', (sessionId) => {
    socket.join(sessionId);
    socket.data.sessionId = sessionId;

    const session = getOrCreateSession(sessionId);
    socket.emit('proctor:state', { score: session.score, log: session.log });

    // Recalculates and rebroadcasts the score every 30 seconds regardless
    // of new events, per the documented test criteria.
    const intervalId = setInterval(() => {
      const score = recomputeScore(session);
      io.to(sessionId).emit('proctor:score_update', { score, recalculated: true });
    }, 30000);
    socket.data.proctorInterval = intervalId;
  });

  const registerEventHandler = (eventName, counterKey, messageBuilder) => {
    socket.on(eventName, ({ sessionId }) => {
      if (!sessionId) return;
      const session = getOrCreateSession(sessionId);
      session[counterKey] += 1;
      const score = recomputeScore(session);
      const entry = pushLog(session, eventName, messageBuilder(session), SEVERITY[counterKey.replace('Count', '').replace('Alerts', '_alert')] || 'medium');
      io.to(sessionId).emit('proctor:log_update', entry);
      io.to(sessionId).emit('proctor:score_update', { score, recalculated: false });
    });
  };

  registerEventHandler('proctor:tab_switch', 'tabSwitchCount', (s) => `Tab switch detected (${s.tabSwitchCount} total)`);
  registerEventHandler('proctor:paste', 'pasteCount', (s) => `Large paste detected (${s.pasteCount} total)`);
  registerEventHandler('proctor:camera_alert', 'cameraAlerts', (s) => `Camera alert (${s.cameraAlerts} total)`);
  registerEventHandler('proctor:keystroke_alert', 'keystrokeAlerts', (s) => `Unusual typing rhythm detected (${s.keystrokeAlerts} total)`);

  socket.on('disconnect', () => {
    if (socket.data.proctorInterval) clearInterval(socket.data.proctorInterval);
  });
});

server.listen(PORT, () => {
  console.log(`NeuroCode realtime server running on port ${PORT}`);
});