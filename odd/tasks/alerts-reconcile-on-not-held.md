# Wrong-commission attendance: restrict workshop days and reconcile alerts

## Status
In progress. Branch `fix/alerts-reconcile-on-not-held` (from `dev` at `759055b`).

## Objective
1. When marking a class as not held deletes saved attendance records, re-evaluate the absence alerts of the affected students and remove the ones that no longer hold.
2. Workshop attendance can only be taken on days the commission has workshop; the commission picker only offers those commissions.
3. Attendance already saved on a day without workshop can be cleared from the UI (mark not held, then unmark).

## Problem
A preceptor took attendance on the wrong course/commission. The workaround (mark not held + unmark) fails for workshop: on a day the commission has no workshop the web hides the "mark not held" button (`isNotScheduled`, `packages/ui/.../workshop-attendance-page.tsx:150-151`) and shows a "not scheduled" text. The API never checks the schedule on workshop registration; availability is computed only on the client (`workshopAvailabilityOn`). Alerts are only generated on `attendance.registered`; nothing removes them when records are deleted, and the unique index (student, academic year, alert type) then suppresses the real alert later.

## Why
Prevent the error instead of patching it, keep a way out for records already saved by mistake, and keep alerts truthful.

## Decisions
- Alerts: affected students = students whose records were deleted (collected before the delete). For each, recompute the weighted total with `StudentWeightedAbsencesService.getStudentWeightedAbsencesForAlert` (same options as `GenerateAlertHandler`: `workshopOnly`, `courseId`) and delete that academic year's alerts whose threshold is above the new total. Same unit of work as the delete. Applies to daily and workshop mark handlers.
- Schedule enforcement lives in the API (UI filtering alone is bypassable from mobile or direct calls). Workshop registration (single, bulk, copy target) on a date that is not a workshop day of the commission → 400. A course with no schedule loaded is not blocked (cannot decide; keeps the current "no schedule" banner behaviour).
- Commission picker (web and mobile) on a date shows only commissions with workshop that day, plus commissions with saved workshop records that day (so wrong records can be cleared). Commissions whose course has no schedule loaded keep showing.
- On an unscheduled day with saved records, the "mark not held" action is available.
- User decision: also clean today's wrong records manually in the database (SQL handed to the user; agent does not touch any database).

## Scope
API attendance module, `packages/common`/`packages/hooks`/`packages/ui` as needed, `apps/client` workshop page, `apps/mobile` workshop screen, tests.

## Out of scope
- Audit log of attendance deletions and alert removals (user: "a futuro deberíamos guardar logs y auditar").
- Re-evaluating alerts on other deletions (justification removal, status edits).
- Schedule enforcement for daily or subject attendance.

## Checklist
- [ ] T1 — Alert reconciliation after not-held deletions (daily + workshop) + alert repository delete + unit tests. Route: delegated writer (2+ non-trivial files).
- [ ] T2 — API: reject workshop registration on a non-workshop day of the commission (schedule loaded); unit tests. Route: delegated writer.
- [ ] T3 — Commission picker filtered by date (web + mobile) incl. commissions with saved records; mark-not-held available on unscheduled days with saved records. Route: delegated writer.
- [ ] T4 — Hand the user the SQL to clean today's wrong records and their stale alerts. Route: inline.

## Acceptance criteria
- Marking a day not held removes alerts whose threshold exceeds the recomputed total; alerts still reached stay; untouched students unchanged; zero deleted records → no alert work.
- Registering workshop attendance on a non-workshop day of a commission with a loaded schedule → 400.
- Picker offers only commissions with workshop that day, plus those with saved records that day.
- A day without workshop that has saved records can be marked not held from the UI.

## TDD
Off (no TDD configuration in the project; same as earlier features). Checks: `pnpm --filter api test` (jest), `pnpm ts:check`, `pnpm lint:check`; UI tasks also vitest in `packages/ui`/`packages/hooks` and `pnpm --filter client build`.

## Delivery
Strategy `ask-on-risk`. Forecast ~800 authored lines (T1 ~250, T2 ~150, T3 ~400): over budget. Chain strategy (user): `stacked-to-main` — one PR per slice against the integration base (`dev`), merged independently. Planned slices: PR1 = T1, PR2 = T2, PR3 = T3 (boundaries recorded per commit below).

## Progress / evidence
- Feature document created; scope widened after the user confirmed the hidden workshop button and asked to restrict the picker.

## Next step
T1 (writer running).
