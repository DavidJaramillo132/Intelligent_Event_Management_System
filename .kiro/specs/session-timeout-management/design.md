# Design Document — Session Timeout Management

## Overview

This document describes the targeted fixes and additions needed to complete the session timeout management feature. The codebase already contains working partial implementations in `sessionTimer.ts`, `AuthContext.tsx`, `SessionExpiryModal.tsx`, and `AccessibilityMenu.tsx`. The work identified here closes the gaps listed in the requirements without rewriting existing correct logic.

The four areas of change are:

1. **`sessionTimer.ts`** — add input validation with typed return value, export `WARNING_WINDOW_SECONDS` as a named constant.
2. **`AuthContext.tsx`** — fix the `storage` event handler to distinguish null vs update, enforce an ordered logout sequence, add `navigate('/login')` after logout, and fix the stale closure risk in the `a11y-prefs-changed` handler.
3. **`SessionExpiryModal.tsx`** — throttle `aria-live` announcements to every 10 seconds while keeping the visible countdown updating every second.
4. **`AccessibilityMenu.tsx`** — no changes needed; already complete.

The tech stack is **React 19 + TypeScript + Vite + react-router-dom v7**. There is currently no test framework installed; the implementation tasks include installing **Vitest** for unit/integration tests and **fast-check** for property-based tests.

---

## Architecture

All changes are isolated to the frontend. No backend modifications are required. The session timeout system follows an observer pattern:

```
User Activity (DOM events)
        │
        ▼
┌───────────────────┐      onWarning()     ┌──────────────────────┐
│   Session_Timer   │ ──────────────────► │    Auth_Context       │
│  (sessionTimer.ts)│      onExpire()      │  (AuthContext.tsx)    │
└───────────────────┘ ──────────────────► │                       │
                                           │  showExpiryModal ──► │
                                           │  countdownSeconds    │
                                           └──────────┬───────────┘
                                                      │ renders
                                                      ▼
                                           ┌──────────────────────┐
                                           │  SessionExpiryModal  │
                                           │ (aria-live throttled)│
                                           └──────────────────────┘

localStorage (a11y-prefs)
        │  CustomEvent a11y-prefs-changed
        └──────────────────────────────► Auth_Context (useCallback handler)

localStorage (auth)
        │  window storage event (cross-tab)
        └──────────────────────────────► Auth_Context (storage handler)
```

---

## Components and Interfaces

### `sessionTimer.ts` — changes

**Return type for `startSessionTimer`**

The function currently returns `void`. It must return a discriminated union so callers can detect validation errors:

```typescript
export type SessionTimerResult =
  | { ok: true }
  | { ok: false; error: 'INVALID_TIMEOUT' };

export const WARNING_WINDOW_SECONDS = 60;          // exported named constant
const WARNING_DURATION = WARNING_WINDOW_SECONDS * 1000;  // internal ms value
```

**Validation rules in `startSessionTimer`**

| Input condition | Behaviour |
|---|---|
| `null`, `undefined`, non-numeric | Use default (15 min), start normally, return `{ ok: true }` |
| Integer in `[1, 1440]` | Accept, start normally, return `{ ok: true }` |
| Number outside `[1, 1440]` | Do not start, return `{ ok: false, error: 'INVALID_TIMEOUT' }` |
| Non-integer float (e.g. 2.5) | Do not start, return `{ ok: false, error: 'INVALID_TIMEOUT' }` |

The range is `[1, 1440]` per Requirement 7.1 (overrides the `[1, 480]` range in Requirement 1.4 — Requirement 7 is the authoritative configuration spec).

### `AuthContext.tsx` — changes

**1. Storage event handler — distinguish null vs update**

```typescript
const handleStorage = (e: StorageEvent) => {
  if (e.key !== 'auth') return;
  if (e.newValue === null) {
    // Another tab logged out — full cleanup
    stopSessionTimer();
    setShowExpiryModal(false);
    setUser(null);
    setToken(null);
  } else {
    // Another tab wrote/refreshed the token — update state only
    const { user: u, token: t } = readStoredAuth();
    setUser(u);
    setToken(t);
    // Do NOT restart the timer — each tab manages its own timer independently
  }
};
```

**2. `logout` function — guaranteed order**

The ordered sequence required by Requirement 4.1 is:

```
(a) setShowExpiryModal(false)
(b) stopSessionTimer()
(c) try { localStorage.removeItem('auth') } catch { /* ignore */ }
(d) setUser(null)
(e) setToken(null)
(f) navigate('/login')
```

`navigate` from `useNavigate()` must be called at the top of `AuthProvider`. The `logout` function must be defined with `useCallback` so it is stable and can be safely used in `useEffect` dependencies.

**3. Fix stale closure in `a11y-prefs-changed` handler**

The current implementation defines the handler inside a `useEffect` with `[token]` in the dependency array. The handler references `logout` which is defined **after** that `useEffect`, creating a stale closure. The fix is:

- Move `logout` definition to **before** its first `useEffect` usage, defined with `useCallback` and explicit dependencies.
- Reference `logout` directly in the dependency arrays of `useEffect` hooks that call it.

**4. Dependency arrays**

| Hook | Dependencies after fix |
|---|---|
| Session timer effect | `[token, logout]` |
| a11y handler effect | `[token, logout]` |
| `logout` useCallback | `[navigate]` |
| `handleExtendSession` useCallback | `[]` (only calls `extendSession` and `setShowExpiryModal`) |

### `SessionExpiryModal.tsx` — changes

The visible countdown must update every second. The `aria-live` region must only change every 10 seconds to avoid spamming screen readers. These are two separate concerns: the displayed number and the announced number.

The component receives `secondsRemaining` from `AuthContext` (which already ticks every second). Inside the component, a ref tracks the last announced value:

```typescript
const lastAnnouncedRef = useRef<number>(60);   // tracks last aria-live update
```

The render splits into two elements:

```tsx
{/* Visual: updates every second */}
<div className="session-expiry-modal__countdown" aria-hidden="true">
  {secondsRemaining}
</div>
<div className="session-expiry-modal__countdown-label" aria-hidden="true">
  segundos restantes
</div>

{/* Accessible: updates every 10 seconds */}
<div aria-live="polite" aria-atomic="true" className="sr-only-live">
  {announcedSeconds} segundos restantes
</div>
```

The `announcedSeconds` state (or derived value) updates only when `secondsRemaining % 10 === 0` or when the modal first mounts (at 60). A `useEffect` watching `secondsRemaining` handles this:

```typescript
useEffect(() => {
  if (secondsRemaining === 60 || secondsRemaining % 10 === 0) {
    setAnnouncedSeconds(secondsRemaining);
  }
}, [secondsRemaining]);
```

This way the `aria-live` region text changes only at 60, 50, 40, 30, 20, 10, 0 — seven announcements total, meeting Requirement 2.3.

---

## Data Models

### `SessionTimerResult`

```typescript
export type SessionTimerResult =
  | { ok: true }
  | { ok: false; error: 'INVALID_TIMEOUT' };
```

### `A11yPrefs` (no change — already correct in `AccessibilityMenu.tsx`)

```typescript
interface A11yPrefs {
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  darkMode: boolean;
  largeCursor: boolean;
  reduceMotion: boolean;
  wideSpacing: boolean;
  soundEnabled: boolean;
  noSessionTimeout: boolean;
}
```

### Module-level state in `sessionTimer.ts` (unchanged shape)

```typescript
let warningTimer: ReturnType<typeof setTimeout> | null;
let expiryTimer:  ReturnType<typeof setTimeout> | null;
let isRunning:    boolean;
let isWarningActive: boolean;
let callbacks:    SessionTimerCallbacks | null;
let inactivityDuration: number;            // milliseconds
const WARNING_DURATION = WARNING_WINDOW_SECONDS * 1000;  // 60 000 ms, fixed
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid inactivity period acceptance

*For any* integer `n` in the range `[1, 1440]`, calling `startSessionTimer(callbacks, n)` SHALL return `{ ok: true }` and set the inactivity duration to `n * 60 * 1000` milliseconds.

**Validates: Requirements 1.4, 7.1**

---

### Property 2: Invalid inactivity period rejection

*For any* numeric value outside the range `[1, 1440]` (i.e., `n < 1`, `n > 1440`, or a non-integer float such as `2.5`), calling `startSessionTimer(callbacks, n)` SHALL return `{ ok: false, error: 'INVALID_TIMEOUT' }` and SHALL NOT start any timer.

**Validates: Requirements 1.6, 7.2**

---

### Property 3: Null / undefined / non-numeric input defaults to 15 minutes

*For any* value that is `null`, `undefined`, or not a number (`NaN`, a string, an object), calling `startSessionTimer(callbacks, value as any)` SHALL return `{ ok: true }` and set the inactivity duration to `15 * 60 * 1000` milliseconds (900 000 ms).

**Validates: Requirements 7.3**

---

### Property 4: Activity event resets timer when warning is not active

*For any* configured inactivity period and *for any* activity event fired before the warning window starts, the inactivity countdown SHALL be reset to the full inactivity period, meaning no warning fires within the inactivity period after the last activity event.

**Validates: Requirements 1.2**

---

### Property 5: Activity event ignored while warning window is active

*For any* activity event fired while `isWarningActive` is `true`, the expiry timer SHALL NOT be cancelled or reset, meaning the expiry callback fires at the expected time regardless of user activity.

**Validates: Requirements 1.5**

---

### Property 6: Extend session restores a clean timer state

*For any* timer state where `isWarningActive` is `true`, calling `extendSession()` SHALL result in: `isWarningActive === false`, the warning timer reset to the full inactivity period, and the expiry timer cancelled — equivalent to a fresh `startSessionTimer` call.

**Validates: Requirements 3.1, 3.3**

---

### Property 7: Logout invariant — fully ordered cleanup

*For any* active authenticated session state (token present, timer running, modal possibly visible), the `logout()` function in `AuthContext` SHALL produce a final state satisfying all of: `showExpiryModal === false`, session timer is not running, `localStorage` does not contain the key `'auth'`, `user === null`, `token === null`.

**Validates: Requirements 4.1, 4.4**

---

### Property 8: Cross-tab null storage event triggers full logout state

*For any* authenticated session, firing a `StorageEvent` on `window` with `key='auth'` and `newValue=null` SHALL produce the same final state as Property 7 (modal hidden, timer stopped, `user=null`, `token=null`).

**Validates: Requirements 6.1**

---

### Property 9: `aria-live` region updates only at 10-second intervals

*For any* sequence of `secondsRemaining` values counting down from 60 to 0, the `aria-live` region text in `SessionExpiryModal` SHALL only change when `secondsRemaining` is a multiple of 10 (i.e., at 60, 50, 40, 30, 20, 10, 0) — exactly 7 updates total.

**Validates: Requirements 2.3**

---

### Property 10: `noSessionTimeout` toggle persists atomically to localStorage

*For any* boolean value `v`, when `AccessibilityMenu` updates `noSessionTimeout` to `v`, reading `JSON.parse(localStorage.getItem('a11y-prefs')).noSessionTimeout` immediately after SHALL equal `v`, and a `a11y-prefs-changed` CustomEvent SHALL have been dispatched on `window`.

**Validates: Requirements 5.6**

---

## Error Handling

| Error scenario | Component | Handling |
|---|---|---|
| `startSessionTimer` called with out-of-range `timeoutMinutes` | `sessionTimer.ts` | Return `{ ok: false, error: 'INVALID_TIMEOUT' }`, do not start timer, do not modify `inactivityDuration` |
| `localStorage.removeItem('auth')` throws during logout | `AuthContext.tsx` | Catch silently, continue to null state and redirect (Requirement 4.4) |
| `localStorage.getItem('a11y-prefs')` returns malformed JSON | `AuthContext.tsx` `isSessionTimeoutEnabled` | Already wrapped in try/catch returning default `{}` — treat `noSessionTimeout` as `false` |
| `JSON.parse` fails in `readStoredAuth` | `AuthContext.tsx` | Already handled — calls `localStorage.removeItem('auth')` and returns nulls |
| `navigate` called before router context available | `AuthContext.tsx` | `useNavigate` is called at provider level; always within `<BrowserRouter>` in `main.tsx` |

---

## Testing Strategy

### Test framework setup

No test framework is currently installed. The implementation tasks include:

- Install **Vitest** (`vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`) as dev dependencies.
- Install **fast-check** for property-based tests.
- Add a `vitest.config.ts` and configure `jsdom` environment.

### Unit / integration tests (Vitest + @testing-library/react)

- `sessionTimer.test.ts` — covers valid/invalid inputs, activity reset, warning-window ignore, extend-session state restoration, stop-session cleanup.
- `AuthContext.test.tsx` — covers storage event null vs update, logout order, a11y handler restart/stop, modal visibility after timeout.
- `SessionExpiryModal.test.tsx` — covers initial focus, ARIA attributes, aria-live update frequency.

### Property-based tests (Vitest + fast-check)

Each property in the Correctness Properties section is implemented as a single property-based test running a minimum of **100 iterations**. Each test is tagged with a comment referencing the property:

```typescript
// Feature: session-timeout-management, Property 1: Valid inactivity period acceptance
```

Property test location: `frontend/src/__tests__/` directory.

| Property | Test file | fast-check arbitrary |
|---|---|---|
| P1 — valid range acceptance | `sessionTimer.property.test.ts` | `fc.integer({ min: 1, max: 1440 })` |
| P2 — invalid range rejection | `sessionTimer.property.test.ts` | `fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 1441 }), fc.float().filter(n => !Number.isInteger(n)))` |
| P3 — null/undefined/non-numeric default | `sessionTimer.property.test.ts` | `fc.oneof(fc.constant(null), fc.constant(undefined), fc.string(), fc.constant(NaN))` |
| P4 — activity resets timer (not warning) | `sessionTimer.property.test.ts` | `fc.integer({ min: 1, max: 1440 })` with fake timers |
| P5 — activity ignored during warning | `sessionTimer.property.test.ts` | `fc.integer({ min: 1, max: 1440 })` with fake timers |
| P6 — extend restores clean state | `sessionTimer.property.test.ts` | `fc.integer({ min: 1, max: 1440 })` |
| P7 — logout invariant | `AuthContext.property.test.tsx` | `fc.record({ token: fc.string(), showModal: fc.boolean() })` |
| P8 — cross-tab null triggers logout | `AuthContext.property.test.tsx` | `fc.string()` (any prior token value) |
| P9 — aria-live 10-second intervals | `SessionExpiryModal.property.test.tsx` | `fc.array(fc.integer({ min: 0, max: 60 }), { minLength: 1 })` |
| P10 — noSessionTimeout persists | `AccessibilityMenu.property.test.tsx` | `fc.boolean()` |

### Dual testing philosophy

Unit tests cover concrete examples, edge cases, and error conditions that are too specific for property generators. Property tests verify that universal invariants hold across randomly generated inputs. Both are needed: unit tests catch specific regressions quickly, property tests find edge cases that specific examples miss.
