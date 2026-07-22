# Implementation Plan: Session Timeout Management

## Overview

Close the identified gaps in the four session-timeout files. The changes are purely frontend TypeScript/React. The plan installs a test framework first, then fixes each file in dependency order (timer → context → modal), and finishes by wiring everything together and verifying correctness.

## Tasks

- [x] 1. Install and configure test framework
  - Install `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, and `fast-check` as dev dependencies in `frontend/`
  - Create `frontend/vitest.config.ts` with `jsdom` environment, `globals: true`, and coverage config
  - Add `"test": "vitest --run"` and `"test:watch": "vitest"` scripts to `frontend/package.json`
  - Create `frontend/src/__tests__/` directory with a placeholder `.gitkeep`
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 2. Fix `sessionTimer.ts` — input validation and exported constant
  - [x] 2.1 Export `WARNING_WINDOW_SECONDS = 60` as a named constant and derive the internal `WARNING_DURATION` from it
    - Replace the inline literal `60 * 1000` with `WARNING_WINDOW_SECONDS * 1000`
    - _Requirements: 7.4_
  - [x] 2.2 Change `startSessionTimer` return type to `SessionTimerResult` and add input validation
    - Add `export type SessionTimerResult = { ok: true } | { ok: false; error: 'INVALID_TIMEOUT' }`
    - If `timeoutMinutes` is `null`, `undefined`, or not a number → use default 15, return `{ ok: true }`
    - If `timeoutMinutes` is a number outside `[1, 1440]` or a non-integer float → return `{ ok: false, error: 'INVALID_TIMEOUT' }` without starting the timer
    - Otherwise accept the value, start timer, return `{ ok: true }`
    - _Requirements: 1.4, 1.6, 7.1, 7.2, 7.3_
  - [ ]* 2.3 Write property tests for `startSessionTimer` input validation
    - **Property 1: Valid inactivity period acceptance** — for any integer in [1,1440], result is `{ ok: true }` and duration equals `n * 60 * 1000`
    - **Property 2: Invalid inactivity period rejection** — for any value outside [1,1440] or non-integer float, result is `{ ok: false, error: 'INVALID_TIMEOUT' }` and timer does not start
    - **Property 3: Null/undefined/non-numeric defaults to 15 minutes** — for any null/undefined/NaN/string, result is `{ ok: true }` and duration equals 900 000 ms
    - Tag each test: `// Feature: session-timeout-management, Property N: <title>`
    - File: `frontend/src/__tests__/sessionTimer.property.test.ts`
    - _Requirements: 1.4, 1.6, 7.1, 7.2, 7.3_
  - [ ]* 2.4 Write property tests for timer activity and warning-window logic
    - **Property 4: Activity event resets timer when warning not active** — use fake timers; for any valid timeout, firing an activity event before warning fires should push the warning further out
    - **Property 5: Activity event ignored while warning is active** — once warning fires, simulating activity must not cancel the expiry timer
    - **Property 6: Extend session restores clean state** — after warning fires, calling `extendSession()` must set `isWarningActive=false` and the next expiry fires after a full inactivity period
    - File: `frontend/src/__tests__/sessionTimer.property.test.ts`
    - _Requirements: 1.2, 1.5, 3.1, 3.3_

- [ ] 3. Checkpoint — session timer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Fix `AuthContext.tsx` — logout order, storage handler, stale closure, navigation
  - [ ] 4.1 Import `useNavigate` and instantiate it at the top of `AuthProvider`; move `logout` definition (with `useCallback`) to before any `useEffect` that references it
    - `const navigate = useNavigate();`
    - Define `logout` with `useCallback` and `[navigate]` as dependency
    - Logout body order: `setShowExpiryModal(false)` → `stopSessionTimer()` → `try { localStorage.removeItem('auth') } catch {}` → `setUser(null)` → `setToken(null)` → `navigate('/login')`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ] 4.2 Fix `storage` event handler to distinguish `newValue === null` (cross-tab logout) vs non-null (token update)
    - When `e.newValue === null`: call `stopSessionTimer()`, `setShowExpiryModal(false)`, `setUser(null)`, `setToken(null)` — do NOT call `readStoredAuth()`
    - When `e.newValue !== null`: call `readStoredAuth()` and update user/token state only — do NOT restart the timer
    - _Requirements: 6.1, 6.2_
  - [ ] 4.3 Fix stale closure in `a11y-prefs-changed` handler by listing `logout` and `token` in its `useEffect` dependency array
    - The handler now references the stable `useCallback`-wrapped `logout`, eliminating the stale closure
    - _Requirements: 5.2, 5.3, 5.4_
  - [ ] 4.4 Update session timer `useEffect` to include `logout` in its dependency array
    - _Requirements: 2.1, 2.7_
  - [ ]* 4.5 Write property tests for `AuthContext` logout invariant and cross-tab storage handler
    - **Property 7: Logout invariant** — for any session state (token present, modal possibly shown), after `logout()` all post-conditions hold: modal=false, timer stopped, 'auth' absent from localStorage, user=null, token=null, navigate called with '/login'
    - **Property 8: Cross-tab null storage event triggers full logout state** — firing a StorageEvent with key='auth', newValue=null produces the same post-conditions as Property 7
    - File: `frontend/src/__tests__/AuthContext.property.test.tsx`
    - _Requirements: 4.1, 4.3, 4.4, 6.1_
  - [ ]* 4.6 Write unit tests for `AuthContext` storage handler token-update branch and a11y handler
    - Verify that firing a storage event with a non-null newValue updates token state WITHOUT calling `startSessionTimer`
    - Verify that firing `a11y-prefs-changed` with `noSessionTimeout=true` stops the timer and hides the modal
    - Verify that firing `a11y-prefs-changed` with `noSessionTimeout=false` (and token present) restarts the timer
    - File: `frontend/src/__tests__/AuthContext.test.tsx`
    - _Requirements: 5.2, 5.3, 6.2_

- [ ] 5. Checkpoint — AuthContext tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Fix `SessionExpiryModal.tsx` — throttled `aria-live` announcements
  - [ ] 6.1 Add `announcedSeconds` state (initialized to 60) and a `useEffect` that updates it only when `secondsRemaining % 10 === 0` or `secondsRemaining === 60`
    - `const [announcedSeconds, setAnnouncedSeconds] = useState(secondsRemaining);`
    - `useEffect(() => { if (secondsRemaining === 60 || secondsRemaining % 10 === 0) setAnnouncedSeconds(secondsRemaining); }, [secondsRemaining]);`
    - _Requirements: 2.3_
  - [ ] 6.2 Split the countdown display into two elements: a visual element (updates every second, `aria-hidden="true"`) and a live region (updates every 10 s, `aria-live="polite"`, `aria-atomic="true"`, `className="sr-only"` or visually hidden)
    - Visual div shows `{secondsRemaining}` with `aria-hidden="true"`
    - Live region shows `{announcedSeconds} segundos restantes` with full readable label
    - _Requirements: 2.2, 2.3_
  - [ ]* 6.3 Write property test for `aria-live` update frequency
    - **Property 9: aria-live updates only at 10-second intervals** — for any descending sequence of `secondsRemaining` values from 60 to 0, the live region text should change exactly at values that are multiples of 10 (60, 50, 40, 30, 20, 10, 0)
    - File: `frontend/src/__tests__/SessionExpiryModal.property.test.tsx`
    - _Requirements: 2.3_
  - [ ]* 6.4 Write unit tests for `SessionExpiryModal`
    - Verify initial focus on the extend button on mount
    - Verify ARIA attributes: `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
    - Verify overlay click calls `onExtend`
    - File: `frontend/src/__tests__/SessionExpiryModal.test.tsx`
    - _Requirements: 2.4, 2.5, 3.2_

- [ ] 7. Checkpoint — modal tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Validate `AccessibilityMenu.tsx` property — noSessionTimeout persistence
  - [ ]* 8.1 Write property test for `noSessionTimeout` toggle persistence
    - **Property 10: noSessionTimeout toggle persists atomically** — for any boolean value `v`, after updating the toggle to `v`, `JSON.parse(localStorage.getItem('a11y-prefs')).noSessionTimeout` equals `v` and a `a11y-prefs-changed` event was dispatched
    - File: `frontend/src/__tests__/AccessibilityMenu.property.test.tsx`
    - _Requirements: 5.6_

- [ ] 9. Final checkpoint — all tests pass
  - Run `npm run test` in `frontend/` and ensure all tests pass with zero failures.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `WARNING_WINDOW_SECONDS` is exported from `sessionTimer.ts` so `AuthContext` can import it instead of hardcoding 60
- The `useNavigate` hook requires `AuthProvider` to be rendered inside a `<BrowserRouter>` — this is already the case in the existing `main.tsx`
- Property tests use **fast-check** with minimum 100 iterations per test
- Unit tests use **Vitest** + **@testing-library/react** with `jsdom`
- Each property test file is tagged with comments referencing the design property: `// Feature: session-timeout-management, Property N: <title>`
- No changes to `AccessibilityMenu.tsx` are needed beyond the property test in task 8.1

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2.1", "2.2"] },
    { "wave": 3, "tasks": ["2.3", "2.4"] },
    { "wave": 4, "tasks": ["3"] },
    { "wave": 5, "tasks": ["4.1", "4.2", "4.3", "4.4"] },
    { "wave": 6, "tasks": ["4.5", "4.6"] },
    { "wave": 7, "tasks": ["5"] },
    { "wave": 8, "tasks": ["6.1", "6.2"] },
    { "wave": 9, "tasks": ["6.3", "6.4"] },
    { "wave": 10, "tasks": ["7"] },
    { "wave": 11, "tasks": ["8.1"] },
    { "wave": 12, "tasks": ["9"] }
  ]
}
```
