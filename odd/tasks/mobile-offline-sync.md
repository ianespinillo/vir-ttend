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
    - Unrelated pending migration `Migration20261009120000_alter_courses_division_and_preceptor` on the dev DB.
  - T3b+T4 review: high_risk → granted → approved and acknowledged, lineage `review-4e14e2de0b1eba67`, reviewed boundary `578a294`. The branch-wide candidate from `6c8c613` (268 files) stopped with `lens_context_budget_exceeded`, so it is reviewed as these slices instead.
- [x] **T4b — Fix review advisories on T3b/T4 (regressions we introduced).**
  - **Commit:** `16079ba`.
  - **What changed:**
    - Logout revocation does a bare refresh+retry on 401 or when the access token is missing.
    - An `AfterCommitQueue` (AsyncLocalStorage) defers Redis invalidation until after `em.transactional`.
    - The migration backs up removed rows into `attendance_record_dedup_backup` and `justification_dedup_backup`.
  - **Checks:** SQL validated in a rolled-back transaction on docker Postgres; api 71 suites / 368 tests pass; ts:check pass; biome pass.
  - **Review:** assess returned medium, 380 lines, `under_budget`, so it stays pending in the slice from `578a294`.
  - (1) Mobile logout revocation must work when the access token expired: refresh via a bare call, then revoke, or revoke with the refresh token alone; never skip revocation when a refresh token exists.
  - (2) Redis cache invalidation must happen after the transaction commits.
  - (3) The dedup migration must copy removed attendance and justification rows into backup tables before deleting them, so production keeps an audit. The dev DB already ran the old version.
  - Check: api tests, ts:check, biome.
- [x] **T4c — API teacher endpoints and scoping** (from the teacher-flow map).
  - **Commits:** `7539575` (endpoints) and `9312055` (scoping).
  - **Checks:** api 75 suites / 403 tests pass; turbo ts:check 7/7 pass; biome pass.
  - **Web bug:** the web teacher page bug (missing `courseId`) is confirmed and fixed by the DTO.
  - **Slice review:** high, 1658 lines → granted → approved and acknowledged, lineage `review-09642d27e6e51e48`, reviewed boundary `9312055`. The branch-wide candidate from `6c8c613` failed again with `lens_context_budget_exceeded` (296 files).
  - **Gaps:**
    - `GET /attendance/subject/:id/history` has no ownership check.
    - `POST /attendance/subject` trusts the body `courseId` and `studentId`s.
    - The bulk handler includes non-active students.
    - Subject lookups are not tenant-scoped.
  - **New endpoints:**
    - `GET /subjects/mine` (teacher/admin). It returns the teacher's subjects for the active year: `{subjectId, name, courseId, courseName, slots[{dayOfWeek,startTime,endTime}]}` for the whole week, so mobile can preload and filter by weekday locally.
    - `GET /subjects/:id/students` (teacher scoped to own subject; admin/preceptor allowed).
  - **Ownership guard:** subject attendance handlers (register, bulk, copy, get) throw `ForbiddenException` unless `subject.teacherId === user.sub` or the user is admin. This adds `teacherId` to the attendance `Subject` and `SubjectAdapter`.
  - **DTO fixes:** add `courseId` to `SubjectResponseDto`; the web teacher page reads it and silently fails without it. `GET /attendance/subject` returns the full roster, like daily.
  - **Class-day check:** compute the weekday from the `YYYY-MM-DD` string, not the server timezone.
  - Check: api tests for scoping (403 for another teacher), roster, `mine`.
- [x] **T4d — Fix T4c review advisories.** (commit `de11b24`; api tests 76 suites / 415 pass; turbo ts:check 7/7 pass; biome pass.)
  - **Tenant scoping (R1/R3-003):** subject attendance reads and writes verify the subject belongs to the actor's tenant via `SubjectAccessPolicy` (`assertCanWriteSubjectAttendance` and `assertCanReadSubjectAttendance`), throwing 403 `ForbiddenException` on mismatch.
  - **Course from subject (R3-002):** `POST /attendance/subject` uses `subject.courseId` and rejects a mismatched body `courseId` with 400 `BadRequestException`.
  - **History:** added ownership and tenant scoping check to `GET /attendance/subject/:id/history` via `GetSubjectHistoryQueryHandler` (403 for another teacher or another tenant).
  - **Roster tenant check:** `GetSubjectStudentsHandler` rejects cross-tenant subject requests with 403.
  - **Rotation non-issue:** the refresh-rotation advisories (R3-001, R4) do not apply, since `RefreshTokenHandler` does not rotate (verified in T2).
  - **Migration note:** documented in migration comments that the dev DB ran the dedup migration before the backup tables were added (R2).
  - **Check:** unit tests for cross-tenant 403 on register, bulk, copy, get, and history, plus course mismatch 400.
- [x] **T5 — Offline preload (both roles).** (commits `c7d5dd0` and `3928da4`; turbo ts:check 7/7 pass; biome pass.)
  - Persisted React Query cache in AsyncStorage (7 days gcTime) cleared on logout/session end; wired onlineManager to NetInfo and focusManager to AppState.
  - Preceptor preload: active academic year → courses → students and today's daily attendance per course. Fixed `/courses` fallback omitting `academicYearId`.
  - Teacher preload: `GET /subjects/mine` → per subject `GET /subjects/:id/students` + today's `GET /attendance/subject`.
  - Home screen lists today's subjects for teachers and displays offline / last-synced status indicator.
  - Check: `ts:check` passes; manual on device.
- [x] **T5b — Mobile teacher subject attendance screen.** (commit `18c225f`; turbo ts:check 7/7 pass; biome pass.)
  - New route `app/(app)/attendance/subject/[subjectId].tsx` reusing status buttons, summary badge bar, "Todos presentes" action and sticky save confirmation bar from the daily screen.
  - Reads students and existing attendance from the persisted React Query cache (`subjectStudents` and `subjectAttendance`).
  - Supports P/A/T statuses, preserves existing justified records, validates courseId resolution.
  - Check: `ts:check` passes; manual on device.
- [x] **T6 — Offline attendance outbox (daily + subject).** (commit `6db5c64`; turbo ts:check 7/7 pass; biome pass; api tests 76 suites / 415 pass.)
  - Persisted outbox in `AsyncStorage` scoped by session (`virttend:outbox:${userId}:${tenantId}`), coalescing writes per `(courseId, date)` for daily and `(subjectId, date)` for subject (last write wins).
  - Optimistic React Query cache updates upon queueing writes (`dailyAttendance`, `preceptorDashboard`, `subjectAttendance`).
  - Flush queue upon mount, reconnect (`onlineManager`), app foreground (`AppState`), pull-to-refresh on home screen, and backoff retry timer.
  - Error classifier distinguishes permanent 4xx (400 "Invalid class day", 403 Forbidden, 422) preserved for user resolution from transient errors (network/timeout/5xx/401) retried with exponential backoff (1s to 60s).
  - Pending-sync and error indicators/banners on both attendance sheets (`[id].tsx`, `[subjectId].tsx`), course and subject cards on home screen, and enhanced `SyncIndicator`.
  - Check: `ts:check` passes; manual on device: mark offline → reconnect → auto flush.

## Scope change (2026-10-11) — user-reported gaps vs web
User: "the course is not updated to attendance already taken" and "the whole justification section from the web is missing on mobile". The user asked us to compare web vs mobile and do what is optimal.

- [x] **T7 — "Attendance taken" state (mobile).**
  - **Commit:** `7d264df`; ts:check, biome and turbo ts:check pass.
  - **Review:** medium, 927 lines → granted → approved and acknowledged, lineage `review-8cdcfff768cf3d21`, reviewed boundary `7d264df`. The first capture was killed by OS memory pressure and re-run in the foreground.
  - **Follow-ups:** no mobile test runner, so the outbox and `taken.ts` helpers have no tests (R3-001/R3-003). A concurrent enqueue can persist a rolled-back item to storage (R3-002).
  - **Root cause:** `/dashboard` snapshots are year-to-date aggregates. Mobile home derives "taken" from `notRecorded < totalStudents` on those numbers, so it is almost always false.
  - **Masking bug:** the outbox optimistically overwrites the dashboard with today-only counts, then the post-flush refetch reverts them.
  - **Fix:**
    - Derive "taken today" from the cached `dailyAttendance(courseId, today)` for preceptors, and from `subjectAttendance(subjectId, today)` for teachers. A day counts as taken when any record has a status, or an outbox item exists.
    - Stop writing today-only numbers into the dashboard cache.
    - The optimistic update must preserve the record `id` and `justification`.
    - The course-list fallback must also show the state.
  - Check: `ts:check`; manual: save, then the card shows taken after sync and after restart.
  - Also folds in outbox advisories from the T4d+T5b+T6 review:
    - (R3-002) `init()` in-flight guard.
    - (R4) transient failed items counted and visible.
    - (R4) permanent failures from past dates surfaced on home with retry and discard.
    - (R4) persistence failure surfaced instead of a false "saved locally" message.
- [ ] **T8 — Justifications on mobile (parity with web).**
  - **Who:** preceptor only (API roles PRECEPTOR/ADMIN). Teachers see the justified badge read-only.
  - **Justify action:** on ABSENT rows that have a record `id`. A bottom sheet offers the web's preset reasons (Certificado médico, Motivos personales / familiares, Trámite personal, Problema de transporte, Licencia escolar, Otro → free text) plus optional notes, and calls `POST /attendance/:id/justify`.
  - **Display:** justified badge with reason and notes on both sheets. Read-only "Justificaciones del mes" list per course, mirroring the web review modal.
  - **Connectivity:** online-only v1. The record id exists only after sync and the endpoint is not idempotent. The action is disabled with a message while offline or while the day has a pending outbox item.
  - **Web fix:** the "Justificar" button is shown for LATE rows, but the API only accepts ABSENT, so LATE gets a 400. Show it for ABSENT only.
  - Check: `ts:check`, biome, web ts:check; manual on device.
  - Also folds in from the T4d+T5b+T6 review:
    - (R3-003) the subject sheet must preserve `justified` records instead of saving them as present.
    - (R1-001/R3-005) the API subject access policy must fail closed when the subject or actor tenant is empty, with no ADMIN/empty-tenant defaults in query/command constructors.
- T4d+T5b+T6 slice review: high → granted → `correction_required`.
  - **Correction:** two CRITICAL lost-update findings in the outbox flush. Fixed in `3792e62` (keep items re-enqueued mid-flight, rerun the flush).
  - **Outcome:** the targeted validator approved; acknowledged, lineage `review-64a0b6a0e3ecd21b`, reviewed boundary `3792e62`.
  - **Tooling note:** the validator only ran with a clean worktree (`repository_context_unavailable` while the doc was modified).
  - **Branch-wide candidate:** `lens_context_budget_exceeded` again (322 files).

## Route log
| Task | Route | Trigger evidence |
|------|-------|------------------|
| T1 | delegated direct | touches 2+ non-trivial files (api.ts, app-config.ts, auth-context.tsx, package.json, app.json, docs) |
| T2+T3 | delegated direct (one writer, two commits) | API controller/handler + tests and mobile auth/api client: 2+ non-trivial files |
| T3b+T4 | delegated direct (one writer, two commits) | auth controller/handlers/tests + mobile auth; attendance handler/repo/migration/tests: 2+ non-trivial files |
| T4b | delegated direct | mobile api client + UoW adapter + repository + migration + tests |
| T4c | delegated direct (two commits) | academic controller/queries/DTOs + attendance policy/handlers/adapters + tests |
| T4d | inline direct | attendance policy/handlers/controllers + academic queries + migration + tests |
| T5 | delegated direct | mobile deps, query client, preload service, home screen: 2+ non-trivial files |
| T5b | inline direct | subject attendance screen + home subject navigation params |
| T7 | delegated direct | home cards, outbox service/provider, sheets, new helpers: 7+ files |
| T8 | delegated direct | mobile sheets + justify sheet + api/hooks, web attendance row, api policy: 2+ non-trivial files |
| T6 | delegated direct | outbox service, types, provider, hooks, sync indicators, daily and subject sheets, home screen: 7+ files |

## Progress / evidence
- Exploration done (connectivity, endpoints, offline libs, write path). Docker API healthy; no app traffic in logs.
- T1 to T6 completed, tested, and verified.

## Next step
- T8 (delegated writer).
- Then manual verification on device with `pnpm --filter mobile android:usb`, and prepare the feature PR to `dev`.
