# Feature: Commission preceptor assignment by course preceptors + shift-scoped class suspensions

## Status
IN PROGRESS (started 2026-10-21).

## Objective
1. Let the course preceptor (`courses.preceptorId`) assign preceptors to the workshop commissions of their own course, themselves included.
2. Let a declared non-working day (class suspension) optionally apply only to specific shifts instead of the whole school.
3. Release the result as version 1.4.0 with release notes on the site blog.

## Why
User request (2026-10-21). Domain rule confirmed by the user: the course preceptor creates, reorganizes and assigns workshop commissions, including their preceptors. Classes can also be suspended for a single shift; the user agreed on an optional shift scope on the suspension instead of turning shift into an entity (shift stays the `SHIFT` enum).

## Current state (mapped)
- `PUT workshop-commissions/:id/preceptor` is `ROLES.ADMIN` only; `assign-workshop-preceptor.handler.ts` never calls `assertCanManageCommissions`; `commission-access.ts` documents assignment as admin-only.
- Create / regenerate / move-student endpoints already allow ADMIN + course PRECEPTOR.
- `DeclareNonWorkingDayRequestDto` has `date`, `reason`, `type?`, `notifySchool?`; no shift scope. Shift is `SHIFT` enum (`MORNING`, `AFTERNOON`, `EVENING`).

## Scope
- T1 covers API, UI (client + demo, mobile if it exposes assignment) and tests.
- T2 covers API (DTO, entity, persistence + migration, consumers of non-working days), UI (client + demo) and tests. Empty or missing scope = whole day, all shifts (backward compatible).
- T3 bumps every versioned package from 1.3.0 to 1.4.0 (same file set as `ded7173`) and adds `apps/site/content/blog/version-1-4-0.md`.

## Constraints
- Shift stays an enum; no Shift entity.
- Preceptors may assign only within courses where they are `courses.preceptorId`; the assignee must still be a preceptor of the tenant.

## Checklist
- [x] T1: Course preceptor can assign commission preceptors. Route: delegated writer (2+ non-trivial files). Commit `18ce01b`.
- [x] T2: Optional shift scope on non-working days. Route: delegated writer (2+ non-trivial files), run in parallel with T1 on the same worktree per user request; writers do not commit, the parent commits each work unit.
- [ ] T3: Version 1.4.0 + site release notes. Route: inline (mechanical, already understood).

## Acceptance criteria
- T1: a course preceptor gets 200 assigning a preceptor (or themselves, or null) to a commission of their course; 403 for a commission of another course; admin behavior unchanged; UI shows the assignment control to that preceptor.
- T2: declaring a suspension with shifts affects only courses of those shifts; without shifts it behaves as today; the scope is visible in the UI and in the school announcement.
- T3: all versioned packages at 1.4.0; blog post renders in the site.

## Delivery
- delivery_strategy: single-pr (user asked for one branch). Branch `feat/commission-preceptors-shift-suspensions` from `dev`.
- Push and PR creation: user's call.

## TDD
- Off (no TDD configuration in the project). Checks: `pnpm --filter api test`, `pnpm ts:check`, `pnpm lint:check`, plus ui/hooks/demo vitest where touched.

## Progress / evidence
- T1: `PUT workshop-commissions/:id/preceptor` allows ADMIN + PRECEPTOR; the handler loads the commission's course and calls `assertCanManageCommissions` for preceptors (403 for another course). `GET /users` now returns preceptors to a preceptor asking `role=PRECEPTOR` (own tenant only; any other filter still returns teachers), so the course page can list assignees. Client and demo course pages show the assignment control whenever the user can manage commissions. Mobile has no assignment UI (untouched).
- T1 checks (writer): `pnpm --filter api test` 918 passed; `pnpm --filter @repo/ui test` 213 passed; `pnpm --filter demo test` 179 passed. `pnpm ts:check` and `pnpm lint:check` failed only on T2 in-progress files at that time; both passed in the pre-commit hook once T2 was complete. The hook checks the whole working tree, so T1 could only be committed after T2 finished.
- T1 native review: assess risk medium, `review_due: false` (`under_budget`, 176 lines); pending in the slice.
- T2 design: `nonWorkingDays: Date[]` unchanged; parallel `nonWorkingDayShifts: Record<'YYYY-MM-DD', SHIFT[]>` (missing/empty = every shift). Single rule `AcademicYear.isNonWorkingDayFor(date, shift?)`; no shift given = any declared day counts (old behavior). Migration `Migration20261021120000_non_working_day_shifts.ts` adds `academic_years.non_working_day_shifts jsonb not null default '{}'` (not run against a DB; `.snapshot-vir_ttend.json` left as is, it is already stale).
- T2 consumers made shift-aware: academic `ScheduleService.getWorkingDaysOnPeriod`; attendance `ISchedulePort`/`ScheduleAdapter`, `AttendanceCalculationService` expected classes, `CourseSnapshotBuilderService` (passes `course.shift`); reporting `AcademicYearAdapter.getWorkingDaysBYAcademicYear`, `ReportGenerationService.generateMonthlyReport`; identity announcement listener (text names the shifts via `describeShiftScope` in `@repo/common`); demo store/selectors. Attendance registration never blocked non-working days, so nothing to change there. Mobile shows no non-working days.
- T2 behavior choices (writer, accepted by parent): re-declaring a registered day replaces its scope; `update-academic-year` (`addNonWorkingDay`) leaves the scope untouched; the monthly report's working-day count stays calendar days minus holidays, only made shift-aware.
- T2 UI: shift checkbox group in the declare dialog (none = all shifts); "Turno: …" badge on scoped days in the year card.
- T2 checks (writer): api 128 suites / 941 tests passed; common 75, ui 215, hooks 38, demo 181 tests passed; `pnpm ts:check` 9/9; `pnpm lint:check` clean. The API resolves `@repo/common` from `dist`: rebuild common before running the API. Not verified: migration against a real DB; no UI test for the checkbox group.

## Next step
Launch the T1 and T2 writers.
