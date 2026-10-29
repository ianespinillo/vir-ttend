# Feature: Class not held (teacher absence)

## Status
IN PROGRESS (2026-10-29). Branch `feat/class-not-held` (from `dev` at `ce5574b`).

## Objective
Let preceptors (and admins) mark that the theory shift of a course, or a workshop commission, was not held on a date (for example because the teacher was absent), so no student absence counts for it and the weighted absence of the other shift is correct.

## Problem
- Today "class held" is inferred from the existence of records. "Teacher absent" and "attendance not loaded yet" look the same, and a preceptor who took daily attendance before learning that no theory teacher came leaves absences counted.
- Class suspensions (`AcademicYear.declareNonWorkingDay`) are institution-wide per shift, never per course or commission, and the attendance module never reads them.
- When theory is not held but the workshop is, a workshop absence weighs 0.5 (`weighted-absence.ts`, constant `CONTRATURNO_SHIFT_WEIGHT`), although the student had a single shift that day.
- Alert evaluation counts a recent date as contraturno when the commission has a workshop scheduled that weekday (`expectedContraturnoDay`), even if the workshop will not be held, which delays alerts.

## Decisions
- D1 (user, 2026-10-29): keep the 0.5 weight whenever theory was held. When theory is not held and the workshop is, a workshop absence weighs 1.
- D2 (user, 2026-10-29): "not held" is set from the daily register (theory) and from the workshop register.
- D3 (user accepted the parent design, 2026-10-29): a class-level marker, not a per-student attendance status. Theory: course + date. Workshop: workshop commission + date. A per-student status would make the day "given" (`countDaysGiven`, `classDates`) and break the contraturno rule.
- D4 (accepted design): marking deletes the records already saved for that day (UI confirms first) and blocks registering new ones until unmarked.
- D5 (accepted design): reporting working days of a course subtract its theory-not-held dates, like institutional suspensions.
- D6 (accepted design): alerts already raised are not recomputed when a marker lowers a total.
- D7 (parent default): two dedicated tables, `daily_session_not_held` (tenant, course, date, unique course+date) and `workshop_session_not_held` (tenant, workshop commission, date, unique commission+date), each with optional `reason`, `created_by`, `created_at`. Mirrors the existing daily/workshop record split.
- D8 (parent default): same roles and access as registering: daily — PRECEPTOR, ADMIN of the tenant, course must have daily attendance (`assertCourseHasDailyAttendance`); workshop — `assertCanManageWorkshopAttendance`. Unmarking is allowed and does not restore deleted records.
- D10 (parent default, follows D1): an institutional suspension that covers the course's shift (`isNonWorkingDayFor(date, course.shift)`) also counts as theory not held in T4, so a workshop held that day weighs 1.
- D9 (parent default): subject records on a theory-not-held day are left untouched (out of scope).

## Scope
- API: weighted-absence rule, migration, entities/repositories, mark/unmark commands and endpoints for daily and workshop, register handlers blocked on marked days, GET daily/workshop expose `notHeld`, calculation callers pass not-held dates, reporting working days.
- Web: hooks, "Clase no dictada" action with confirmation, not-held notice replacing the grid, disabled register actions, in daily and workshop pages.

## Out of scope
- Mobile app; demo app parity (`apps/demo/src/lib/store/weighted-absence.ts` keeps the old rule).
- Subject attendance not-held marker.
- Recomputing or revoking alerts already raised.

## Checklist
- [x] T1: API domain — `calculateWeightedAbsences` / `calculateWeightedAbsencesByStudent` accept `theoryNotHeldDays`; on those days a workshop absence weighs 1 (not in workshop-only courses, where it already weighs 1); 0.5 kept when theory was held; unit tests. Route: delegated writer (with T2, shared preparation).
- [x] T2: API daily marker — migration (both tables), `DailySessionNotHeld` entity/repo/ORM/mapper, `deleteDailyByCourseAndDate`, mark/unmark commands in a unit of work, `POST/DELETE attendance/daily/not-held`, register/bulk/copy daily blocked on marked days, GET daily returns `notHeld`, `ATTENDANCE_ROUTES`, tests. Route: delegated writer (2+ non-trivial files).
- [x] T2b: API corrections from the T1+T2 review — `GET daily/not-held` validates `courseId`/`date` with a DTO (400, not 500) and checks the course tenant like mark/unmark; concurrent mark of the same day is idempotent (unique violation → treated as already marked; check the unit-of-work retry first); the not-held check in register/bulk/copy moves inside their unit of work; ORM `createdAt` type matches `timestamptz`; repository spec for date keys and reason update/clear. Route: delegated writer (with T3).
- [ ] T3: API workshop marker — `WorkshopSessionNotHeld` entity/repo/ORM/mapper, delete by commission+date, mark/unmark, `POST/DELETE attendance/workshop/not-held`, workshop register/bulk blocked, GET workshop returns `notHeld`, tests. Route: delegated writer.
- [ ] T4: API wiring — `StudentWeightedAbsencesService` (theory-not-held days; `expectedContraturnoDay` returns `[]` when the workshop is marked), `CourseSnapshotBuilderService`, reporting metrics, `academic-year.adapter` working days, tests. Route: delegated writer.
- [ ] T5: Web — hooks (mark/unmark daily and workshop, invalidate the day's queries), "Clase no dictada" action + confirmation, `NotHeldNotice`, disabled actions, daily and workshop pages and containers, tests. Route: delegated writer.

## Acceptance criteria
- Marking theory not held removes that day's daily records for the course, blocks registering, and the day no longer counts as given nor as an absence.
- On a day with theory not held and workshop held, a workshop absence weighs 1; with theory held it still weighs 0.5.
- Marking a workshop not held removes the commission's workshop records for the day; a daily absence that day weighs 1, also during alert evaluation.
- Unmarking reopens registration.

## TDD
- Off (no TDD configuration in the project; same as earlier features). Checks: `pnpm --filter api test` (jest), `pnpm ts:check`, `pnpm lint:check`; T5 also vitest in `packages/ui` and `packages/hooks`, and `pnpm --filter client build`.

## Delivery
- Forecast ~1300 authored changed lines (T1 ~120, T2 ~400, T3 ~300, T4 ~200, T5 ~300). Exceeds the ~400 budget: strategy `ask-on-risk`; chain strategy `feature-branch-chain` (user, 2026-10-29). Work-unit commits on `feat/class-not-held`; push and PRs are the user's call.

## Progress / evidence
- RDD: on (global). Review boundary starts at `ce5574b`.
- Environment (resolved): `packages/common/dist` was incomplete (no `index.d.ts`), which made api `tsc` report 4 TS2345 errors in academic handlers and demo `tsc` fail on missing `@repo/common` exports; the pre-commit hook (`ts:check`) blocked the T1 commit. `pnpm --filter @repo/common build` fixed both; no source change needed (an attempted type fix was discarded).
- T1 (writer, parent read the diff): `theoryNotHeldDays` on `WeightedAbsenceInput` and `WeightedAbsenceOptions`; workshop absent weight is per day (`workshopOnly || theoryNotHeld.has(day)` → 1, else 0.5); by-student forwards it. Checks: `jest weighted-absence.spec.ts` 52/52; biome clean on both files; pre-commit `ts:check` passed after the `@repo/common` rebuild. Commit `eca736e` (also adds `docs/attendance-absence-weights.md`, user request: cases graph and weights). Review assess (`--base-ref ce5574b --committed-only`): medium, `review_due: false`, `under_budget` (255 lines) — pending in the slice.
- T2 (writer; parent read the migration, the delete and the tenant change, and re-ran the new spec 19/19): migration `Migration20261029120000_session_not_held` creates both tables (FKs to `courses` and `workshop_commissions`, ON DELETE CASCADE, unique per course/commission + date); not run against a database. `DailySessionNotHeld` entity/repo/ORM/mapper; `deleteDailyByCourseAndDate` (daily rows only; deletes their `justification` rows first because that FK has no cascade; clears the Redis day summary after commit). Endpoints (PRECEPTOR, ADMIN): `POST /attendance/daily/not-held` `{ courseId, date, reason? }` → 201 `{ deletedRecords }`; `DELETE /attendance/daily/not-held?courseId&date` → 200, idempotent, no restore; `GET /attendance/daily/not-held?courseId&date` → `{ notHeld, reason? }` (separate endpoint so the bare-array `GET daily` stays unchanged). `POST daily`, `daily/all`, `daily/copy` (target date) → 400 on a marked day. Attendance `Course` gets optional `tenantId` (set in `CourseAdapter.findById`) for the mark/unmark tenant check. Known limitation: the not-held check runs before the register unit of work, so a concurrent mark and register can race. Checks (writer): attendance jest 41 suites/400 tests; api 137 suites/1032 tests; `ts:check` 9/9; `lint:check` clean after biome formatting.
- T2 commit `ce16005`. Review assess (`--base-ref ce5574b --committed-only`): medium, `review_due: true`, `slice_budget_reached` (1367 lines, T1+T2). User granted consent. Native review lineage `review-508beeeb4f2a52ad`, lens `review-reliability`: approved; acknowledged, authority burned. Reviewed boundary advances to `ce16005`.
- Review advisory findings (informational, all introduced by T2): GET not-held unvalidated input and no tenant check (WARNING); concurrent mark may hit the unique constraint (WARNING); not-held check outside the register unit of work (WARNING, the known race); ORM `timestamp` vs migration `timestamptz` (SUGGESTION); not-held repository untested (SUGGESTION). Accepted as T2b.
- T2b (writer; parent read the GET handler and the register change): GET daily not-held validates a query DTO (400) and reports another tenant's course as 404; mark convergence under the unit-of-work unique-violation retry proven by a spec (handler already ran inside `run`); register/bulk/copy check inside their unit of work (bulk and copy gained `IUnitOfWorkPort`); ORM `createdAt` explicit `timestamptz` (MikroORM already mapped `timestamp` to timestamptz); cleared reason now persists as `null` (was `undefined`, skipped on update — real bug); new repository spec. Residual: inside the transaction the check is not a lock (READ COMMITTED), so a concurrent mark+register race is narrowed, not removed.
