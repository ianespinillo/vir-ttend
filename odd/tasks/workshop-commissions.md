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

## Counting rules (decided 2026-10-14, source: PBA Res. conjunta 1650/2024, Anexo 4 "Asistencia", verified)
- Source text read by the parent: https://normas.gba.gob.ar/anexos/descargar/LVNgaR06.pdf. Engram: `domain/pba-attendance-rules`.
- §8: absences are computed per full school day. One shift only → 1. One shift + contraturno activities (regardless of length) → 1/2 per shift. So on a student's workshop day: daily (theory) absent = 0.5, workshop absent = 0.5; the day never exceeds 1.
  - SUPERSEDES the earlier "reading A" (theory 1 + workshop 0.5 = 1.5/day), which the user first described and then dropped after the norm was read (user: "implementá", 2026-10-14).
- A "workshop day" for a student is schedule-based: the student's commission has a workshop-subject slot on that weekday (slot `commissionNumber` null or equal to the commission number). Rationale: §8b talks about the obligation to attend, not about whether attendance was taken. Known limit: slots are current, not historical.
- §9: late up to 20 minutes → 0.25 (theory and workshop alike). This replaces today's "late = full absence" in reports, for every school.
- Late beyond the tolerance is NOT regulated by the norm. School criterion (user): 0.5. Modeled as a new status chosen by the preceptor (option B, user 2026-10-14) for daily and workshop attendance; no arrival time stored. Option A (arrival time vs shift start) deferred to institution config. The broken minutesLate (`attendance-calculation.service.ts:36`, `createdAt - editedAt` with `.getMinutes()`) goes away.
- Weights: daily absent 1 (0.5 on a workshop day); workshop absent 0.5; late 0.25; late beyond tolerance 0.5. Justified absences still count (§24 counts "justificadas o no"); per-student exceptions belong to the extensions feature.
- §7: institutional cap 28 per year (constant for now). §10: exceeding it does not drop the student. §11: per-subject 75% of classes effectively given applies only after exceeding the cap, computed at year end (NOT in T3b scope).
- Alerts (§24–26): count-based on the weighted total, at 10, 20 and the student's cap (28 for now). Replaces the percent-based alert (which produced Infinity).
- Percentages stay as statistics only (dashboards, reports, per subject), with the denominator = classes effectively given (days with attendance taken), never the schedule; no classes → no percentage.
- Out of T3b scope (user 2026-10-14): per-student cap extensions (+N with a reason: the "+5" practice, pregnancy +30 §14, paternity §16, gender violence §19, sport §17) → separate feature; design T3b around a per-student cap so they plug in later. Weights, cap and tolerance → institution settings later; T3b keeps them as named constants in one pure weighting function.
- Not in the norm (former school councillor's claims): "+5 → 33" and "85% per subject" (the annex says 75%).

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
- [ ] T3b: Weighted totals per "Counting rules" (branch `feat/workshop-commissions-weighted-totals`, child of the T3a branch). Split:
  - [x] T3b.1 (route: delegated writer — touches shared enum, API, web and mobile pickers; commit `fd8d93b`): new status "late beyond tolerance" end to end (shared enum, DB checks/migration if any, DTO validation, daily + workshop attendance, web and mobile daily-attendance pickers, labels).
  - [x] T3b.2 (route: delegated writer; commit `6943b29`): one pure weighting function (named constants) + workshop-day resolver from commission slots; per-student weighted total over daily + workshop records with the per-day rule; per-student cap (28 constant, extension-ready). Unit tests for every weight and the day cap.
  - [ ] T3b.3 (route: delegated writer): alerts count-based on the weighted total at 10/20/cap; drop the percent alert and broken minutesLate; fix the `alert.trigered` event typo; workshop attendance saves trigger alert evaluation. Also from the T3b slice review: make workshop-date keys timezone-safe (R3-tz-key-mismatch) with a non-UTC fixture test.
  - [ ] T3b.4 (route: delegated writer): reports and stats use the weighted total; percentages over classes effectively given; fractional formatting (.25/.5/.75) in PDF/Excel/UI cards. Stored monthly reports are not recomputed (assumption: only new ones).
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

- T3b.1: `ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE = 'late_beyond_tolerance'` + `isLateStatus` helper in common; status columns are varchar without CHECK/enum, so no migration; DTOs use `@IsEnum`, so daily/subject/workshop endpoints accept it. Existing aggregations treat it as LATE (attendance-calculation, repository SQL FILTER counts, subject history, metrics, report-generation, justification). Web select "Tarde (fuera de tolerancia)"; mobile daily picker segment "TF"; demo app mapped to late. `LatePolicyService.adjustStatus` is never called (dead code; T3b.3). Checks (writer): api 94 suites / 560 tests; ts:check 9/9; lint 5 known warnings; client build OK; ui 83 tests; hooks 19 tests. Parent spot check: new spec 7/7 pass.
- T3b.1 gaps: the web status select is shared with subject attendance, so the subject page also offers the new status (harmless: subject attendance does not feed the institutional total); mobile label "TF" and color are writer choices.
- T3b.1 review assess (base `38ac3eb`, committed-only): risk medium, review_due false, `under_budget` (194 lines) → stays pending in the slice; boundary stays `38ac3eb`.

- T3b.2: `weighted-absence.ts` (constants DAILY_ABSENT_WEIGHT 1, CONTRATURNO_SHIFT_WEIGHT 0.5, LATE_WEIGHT 0.25, LATE_BEYOND_TOLERANCE_WEIGHT 0.5, MAX_DAILY_ABSENCE 1, INSTITUTIONAL_ABSENCE_CAP 28; `calculateWeightedAbsences({ dailyRecords, workshopRecords, scheduledWorkshopDates })` → `{ total, breakdown: { daily, workshop } }`; `toDateKey`), `workshop-dates.ts` (`selectWorkshopDates`), `StudentWeightedAbsencesService.getStudentWeightedAbsences(studentId, academicYearId, period?)` → `{ total, cap, breakdown }`, `getStudentAbsenceCap` (28, extension point). New reads: `IWorkshopCommissionPort.findByStudent`, `findDailyByStudentAndDateRange` (subjectId null, inclusive), workshop `findByStudentAndDateRange`. Absent/justified 1 (0.5 on contraturno day); late never halved; daily counted first, workshop gets the remainder under the day cap. Checks (writer): api 96 suites / 596 tests; ts:check 9/9; lint 5 known. Parent spot check: weighted-absence specs 34/34.
- T3b.2 assess (base `38ac3eb`): medium, `slice_budget_reached` (928 lines) → review due.
- T3b slice review (T3b.1 + T3b.2, base `38ac3eb`..`6943b29`): user granted; 1 lens (reliability); approved and acknowledged (lineage review-d8d1b8606f60791f). Boundary advances to `6943b29`. Advisory: R3-tz-key-mismatch (WARNING: toDateKey is UTC while ScheduleService working days use local getDay → a daily absence could weigh 1 instead of 0.5 off-UTC; queued in T3b.3), R3-range-queries-untested (WARNING: no DB, repository range queries unverified), R3-minutes-late-extended (SUGGESTION: removed in T3b.3).
- Review tooling note: a hook-proposed START over the whole accumulated branch (base `34b8a5a`, 124 files) was granted by the user but refused with `invalid_request` while the T3b.2 writer had untracked files in the workspace; not reproduced on a quiet workspace, not reported. The slice review above replaced it.

## T3b mapping (delegated mapper, 2026-10-14)
- No single definition of an absence total today; daily and subject rows are mixed almost everywhere; late is never fractional (full absence in snapshot and reports; minutes-based only in alerts); justified counts as an absence in reports only.
- Sites to change for workshop weight 0.5: alert percent (`attendance-calculation.service.ts` via `generate-alert.handler.ts`), report service (`report-generation.service.ts` countByStatus/calculateAbsencePercent, monthly and detailed student reports), optionally the course snapshot (`course-snapshot.vo.ts`, raw SQL counts in `attendance-record.repository.ts` parsed with parseInt). Leave per-day metrics, subject history and weekly trend alone.
- Integer hazards: parseInt on SQL counts, Math.round in metrics/excel, String(n)/raw `%` formatting in PDF/Excel and several UI cards. Mobile shows no totals.
- PRE-EXISTING PRODUCTION BUG (verified by the parent): `generate-alert.handler.ts` calls `calculateAbscensePercent` without subjectId, so expectedClasses = 0 → percent = total/0 = Infinity on a student's first absence → an "exceeded" alert is saved with absence_percent Infinity. Also `alert.trigered` is emitted while the listener waits for `alert.triggered`, so the alert listener never runs.
- Recommended design: one pure function computing weighted totals (WORKSHOP_ABSENCE_WEIGHT = 0.5) used by alerts and reports; workshop save emits an event so alerts can fire; a count formatter for .5 values.
- Open product questions: all resolved on 2026-10-14, see "Counting rules".
