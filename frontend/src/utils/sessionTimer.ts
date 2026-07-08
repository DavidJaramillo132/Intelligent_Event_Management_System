const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;

export type SessionTimerResult =
  | { ok: true }
  | { ok: false; error: 'INVALID_TIMEOUT' };

interface SessionTimerCallbacks {
  onWarning: () => void;
  onExpire: () => void;
}

let warningTimer: ReturnType<typeof setTimeout> | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;
let isWarningActive = false;
let callbacks: SessionTimerCallbacks | null = null;
let inactivityDuration = 15 * 60 * 1000;
export const WARNING_WINDOW_SECONDS = 60;
const WARNING_DURATION = WARNING_WINDOW_SECONDS * 1000;

function handleActivity() {
  if (!isRunning || isWarningActive) return;
  resetTimers();
  startTimers();
}

function startTimers() {
  stopTimers();
  warningTimer = setTimeout(() => {
    isWarningActive = true;
    callbacks?.onWarning();
    expiryTimer = setTimeout(() => {
      callbacks?.onExpire();
      stopTimers();
    }, WARNING_DURATION);
  }, inactivityDuration);
}

function stopTimers() {
  if (warningTimer) { clearTimeout(warningTimer); warningTimer = null; }
  if (expiryTimer) { clearTimeout(expiryTimer); expiryTimer = null; }
}

function resetTimers() {
  stopTimers();
}

export function startSessionTimer(
  cbs: SessionTimerCallbacks,
  timeoutMinutes?: number | null,
): SessionTimerResult {
  // Path 1: null, undefined, or not a number (NaN, string, object) → use default 15 min
  if (timeoutMinutes === null || timeoutMinutes === undefined || typeof timeoutMinutes !== 'number' || Number.isNaN(timeoutMinutes)) {
    stopSessionTimer();
    inactivityDuration = 15 * 60 * 1000;
    callbacks = cbs;
    isRunning = true;
    isWarningActive = false;
    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }));
    startTimers();
    return { ok: true };
  }

  // Path 2: number outside [1, 1440] or non-integer float → reject, do not start timer
  if (!Number.isInteger(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > 1440) {
    return { ok: false, error: 'INVALID_TIMEOUT' };
  }

  // Path 3: valid integer in [1, 1440] → accept, start timer
  stopSessionTimer();
  inactivityDuration = timeoutMinutes * 60 * 1000;
  callbacks = cbs;
  isRunning = true;
  isWarningActive = false;
  ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }));
  startTimers();
  return { ok: true };
}

export function stopSessionTimer() {
  isRunning = false;
  isWarningActive = false;
  callbacks = null;
  stopTimers();
  ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, handleActivity));
}

export function extendSession() {
  isWarningActive = false;
  resetTimers();
  if (isRunning) startTimers();
}

export function setSessionEnabled(enabled: boolean) {
  if (enabled && callbacks) {
    isRunning = true;
    startTimers();
  } else {
    isRunning = false;
    isWarningActive = false;
    stopTimers();
  }
}
