# Feature: Workshop commissions — taller attendance in contraturno (technical schools)

## Status
IN PROGRESS (started 2026-10-14, after student bulk import). Delivery: its own feature branch (not direct to main), per user 2026-10-13.

## Objective
Support the technical-school workshop (taller): each course is split into commissions that attend the workshop in the opposite shift, and a workshop preceptor takes attendance per commission, similar to daily attendance.

## What we know (from the user)
- Only technical schools have it. Courses there are numeric, e.g. 1°4°, and are split into commissions named 141 and 142.
- Commissions never mix divisions: both come from the same course.
- The split is alphabetical by last name (then first name), aiming at 50/50.
- One workshop preceptor per commission (user: "es por comisión, creo" — tentative, confirm).
- Always exactly 2 commissions per course (user 2026-10-13). Codes derive from the course: yearNumber + division + 1|2 (1°4° → 141, 142), so no free-text code is needed.
- Workshop days are known from the workshop subjects (materias de taller) and their schedule (user 2026-10-13). Implication: subjects need a type (theory vs workshop); workshop days for a commission come from its workshop subject slots.
- Workshop slots depend on the slot: the two commissions may or may not share days/times (user 2026-10-13). Implication: a schedule slot of a workshop subject targets commission 1, 2 or both (e.g. nullable commission on the slot = both). Overlap validation must allow simultaneous slots for different commissions, and the weeklyHours check must apply per commission, not summed across both.
- Out of scope for now: per-subject attendance by workshop teachers (user 2026-10-13). Only the commission's workshop preceptor takes workshop attendance.
- Workshop attendance must work on web first, then the mobile app (two phases, both in scope) (user 2026-10-13).
- A workshop absence counts as 0.5 toward the student's absence total (user 2026-10-13).
  - Implication: today no weighted absences exist (counts are whole numbers); totals, thresholds and reports must handle fractional values.

## Current state (mapped)
- Daily attendance: one record per student/course/date (`subjectId = NULL`), taken by PRECEPTOR/ADMIN. Subject attendance: per subject/date, taken by the subject teacher.
- One preceptor per course (`courses.preceptorId`), one shift per course (`courses.shift`). No contraturno, no session type, no technical-school flag.

## Design
- D1: New entity `WorkshopCommission` under `Course`: code (e.g. 141), students, workshop preceptor. A course "has workshop" iff it has commissions — no school-type flag.
- D2: Workshop attendance per commission per day, mirroring daily attendance, taken by the commission's preceptor.
- D4: Students belong to at most one commission: nullable `workshopCommissionId` on the student (single membership enforced by the column). A course change clears it.
- D5: Subject `kind`: `theory` (default) | `workshop`. Workshop sections (carpintería, electricidad…) are just workshop subjects with their teacher; no extra entity.
- D6: Schedule slot gets nullable `commissionNumber` (1 | 2; null = both), allowed only on workshop subjects.
- D3: The split is SUGGESTED alphabetically when commissions are created, then PERSISTED. Never recomputed live (a mid-year arrival would shift the cut and move students with their absence history). New students go to the smaller commission; admin can move students; explicit "regenerate split" action.

## Open questions (ask one at a time)
- Q1: Confirm one preceptor per commission with the school. The model (preceptor per commission) also covers one person for both: assign the same user twice.

## Delivery
- Forecast well over 400 authored changed lines → chained PRs. chain_strategy: feature-branch-chain (same as student bulk import; the user wants these features on their own branch).
- Tracker `feat/workshop-commissions` (draft, no-merge tracker PR into `main`). One child branch per task, each targeting the previous one: `feat/workshop-commissions-model` (T1) → tracker, then T2, T3, T4, T5 chained.
- Push and PR creation: user's call.

## TDD
- Off (no TDD configuration in the project). Checks: `pnpm --filter api test`, `pnpm ts:check`, `pnpm lint:check`; UI tasks also vitest (`packages/ui`, `packages/hooks`) and `pnpm --filter client build`.

## Checklist
- [x] T1 (route: delegated writer; commit `0cf0f6e`): Domain + persistence — subject type (theory | workshop); WorkshopCommission entity (course, number 1|2, preceptor, students) + migration; optional commission on schedule slots; schedule validation per commission (overlap + weeklyHours).
- [x] T2 (route: delegated writer; commit `e7ecbe3`): Commission management — create the 2 commissions with an alphabetical 50/50 suggestion, persist; assign preceptor; move a student; explicit regenerate; new students join the smaller commission.
- [x] T3a (route: delegated writer; commit `fd14aed`): Workshop attendance API — record/list per commission per day, taken by the commission preceptor (or ADMIN); separate table.
- [ ] T3b: Weighted totals — workshop absence counts 0.5 in student absence totals, thresholds/alerts and reports (fractional values). Map the totals code first.
- [ ] T4: Web UI — subject type in the subject form, commission selector on workshop slots, commissions screen in the course, workshop attendance screen for the preceptor.
- [ ] T5: Mobile — workshop attendance in the app (after web).
- Decided (parent, 2026-10-14): workshop attendance uses its own table `workshop_attendance_records`. Reusing `attendanceRecord` would make every existing absence query silently count workshop rows as full absences; a separate table keeps current totals unchanged until T3b adds the 0.5 weight explicitly.

## Progress / evidence
- T1: subject `kind` (`subjects.kind` default theory); `workshop_commissions` (tenant_id, course_id FK cascade, number 1|2 CHECK, preceptor_id, unique (course_id, number)); `students.workshop_commission_id` FK set null + index; `schedule_slots.commission_number` CHECK null|1|2. Migration `Migration20261014120000_workshop_commissions.ts` with down().
- T1 checks: `pnpm --filter api test` 86 suites / 496 tests; `pnpm ts:check` 9/9; `pnpm lint:check` only the 5 known warnings.
- NOT VERIFIED: the migration was never run (no reachable local DB; Docker Desktop not running). Parent read it against the ORM entities (underscore naming) and the base tables: consistent. Must run up/down on a real Postgres before this reaches main (CD runs migrations on the VM).
- Found on the way, separate commit `90bfe1f`: `PUT /subjects/:id` passed name and area swapped to `UpdateSubjectCommand`, so editing a subject stored the name as the area and vice versa.
- Notes for later tasks: shared response types keep `kind`/`commissionNumber` optional (demo seed/mocks); client `checkScheduleOverlap` ignores commissions (T4).
- T1 review: first 4-lens review (lineage review-81a68a4981364fa1) went terminal `corrupted_or_unverifiable_authority` on its own correction continuation (Gentle AI defect; occurrence reported on gentle-ai#4571 with user consent; candidate declined per protocol). Its inferential CRITICAL (mappers drop new columns on read) was a false positive, now disproved by mapper round-trip tests. Real findings fixed in `cb6aafb`: workshop→theory rejected while slots have a commission; `UpdateSubjectCommand` now (name, area) like create; tests for handler, controller and mappers (507 API tests pass).
- T1 final review: 4 lenses, approved and acknowledged (lineage review-dbedf4075e091f56). Advisory: migration unverified (WARNING), duplicated commission rule/constants, TOCTOU on kind change, DTO validation untested.
- T2: endpoints POST/GET /courses/:courseId/workshop-commissions, PUT /workshop-commissions/:id/preceptor, PUT /workshop-commissions/:id/students/:studentId, POST /courses/:courseId/workshop-commissions/regenerate ({confirm:true}). WorkshopPlacementService places new/re-enrolled students in the smaller commission (tie → 1). Checks: 89 suites / 533 API tests, ts:check 9/9, lint 5 known warnings.
- Found on the way, separate commit `db895f3`: PUT /courses/:id/preceptor passed (id, preceptorId) to AssignPreceptorCommand(preceptorId, courseId) → always "Course not found". No client calls it today, so no production impact.
- T2 decision gaps: regenerate without commissions → 404; preceptor check does not filter inactive memberships (existsAndHasRole); concurrent create → 500 from the unique constraint instead of 409.
- T2 review: medium, 1 lens, approved and acknowledged (lineage review-bafe0560b1e074da). Advisory: UoW atomicity untested, concurrent create → 500, assign-preceptor fix untested.
- T3a: table `workshop_attendance_records` (types match `attendanceRecord`; unique (commission, student, date); FK commission cascade). Endpoints POST /attendance/workshop, POST /attendance/workshop/all, GET /attendance/workshop?commissionId&date, GET /attendance/workshop/my-commissions?date (hasWorkshopToday from workshop subject slots). Access: commission preceptor or ADMIN. No events, no totals. Checks: 93 suites / 552 API tests, ts:check 9/9, lint 5 known warnings. Migration not run (no DB). Writer stalled once (stream watchdog) and was resumed.
- T3a gaps: justify not implemented (justification is 1:1 with attendanceRecord); inactive students drop from the read view.
- T3a review: medium, 1 lens, approved and acknowledged (lineage review-cd9c596a2f6cb340). Advisory: concurrent insert → 500 (unique constraint), date normalization, timestamp type drift, adapter contracts untested.

## T3b mapping (delegated mapper, 2026-10-14)
- No single definition of an absence total today; daily and subject rows are mixed almost everywhere; late is never fractional (full absence in snapshot and reports; minutes-based only in alerts); justified counts as an absence in reports only.
- Sites to change for workshop weight 0.5: alert percent (`attendance-calculation.service.ts` via `generate-alert.handler.ts`), report service (`report-generation.service.ts` countByStatus/calculateAbsencePercent, monthly and detailed student reports), optionally the course snapshot (`course-snapshot.vo.ts`, raw SQL counts in `attendance-record.repository.ts` parsed with parseInt). Leave per-day metrics, subject history and weekly trend alone.
- Integer hazards: parseInt on SQL counts, Math.round in metrics/excel, String(n)/raw `%` formatting in PDF/Excel and several UI cards. Mobile shows no totals.
- PRE-EXISTING PRODUCTION BUG (verified by the parent): `generate-alert.handler.ts` calls `calculateAbscensePercent` without subjectId, so expectedClasses = 0 → percent = total/0 = Infinity on a student's first absence → an "exceeded" alert is saved with absence_percent Infinity. Also `alert.trigered` is emitted while the listener waits for `alert.triggered`, so the alert listener never runs.
- Recommended design: one pure function computing weighted totals (WORKSHOP_ABSENCE_WEIGHT = 0.5) used by alerts and reports; workshop save emits an event so alerts can fire; a count formatter for .5 values.
- Open product questions (ask one at a time): fix the alert bug first and how (denominator = expected course classes?); do workshop days add to the denominator; does workshop late/justified weigh anything; do workshop absences trigger alerts; show them in dashboards/snapshots or only in reports/alerts; unify the late/justified inconsistency now or later; recompute stored monthly reports or only new ones.
