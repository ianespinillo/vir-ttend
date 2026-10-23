# Feature: Course activate/deactivate + student history fixes

## Status
IN PROGRESS (2026-10-23). T1–T3 pushed to `dev`; T4 (review follow-ups) authorized by the user ("si").

## Objective
Let admins deactivate and reactivate a course without losing data, and make the student attendance history tab agree with the present counter.

## Problem (production report, 2026-10-23)
1. Student history tab showed a "Presente" row on 21/10 with no daily record in the DB, and the present counter did not count it.
   - Cause: `GetAttendanceByStudentQueryHandler` used `findByStudentAndDateRange`, which does not filter `subjectId`, so subject attendance rows were mixed into the daily history. The counter (`MetricsCalculationService.calculateStudentMetrics`) only counts daily records (`subjectId: null`).
   - Same handler: missing `else` pushed every JUSTIFIED record twice; the query used exclusive bounds (`$gt`/`$lt`) and dropped the first and last day of the range.
2. Workshop attendance listed only one of the two 7th-grade courses for an admin.
   - Cause: course `7° 1°` had `is_active = false`. The only way to get there is `DELETE /courses/:id`, which also soft-deletes the course's subjects and hard-deletes its schedule slots. The workshop commissions adapter filters inactive courses; the commissions panel does not, so the panel still showed them.
   - The course is in use; the deletion was a mistake.

## Why
There is no reversible way to take a course out of use, and no way to undo a mistaken delete. The frontend does not even receive `isActive`.

## Scope
- History tab: daily records only, no duplicated justified rows, inclusive date bounds.
- `PATCH /courses/:id/status` `{ isActive }` (ADMIN). Only flips the flag; no cascade. `DELETE` keeps its current cascade.
- Expose `isActive` in the course response (API DTO + `ICourseResponse`).
- UI: "Desactivar"/"Activar" action in course detail and an "Inactivo" badge in course card and detail.

## Decisions
- D1 (parent default, user did not pick between A/B; user said "fixea todo"): option A — inactive is a visible state; only workshop attendance hides inactive courses (current behavior). Hiding inactive courses from daily/subject attendance and rejecting new attendance (option B) is out of scope, can be added later.
- D2: the status route follows the shape of `PATCH /users/:id/status`, but validates the whole body with `SetCourseStatusRequestDto` (`@IsBoolean()`) instead of the bare `@Body('isActive')`, which has no validation.

## Out of scope
- Restoring soft-deleted subjects or hard-deleted schedule slots from the app. Production recovery of `7° 1°` is a data fix (see Production recovery).
- Demo app parity: the new course-detail prop is optional; the demo store has no course delete.

## Checklist
- [x] T1: History tab uses daily records only; justified not duplicated; inclusive bounds; unit spec. Route: inline (one handler + one new spec, mechanical, already understood). Commit `57a15a8`.
- [x] T2: API — `SetCourseStatusHandler`, `PATCH /courses/:id/status` (ADMIN, `{ isActive: boolean }` validated with `@IsBoolean()`, 200 `CourseResponseDto`, 404 missing/other tenant), `isActive` required in `CourseResponseDto` and optional in `ICourseResponse` (~15 demo/fixture implementers), route constant `ACADEMIC_ROUTES.courseStatus(id)`, unit tests. Route: delegated writer (2+ non-trivial files).
- [x] T3: UI — `useSetCourseStatus` hook (invalidates course detail, `['courses']`, `['attendance','workshop']`), `CourseDetail` `onToggleActive`/`isTogglingActive` (Activar/Desactivar inside `canManage`, outline), "Inactivo" badge in `course-card` and `course-detail`, client page wiring gated by `isAdmin` with confirm only on deactivate, tests. Route: delegated writer (2+ non-trivial files).
- [x] T4: Review follow-ups — request-validation spec for `SetCourseStatusRequestDto` through `ValidationPipe` (missing, null, "false" rejected; true/false accepted); handler spec for a course with a preceptor (name returned) and a preceptor that no longer exists (fallback); client toggle wiring test if `apps/client` has a test runner (otherwise reported, no new infra); D2 corrected. Route: delegated writer (2+ non-trivial test files).

## Acceptance criteria
- History tab and present counter use the same daily records.
- An admin can deactivate and reactivate a course; nothing else (subjects, schedule, students) changes.
- Inactive courses show an "Inactivo" badge; workshop attendance lists the course again after reactivation.

## TDD
- Off (no TDD configuration in the project). Checks: `pnpm --filter api test` (jest), `pnpm ts:check`, `pnpm lint:check`; UI tasks also vitest in `packages/ui` and `packages/hooks`, and `pnpm --filter client build`.

## Delivery
- Forecast ~450 authored changed lines (API ~200 with tests, UI ~200 with tests, T1 ~60).
- User asked to push to `dev` directly ("fixea todo lo que te dije y pushea a dev"). Work-unit commits on `dev`; no PR.

## Production recovery (data, run by the user)
- `UPDATE course SET is_active = true WHERE id = '7e5d2b5a-3b23-4076-91d1-17052e352df9';` (or use the new action once deployed).
- Subjects soft-deleted by the delete cascade: restore those whose `deleted_at` matches the course deletion time (check first).
- Schedule slots were hard-deleted and must be re-entered.

## Progress / evidence
- RDD: on (global). Review boundary starts at `22e61d5` (branch point of this work on `dev`).
- T1 checks: new spec `get-attendance-by-student.handler.spec.ts` 2/2 passed; pre-commit `ts:check` 9/9 and `lint:check` clean. Review assess: medium, `under_budget` (152 lines) → pending in slice.
- T2 checks (writer): `jest test/unit/academic` 45 suites/273 tests passed; `pnpm --filter api test` 127 suites/916 tests passed; `pnpm ts:check` 9/9; `pnpm lint:check` clean. Parent spot check: handler + controller specs 9/9 passed. Commit `87b4ca1`. Review assess: medium, `under_budget` (364 lines).
- T3 checks (writer): hooks vitest 40 passed; ui vitest 219 passed; demo vitest 179 passed; `pnpm ts:check` 9/9; `pnpm lint:check` clean; `pnpm --filter client build` 29/29 pages. Parent spot check: course-detail + course-card tests 13/13 passed; verified `CourseDetailResponseDto` extends `CourseResponseDto` so the detail receives `isActive`. Not verified: real browser run against the API. Commit `183f314`.
- Native review: assess medium, `slice_budget_reached` (633 lines, base `22e61d5`) → consent granted by the user → lens `review-reliability` → approved, acknowledged (lineage `review-553edbb48c600cc6`, authority burned). Reviewed boundary is now `183f314`.

## Follow-ups (advisory review findings, non-blocking)
- Boundary-day finding refuted: `findDailyByStudentAndDateRange` uses `$gte`/`$lte` (`attendance-record.repository.ts:160`).
- R3-status-body-validation-untested: no test drives `PATCH /courses/:id/status` through the validation pipe (missing, string "false", null).
- R3-preceptor-name-path-untested: handler spec never covers a course with a preceptor (`preceptorName` lookup).
- Client page toggle wiring has no automated test.
- Option B (inactive courses hidden from daily/subject attendance, new attendance rejected) not done.
- T4 (writer + parent): new `set-course-status.request-validation.spec.ts` (true/false accepted and kept boolean; missing, null, "false", "true", 0 rejected) and two handler cases (existing preceptor name; missing preceptor → 'Sin asignar'). Writer found a real bug: the global pipe's `enableImplicitConversion` turned the string "false" into `true`, so `{"isActive":"false"}` passed validation and would have activated the course. Parent fixed it in `SetCourseStatusRequestDto` with `@Transform(({ obj }) => obj.isActive)` so `@IsBoolean()` sees the raw value; the 3 string/number cases fail without the fix and pass with it. Client toggle test not done: `apps/client` has no test runner (no new infra added). Checks: course status specs 13/13; writer `pnpm --filter api test` 128 suites/922 tests, `ts:check` 9/9, `lint:check` clean.
