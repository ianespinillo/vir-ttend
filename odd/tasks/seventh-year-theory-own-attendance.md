# 7th-year theory subjects: own subject attendance by the teacher

## Status
In progress. Branch `feat/seventh-year-theory-own-attendance` (from `origin/dev`).

## Objective
Teachers of theory subjects in workshop-only courses (7th year technical) can take their own subject attendance, for the whole course.

## Problem
Feature `seventh-year-theory-subjects` chose "option 3": those subjects have no own attendance (`Subject.hasOwnAttendance` false, `assertSubjectHasOwnAttendance` rejects with `WORKSHOP_SHIFT_THEORY_SUBJECT_ATTENDANCE_MESSAGE`; web/mobile show a notice instead). Per-teacher attendance was recorded as debt ("option 2").

## Why
User (2026-11-16): the teacher's metric must not be connected to the school's; so the teacher must be able to take attendance. Subject attendance is already a separate metric (the school's weighted absences, snapshots and alerts do not read it).

## Decisions
- Whole course (user: "todo"), like any theory subject: no commission scoping.
- Workshop attendance taken by the commission preceptor stays the school attendance. In workshop-only courses theory slots keep counting as workshop days (`getWorkshopDays`) — unchanged.
- Subject attendance must not feed school metrics (weighted absences, alerts, reports of school attendance).

## Scope
API attendance module (subject entity/policy/handlers), `packages/common` (flag/message), `packages/hooks`/`packages/ui`, `apps/client`, `apps/mobile`, `apps/demo` parity if it mirrors the rule, tests.

## Out of scope
- Changing how workshop/daily (school) attendance is computed.

## Checklist
- [x] T1 — Allow own subject attendance for theory subjects of workshop-only courses (API + common + web + mobile + demo), whole course, remove the "no own attendance" notice; keep school metrics unaffected; tests. Route: delegated writer (2+ non-trivial files).

## Acceptance criteria
- A teacher assigned to a theory subject of a 7th-year technical course can list the whole course and register subject attendance (API 2xx, UI available on web and mobile).
- Registering it does not change the student's school weighted absences or alerts.
- Workshop attendance and workshop-day rules for those courses are unchanged.

## TDD
Off (no TDD configuration in the project). Checks: `pnpm --filter api test`, `pnpm ts:check`, `pnpm lint:check`, vitest in touched packages, `pnpm --filter client build`.

## Delivery
Strategy `ask-on-risk`. Forecast ~250 authored lines: under budget, single PR against `dev`.

## Progress / evidence
- Feature document created.
- T1 done `e7f91a4` (route: delegated writer; 38 files, +115/-695). Removed the concept cleanly instead of leaving a permanently true flag: `hasSubjectAttendance`/`hasOwnAttendance`, `assertSubjectHasOwnAttendance`, `WORKSHOP_SHIFT_THEORY_SUBJECT_ATTENDANCE_MESSAGE`, `SubjectResponseDto`/`MySubjectResponseDto` field, `ISubjectResponse` field, web/mobile/demo notices and filters. Kept `getWorkshopDays` (theory slots count as workshop days), workshop/daily attendance, weighted absences. Tests: rejection tests removed; added register handler test (whole course, no commission scoping), `SubjectAdapter` test (7th-year theory subject taught for 'all'), demo store test (marks whole-course attendance).
- Isolation evidence: subject records have `subjectId` set; weighted absences read only `findDailyByStudentAndDateRange`/`findDailyByCourseAndDateRange` (`subjectId: null`, attendance-record.repository.ts) plus workshop records (student-weighted-absences.service.ts, course-snapshot-builder.service.ts); reports use the daily ports (report-generation.service.ts). The `attendance.registered` event emitted by subject saves only re-runs `GenerateAlertHandler`, which recomputes from the same daily+workshop sources. No gap found.
- Checks: `pnpm ts:check` pass (9 pkgs incl. mobile, demo); `pnpm lint:check` pass; vitest common 93, ui 283, hooks 59, demo 184 pass; `pnpm --filter api test` 1195 pass; `pnpm --filter client build` pass; mobile has no test script.

- Native review (base `59fecb5`, high, user granted, 4 lenses): approved and acknowledged (lineage `review-336d1f246bfee2dd`, authority burned). Advisory findings confirmed as introduced by T1: no-class warning and extra actions rendered without a selected subject; page test deleted. Fixed inline in `ae107b3` (restored the selected-subject gate) with a new page test (3 tests). PR #123 against `dev`.

## Next step
Merge PR #123 (user), then the `dev` -> `main` PR.
