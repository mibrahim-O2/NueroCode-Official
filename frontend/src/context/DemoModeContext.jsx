import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import logoMark from '@/assets/logo-mark.png';
import { useAuth } from '@/context/AuthContext';
import { exitDemoMode, getDemoStatus, toggleDemoMode, verifyDemoPasscode } from '@/services/demoService';

const DemoModeContext = createContext(null);

// SECURITY NOTE: every check in this file is a UX CONVENIENCE ONLY. It just
// decides whether to show Demo Mode UI at all. The real security boundary is
// the backend: every /demo/* route rejects anyone whose email doesn't match
// OWNER_EMAIL, and switching Demo Mode on also requires the passcode
// server-side. Nothing here can grant access the server doesn't.

// Optional hint from the frontend .env, so non-owner accounts skip the status
// request entirely. Unset, admins are asked instead (the owner manages Demo
// Mode from the Admin page) and the server's 403 settles it. The real owner
// email is never written into code.
const OWNER_EMAIL_HINT = (import.meta.env.VITE_OWNER_EMAIL || '').trim().toLowerCase();

// Tracks "passcode entered in THIS browser session". Combined with the
// server's own recent-verification check, the passcode is asked once per
// session: closing the tab clears it.
const PASSCODE_SESSION_KEY = 'neurocode_demo_passcode_verified';

const INITIAL_STATE = {
  loaded: false,
  isOwner: false,
  demoModeEnabled: false,
  persona: null,
  serverPasscodeVerified: false,
};

function mightBeOwner(user) {
  if (!user) return false;
  if (OWNER_EMAIL_HINT) return (user.email || '').trim().toLowerCase() === OWNER_EMAIL_HINT;
  return user.role === 'admin';
}

function readSessionFlag() {
  try {
    return sessionStorage.getItem(PASSCODE_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function DemoModeProvider({ children }) {
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState(INITIAL_STATE);
  const [sessionPasscodeVerified, setSessionPasscodeVerified] = useState(readSessionFlag);

  const applyStatus = useCallback((status) => {
    setState({
      loaded: true,
      isOwner: true,
      demoModeEnabled: !!status?.demo_mode_enabled,
      persona: status?.persona || null,
      serverPasscodeVerified: !!status?.passcode_verified,
    });
  }, []);

  // Fetches /demo/status once per signed-in account (on mount, and again if a
  // different user signs in). A 403 simply means "not the owner": no demo UI.
  const refreshDemoStatus = useCallback(async () => {
    if (!mightBeOwner(user)) {
      setState({ ...INITIAL_STATE, loaded: true });
      return null;
    }
    try {
      const status = await getDemoStatus();
      applyStatus(status);
      return status;
    } catch {
      setState({ ...INITIAL_STATE, loaded: true });
      return null;
    }
    // Keyed on identity, not the whole user object, so XP updates don't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email, user?.role, applyStatus]);

  useEffect(() => {
    refreshDemoStatus();
  }, [refreshDemoStatus]);

  const confirmPasscode = useCallback(async (passcode) => {
    await verifyDemoPasscode(passcode);
    try {
      sessionStorage.setItem(PASSCODE_SESSION_KEY, 'true');
    } catch {
      // Private browsing can block storage — the server still remembers the
      // verification, so switching on still works; the prompt may just reappear.
    }
    setSessionPasscodeVerified(true);
    setState((prev) => ({ ...prev, serverPasscodeVerified: true }));
  }, []);

  const setDemoModeEnabled = useCallback(
    async (enabled) => {
      const status = enabled ? await toggleDemoMode(true) : await exitDemoMode();
      applyStatus(status);
      // XP / level are real in Demo Mode; re-read them after every switch.
      refreshUser();
      return status;
    },
    [applyStatus, refreshUser]
  );

  const value = useMemo(
    () => ({
      loaded: state.loaded,
      isOwner: state.isOwner,
      demoModeEnabled: state.isOwner && state.demoModeEnabled,
      persona: state.persona,
      // First activation per session goes through the passcode modal.
      needsPasscode: !(sessionPasscodeVerified && state.serverPasscodeVerified),
      refreshDemoStatus,
      confirmPasscode,
      enableDemoMode: () => setDemoModeEnabled(true),
      exitDemoMode: () => setDemoModeEnabled(false),
    }),
    [state, sessionPasscodeVerified, refreshDemoStatus, confirmPasscode, setDemoModeEnabled]
  );

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error('useDemoMode must be used within a DemoModeProvider');
  return ctx;
}

// The identity every name/avatar display should render. While Demo Mode is
// on, the persona (e.g. "mibrahim-O2", served by the backend) and the
// NeuroCode logo mark replace the real account's name, email and photo, so
// the owner's real identity never appears on screen during a presentation.
export function useDisplayIdentity() {
  const { user } = useAuth();
  const { demoModeEnabled, persona } = useDemoMode();
  if (demoModeEnabled && persona) {
    return { name: persona.display_name, subtitle: 'Demo Mode', avatarUrl: logoMark, isPersona: true };
  }
  return { name: user?.name, subtitle: user?.email, avatarUrl: user?.avatar_url, isPersona: false };
}

export const DEMO_PERSONA_AVATAR = logoMark;
