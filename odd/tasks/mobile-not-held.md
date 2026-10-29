# Feature: Mobile class and workshop not held

## Status
IN PROGRESS (2026-10-29). Branch `feat/mobile-not-held` from `dev` (`299ba60`, release 1.5.0, PR #99).

## Objective
Let preceptors mark the theory class of a course ("Clase no dictada") and a workshop commission ("Taller no dictado") as not held from the mobile app, like the web pages, and stop offering attendance on a marked day.

## Problem
- The API supports the markers (`GET/POST/DELETE /attendance/daily/not-held`, `/attendance/workshop/not-held`) and rejects registering on a marked day, but the mobile app has no action and never reads the status.
- A preceptor who takes attendance on mobile for a marked day gets a sync failure instead of a clear notice.

## Decisions
- D1 (user, 2026-10-29): "materia no dictada" means the preceptor's daily (theory) screen, not the teacher's per-subject screen. No subject-level marker.
- D2 (parent default): mark and unmark are direct online mutations, never queued in the outbox (same rationale as justification: not idempotent with record deletion). Offline, the action is disabled.
- D3 (parent default): the not-held status comes from the separate `GET .../not-held` endpoint (attendance GETs do not include it). While it is loading or failed and the device is online, saving and marking are disabled with a retry, like web T5b. When offline and the status is unknown, attendance stays available (offline-first); the server still rejects a marked day.
- D4 (parent default): routes come from `ATTENDANCE_ROUTES` and types from `@repo/common` (`SessionNotHeldStatus`, `MarkSessionNotHeldResult`).

## Scope
- Mobile: api fetchers, query keys/options, mark/unmark mutations (daily and workshop), a not-held confirmation sheet with optional reason (max 500), a not-held notice replacing the student list, disabled save bar, daily screen `attendance/[id].tsx` and workshop screen `attendance/workshop/[commissionId].tsx`.

## Out of scope
- Subject-level marker; teacher per-subject screen.
- Preloading not-held status for offline use.
- Dropping pending outbox items of a day when it gets marked (they fail as permanent sync errors).
- Mobile test runner (none exists in `apps/mobile`).

## Checklist
- [ ] T1: Data layer + sheet + daily screen — api fetchers, query keys/options, mark/unmark hooks for daily and workshop, `NotHeldSheet` and notice components, daily screen integration (status query, "Clase no dictada" action, notice with "Habilitar asistencia" unmark, disabled save bar while marked/unknown online). Route: delegated writer (2+ non-trivial files).
- [ ] T2: Workshop screen integration — "Taller no dictado" action, notice, unmark, disabled save bar. Route: delegated writer (same writer, follows T1).

## Acceptance criteria
- On a day marked not held, the daily/workshop screen shows the notice (with the reason when present) instead of the list, and no save action.
- Marking asks for confirmation, warns that saved records of the day are deleted, accepts an optional reason, and refreshes the day.
- Unmarking re-enables attendance for the day.
- Offline: mark/unmark disabled; attendance still available when the status is unknown.
- Only preceptor flows are affected; the teacher subject screen is unchanged.

## Checks
- TDD: off (no TDD configuration; mobile has no test runner).
- `pnpm --filter mobile ts:check`, `pnpm lint:check` (biome).

## Delivery
- Strategy: ask-on-risk. Forecast about 400 to 600 authored lines in mobile only.

## Progress
- Exploration done (mapper): screens, outbox, API endpoints, web hooks.

## Next step
- T1.
