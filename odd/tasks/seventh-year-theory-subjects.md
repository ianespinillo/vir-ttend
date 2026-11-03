# Feature: 7th-year theory subjects taught in the workshop shift

## Status
IN PROGRESS (2026-11-02). Branch `feat/seventh-year-theory-subjects` from `dev` (`cc725c0`), worktree `.claude/worktrees/seventh-year-theory-subjects` (parallel with `feat/subject-commission-teachers`).

## Objective
Support theory subjects in 7th-year technical courses: they keep theory properties but are taught in the workshop shift, and their attendance is the workshop attendance taken by the commission's workshop preceptor.

## Problem
- User (2026-11-02): "los 7mos si tienen materias teoricas (aunque se dictan en taller)" and "la materia sigue siendo de taller, pero tiene las propiedades de una materia teorica". Supersedes the premise "7th year has no theory subjects" (`isWorkshopOnlyCourse` doc comment, `commission-fixes.md` S7).
- Today a THEORY subject can be created in 7th, but its slots do not count as workshop days (`getWorkshopDays` only counts WORKSHOP slots), so the workshop preceptor has no workshop day for it, and teachers are still offered per-subject attendance.

## Decisions
- D1 (user, 2026-11-02): attendance of these subjects is the workshop attendance taken by the workshop preceptor (option 3). No own per-subject attendance.
- D2 (user, 2026-11-02, scope accepted): theory properties kept: `kind` THEORY, slots target the whole course (no commission select), single weekly-hours cap. Workshop properties (only in workshop-only courses, `isWorkshopOnlyCourse`): THEORY slots count as workshop days for every commission of the course; per-subject attendance is rejected by the API and hidden from teacher screens (web and mobile).
- D3 (parent default): the rule is derived from course + kind, no new subject field: "subject has own attendance" = not (THEORY and workshop-only course). WORKSHOP subjects in 7th keep today's behavior.
- D4 (parent default): teacher subject lists expose a boolean (e.g. `hasSubjectAttendance`) so web/mobile hide or show a notice instead of each client re-deriving the rule.

## Debt
- DEBT-1 (user, option 2): the subject teacher takes attendance per commission for these subjects. Not implemented now; depends on `feat/subject-commission-teachers` (teacher per commission).

## Scope
- API: workshop days include THEORY slots in workshop-only courses (workshop commission adapter, weighted absences, my workshop commissions); subject attendance commands/queries reject THEORY subjects of workshop-only courses; teacher subject list flag; `@repo/common` doc comment and message constant.
- Web/mobile: teacher subject attendance hidden or replaced by a notice for those subjects.
- Demo: same workshop-days rule in its selectors/seed so parity holds.

## Out of scope
- DEBT-1. Teacher per commission (other feature).

## Checklist
- [ ] T1: API + common — workshop days rule, subject attendance rejection, teacher subject list flag, doc comment/message. Route: delegated writer (2+ non-trivial files).
- [ ] T2: Web + mobile + demo — hide/notice for subjects without own attendance; demo workshop-days parity. Route: delegated writer (same writer, follows T1).

## Acceptance criteria
- In a 7th-year technical course, a THEORY subject's slot day is a workshop day for both commissions; the workshop preceptor takes attendance that day; absence weight stays 1.
- Registering, bulk-marking, copying or reading per-subject attendance for that subject is rejected with a clear message.
- Teacher screens do not offer per-subject attendance for it.
- Non-7th courses and WORKSHOP subjects in 7th are unchanged.

## Checks
- TDD: off (not declared in project configuration; source: convention of `odd/tasks/class-not-held.md`). Ordinary functional checks still run.
- `pnpm --filter api test`, `pnpm ts:check`, `pnpm lint:check`, vitest in `packages/common` / `packages/ui` / `apps/demo`, `pnpm --filter mobile ts:check`.

## Delivery
- Strategy: ask-on-risk. Forecast about 400 to 600 authored changed lines.
- RDD: on (global). Assess each work-unit commit.

## Progress
- Exploration done (mapper): kind branches, `isWorkshopOnlyCourse` users, workshop days filters.
- T1 done `b823d66` (route: delegated writer; first run stalled, resumed). +529/-30. `getWorkshopDays` counts THEORY slots in workshop-only courses (weighted absences and my workshop commissions reuse it); `assertSubjectHasOwnAttendance` in register, bulk, copy, get attendance, get history; `hasSubjectAttendance` in `GET /subjects/mine` and teacher subjects list.
- T2 done `fc6e163` (route: delegated writer). +341/-24. Web filter + notice, mobile home/preload/my-courses/subject screen, demo selectors/seed/store.
- Verification (writer): api 143 suites / 1114 tests (temporary jest config with `testRegex`, because jest's glob ignores the `.claude` path segment of this worktree; e2e skipped); common 78, hooks 59, ui 267, demo 184; `pnpm ts:check` 9/9; `pnpm --filter mobile ts:check` pass; `pnpm lint:check` clean. One flaky `tenancy-single-tenant.spec.ts` failure in one full run, green alone and on rerun.
- RDD `cc725c0..fc6e163`: high (hot path bulk-update-subject-status), granted, 4 lenses, approved, acknowledged (lineage `review-d204ca8c3afba14e`, authority burned).
- Advisory follow-ups (non-blocking): R4 subject history is also rejected for these subjects (records taken before this change become unreadable per subject); R4 mobile offline writes queued before the update are rejected on sync; R3 mobile notice can race the cached flag; R3 `subject.adapter.ts:28-29` derivation untested; R2 duplicated workshop-days rule and unknown-course fallback.

## Next step
- Delivery: merge into `dev` together with or after `feat/subject-commission-teachers` (both touch subject attendance handlers; expect small conflicts).
