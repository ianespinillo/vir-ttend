# Feature: mobile-offline-sync

## Objective
Make the Expo mobile app reach the dockerized API from a physical Android device connected over USB, keep the session alive with refresh tokens, preload the preceptor's courses with their students for offline use, and queue attendance changes made offline so they sync asynchronously when connectivity returns.

## Problem
- No app request reaches the API container (only healthchecks appear in `docker compose logs api`; `GET localhost:3001/health` is 200). The mobile base URL (`apps/mobile/src/services/api.ts`) falls back to `10.0.2.2:3001` on Android, which only exists inside the emulator.
- Access tokens last 15 minutes and the app never stores the refresh token; `/auth/refresh` only reads the httpOnly cookie and returns no token in the body.
- Nothing is persisted: no AsyncStorage, NetInfo or query persister. Without network the app has no data.
- `POST /attendance/daily` is read-then-write without a transaction, and the unique key `(courseId, studentId, subjectId, date)` treats NULL `subjectId` as distinct, so replays can duplicate rows.

## Why
Preceptors take attendance in classrooms with unreliable connectivity. Data must be available offline and writes must never be lost or duplicated.

## Scope
- Mobile: API URL resolution, auth refresh, persisted query cache, preload, offline outbox, pending-sync UI.
- API: mobile-friendly refresh (body token in/out), idempotent daily attendance save.

## Out of scope
- Teacher role access to list endpoints (`/courses`, `/students` return 403 for teachers). Tracked as a follow-up.
- Subject attendance (`/attendance/subject`) offline support.

## Constraints and assumptions
- Device: physical **Android** phone over USB → use `adb reverse` so the phone's `localhost:3001` maps to the laptop. Assumption: Android (Windows host, USB).
- New Expo libraries are installed with `npx expo install` (AGENTS.md).
- Generated artifacts in English; existing UI copy is Spanish and stays Spanish.
- User WIP (cookie `Secure` toggle, NativeWind css-interop fix) is in the working tree and must not be lost.

## TDD
- Mode: **off**. Source: no project/session TDD configuration found (tests existing does not enable TDD).
- Runners: API `jest` (`apps/api`, script `test`); mobile has no test runner, only `ts:check`.
- Ordinary functional checks still run per task.

## Delivery
- Forecast: about 900 authored changed lines (above the ~400 budget).
- Strategy: `ask-on-risk` (default). Chain strategy: feature-branch-chain on `feat/mobile-app`; PRs target **`dev`** (user: "va a dev no a main"). Confirm exact slicing at PR time.
- Pre-feature commits (user WIP, not part of the task slices): `b05f839` fix(mobile) cookies/css-interop, `135e97d` chore(tooling) biome ignores `.expo`.
- Slices: (pending)

## Tasks
- [ ] **T1 — USB connectivity.** Android default base URL `http://localhost:3001` plus `adb reverse tcp:3001 tcp:3001` (and Metro 8081) script in `apps/mobile/package.json`; single source of truth for the API URL (remove duplicate fallbacks in `src/config/app-config.ts` and `src/context/auth-context.tsx`); ensure cleartext http works on dev builds; document in mobile README/`.env.example`. Route: inline-or-delegated (decided at start).
  - Check: `ts:check` passes; from the device, the API logs show app requests.
- [ ] **T2 — API mobile refresh.** `POST /auth/refresh` accepts `refreshToken` in the body when no cookie is present and returns `{accessToken, refreshToken}` in the body (keeping cookie behavior for web); respect existing rotation/revocation. `POST /auth/logout` accepts the body token too.
  - Check: jest unit tests for the controller/handler paths; existing API tests green.
- [ ] **T3 — Mobile token refresh.** Persist `refreshToken` in SecureStore at select-tenant; axios 401 interceptor with single-flight refresh and request retry; sign out on refresh failure; logout revokes and clears.
  - Check: `ts:check`; manual: expired access token renews transparently.
- [ ] **T4 — API idempotent daily attendance.** Wrap the save in a transaction; migration making the attendance unique key treat NULL `subjectId` as equal (Postgres 16 `NULLS NOT DISTINCT`), handling existing duplicates; avoid re-emitting `attendance.registered` for unchanged records.
  - Check: jest tests for replay (same payload twice → no duplicates, no extra events); migration runs on the docker DB.
- [ ] **T5 — Offline preload.** Install AsyncStorage, NetInfo and the React Query persister; persisted `QueryClient` with a long `gcTime`; preload service: active academic year → courses by preceptor → students and today's daily attendance per course; triggered after login, on app foreground and on reconnect; fix the home `/courses` fallback that omits `academicYearId`.
  - Check: `ts:check`; manual: airplane mode shows courses and students.
- [ ] **T6 — Offline attendance outbox.** Persisted outbox coalesced per `(courseId, date)` (last write wins); optimistic cache update; flush on reconnect, foreground and after token refresh with backoff; permanent 4xx (non-401) errors surfaced and kept for the user to resolve; pending-sync indicator on the attendance screen and home.
  - Check: `ts:check`; manual: mark offline → reconnect → API logs show the POST and the DB has one row per student.

## Route log
| Task | Route | Trigger evidence |
|------|-------|------------------|
| T1 | delegated direct | touches 2+ non-trivial files (api.ts, app-config.ts, auth-context.tsx, package.json, app.json, docs) |

## Progress / evidence
- Exploration done (connectivity, endpoints, offline libs, write path). Docker API healthy; no app traffic in logs.

## Next step
T1 (delegated writer).
