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

## Scope change (2026-10-10)
User: preload and offline queue must cover BOTH daily attendance (preceptor) and per-subject attendance (teacher). Teacher API access and a teacher mobile flow are now in scope; tasks are re-planned after mapping the teacher flow.

## Out of scope (follow-ups)
- Preceptor scoping: `POST /attendance/daily` does not verify the course belongs to the preceptor; the preceptor dashboard falls back to all courses when the preceptor has none.
- `GET /subjects?academicYearId` lets a teacher pass any `teacherId`.
- `POST /attendance/subject/all` uses `@IsDate` on a JSON string date.
- Justified status on mobile (needs the preceptor justification flow).

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
- [x] **T1 — USB connectivity.** (commit `17ceb7e`; `ts:check` pass, biome pass, hook pass; `adb reverse --list` shows 3001/8081 with phone attached; review: high_risk → granted → approved and acknowledged, lineage `review-c2887eae58ef7658`, reviewed boundary `7df8489`; manual check of app traffic in API logs pending on user)
  - Advisory (non-blocking) follow-ups: the emulator without `adb reverse` no longer reaches the API (the old default was `10.0.2.2`), so run `android:reverse` on the emulator too or set `EXPO_PUBLIC_API_URL`; the `adb reverse` scripts assume a single attached device (`-s <serial>` needed for several); there is no automated check of URL resolution. Android default base URL `http://localhost:3001` plus `adb reverse tcp:3001 tcp:3001` (and Metro 8081) script in `apps/mobile/package.json`; single source of truth for the API URL (remove duplicate fallbacks in `src/config/app-config.ts` and `src/context/auth-context.tsx`); ensure cleartext http works on dev builds; document in mobile README/`.env.example`. Route: inline-or-delegated (decided at start).
  - Check: `ts:check` passes; from the device, the API logs show app requests.
- [x] **T2 — API mobile refresh.** (commit `20ff402`; `api test` 67 suites/339 tests pass, new `auth.controller.spec.ts` 12 tests; ts:check pass. RefreshTokenHandler does NOT rotate — same refresh token returned. Handlers now throw `UnauthorizedException` instead of plain `Error`, which was surfacing as 500.) `POST /auth/refresh` accepts `refreshToken` in the body when no cookie is present and returns `{accessToken, refreshToken}` in the body (keeping cookie behavior for web); respect existing rotation/revocation. `POST /auth/logout` accepts the body token too.
  - Check: jest unit tests for the controller/handler paths; existing API tests green.
- [x] **T3 — Mobile token refresh.** (commit `ed0076c`; mobile ts:check pass; `session-storage.ts` + single-flight interceptor in `api.ts`; network/5xx on refresh never signs out. Manual device check pending. Known gaps: refresh token now also readable by web JS via body; role-rejected select-tenant session not revoked; login/select-tenant still throw plain `Error` → 500.) Persist `refreshToken` in SecureStore at select-tenant; axios 401 interceptor with single-flight refresh and request retry; sign out on refresh failure; logout revokes and clears.
  - Check: `ts:check`; manual: expired access token renews transparently.
  - T2+T3 review: high_risk → granted → approved and acknowledged, lineage `review-1851e0e2fe5f6465`, reviewed boundary `ed0076c`.
- [x] **T3b — Fix review advisories on T2/T3 (regression we introduced).** (commit `f8d0cb2`; the refresh token goes in the body only for body-token clients, and the web client never read the body; logout clears locally first, then revokes fire-and-forget via bare axios; handler 401 tests added. Follow-up: `select-tenant` still returns the refresh token in the body to web.) Reason: the R1 warning says `/auth/refresh` now returns the refresh token in the body even for cookie-authenticated web clients, so XSS can read it. Fixes: (1) return the refresh token in the body only when it was supplied in the body (mobile); cookie clients get the access token only. (2) Mobile logout clears the local session immediately and revokes server-side best-effort without the 401 refresh chain (no ~20 s stall, no session-expired event during logout). (3) Add handler-level tests asserting `UnauthorizedException` from `RefreshTokenHandler` and `LogoutHandler`. Also fix the typo in the client-facing refresh handler message.
  - Check: api tests, api and mobile ts:check, biome.
- [x] **T4 — API idempotent attendance (daily AND subject).** (commit `6f3a8f0`; user clarified attendance is daily OR per-subject in the same table.)
  - **Mechanism:** new `IUnitOfWorkPort` + `MikroOrmUnitOfWorkAdapter` (`em.transactional`, one retry on unique violation). Partial unique index `attendanceRecord_daily_unique (course_id, student_id, date) WHERE subject_id IS NULL`; subject rows keep the existing 4-column unique.
  - **Migration:** `Migration20261010120000_attendance_daily_unique` dedups daily rows only and moves justifications. It was applied to the docker DB with `pnpm mikro-orm migration:up --only ...`.
  - **Handler behaviour:** the daily lookup filters `subjectId: null`. The no-op replay skips the save and the event, and the event is emitted after commit.
  - **Subject handlers:** fixed a duplicate-create bug in `RegisterSubjectAttendanceHandler` and `BulkUpdateSubjectStatusHandler`.
  - **Checks:** api tests 71 suites / 360 pass, ts:check pass, biome pass.
  - **Follow-ups (not in scope):**
    - `POST /attendance/bulk` can still overwrite subject records.
    - `AttendanceRecord.isDaily/isSubject` compare `=== undefined` while the DB gives `null`.
    - Redis cache invalidation runs before commit.
    - Unrelated pending migration `Migration20261009120000_alter_courses_division_and_preceptor` on the dev DB. Wrap the save in a transaction; migration making the attendance unique key treat NULL `subjectId` as equal (Postgres 16 `NULLS NOT DISTINCT`), handling existing duplicates; avoid re-emitting `attendance.registered` for unchanged records.
  - Check: jest tests for replay (same payload twice → no duplicates, no extra events); migration runs on the docker DB.
  - T3b+T4 review: high_risk → granted → approved and acknowledged, lineage `review-4e14e2de0b1eba67`, reviewed boundary `578a294`. The branch-wide candidate from `6c8c613` (268 files) stopped with `lens_context_budget_exceeded`, so it is reviewed as these slices instead.
- [ ] **T4b — Fix review advisories on T3b/T4 (regressions we introduced).**
  - (1) Mobile logout revocation must work when the access token expired: refresh via a bare call, then revoke, or revoke with the refresh token alone; never skip revocation when a refresh token exists.
  - (2) Redis cache invalidation must happen after the transaction commits.
  - (3) The dedup migration must copy removed attendance and justification rows into backup tables before deleting them, so production keeps an audit. The dev DB already ran the old version.
  - Check: api tests, ts:check, biome.
- [ ] **T4c — API teacher endpoints and scoping** (from the teacher-flow map).
  - **New endpoints:**
    - `GET /subjects/mine` (teacher/admin). It returns the teacher's subjects for the active year: `{subjectId, name, courseId, courseName, slots[{dayOfWeek,startTime,endTime}]}` for the whole week, so mobile can preload and filter by weekday locally.
    - `GET /subjects/:id/students` (teacher scoped to own subject; admin/preceptor allowed).
  - **Ownership guard:** subject attendance handlers (register, bulk, copy, get) throw `ForbiddenException` unless `subject.teacherId === user.sub` or the user is admin. This adds `teacherId` to the attendance `Subject` and `SubjectAdapter`.
  - **DTO fixes:** add `courseId` to `SubjectResponseDto`; the web teacher page reads it and silently fails without it. `GET /attendance/subject` returns the full roster, like daily.
  - **Class-day check:** compute the weekday from the `YYYY-MM-DD` string, not the server timezone.
  - Check: api tests for scoping (403 for another teacher), roster, `mine`.
- [ ] **T5 — Offline preload (both roles).** Install AsyncStorage, NetInfo and the React Query persister; persisted `QueryClient` with a long `gcTime`; preload service: active academic year → courses by preceptor → students and today's daily attendance per course; triggered after login, on app foreground and on reconnect; fix the home `/courses` fallback that omits `academicYearId`.
  - Teacher preload: `GET /subjects/mine` → per subject `GET /subjects/:id/students` + today's `GET /attendance/subject`. Teacher home branch shows today's subjects (filter slots by local weekday).
  - Check: `ts:check`; manual: airplane mode shows courses and students.
- [ ] **T5b — Mobile teacher subject attendance screen.** New route `app/(app)/attendance/subject/[subjectId].tsx` (registered in `(app)/_layout.tsx`) reusing the status buttons, counts bar and save bar from the daily screen; statuses P/A/T only (justified needs the preceptor justification flow).
  - Check: `ts:check`; manual on device.
- [ ] **T6 — Offline attendance outbox (daily + subject).** Persisted outbox coalesced per `(courseId, date)` for daily and `(subjectId, date)` for subject; "Invalid class day" and 403 are permanent errors surfaced to the user. (last write wins); optimistic cache update; flush on reconnect, foreground and after token refresh with backoff; permanent 4xx (non-401) errors surfaced and kept for the user to resolve; pending-sync indicator on the attendance screen and home.
  - Check: `ts:check`; manual: mark offline → reconnect → API logs show the POST and the DB has one row per student.

## Route log
| Task | Route | Trigger evidence |
|------|-------|------------------|
| T1 | delegated direct | touches 2+ non-trivial files (api.ts, app-config.ts, auth-context.tsx, package.json, app.json, docs) |
| T2+T3 | delegated direct (one writer, two commits) | API controller/handler + tests and mobile auth/api client: 2+ non-trivial files |
| T3b+T4 | delegated direct (one writer, two commits) | auth controller/handlers/tests + mobile auth; attendance handler/repo/migration/tests: 2+ non-trivial files |

## Progress / evidence
- Exploration done (connectivity, endpoints, offline libs, write path). Docker API healthy; no app traffic in logs.

## Next step
T4b (delegated writer) while the teacher flow is mapped; then re-plan T5/T6 plus the teacher API and mobile tasks.
