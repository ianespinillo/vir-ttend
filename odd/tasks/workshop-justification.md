# Feature: Justify workshop attendance

## Status
IN PROGRESS (started 2026-10-23).

## Objective
Let preceptors (and admins) justify a workshop absence or late arrival from the workshop attendance page, the same way they do in daily attendance (reason, optional notes, "Justificado" badge).

## Problem
User report (2026-10-23): "en la sección de asistencia por taller, la prece no puede justificar".
- Known gap from `workshop-commissions.md` (T3a, T4.3): justification was never implemented for workshop records.
- UI: `workshop-attendance-page.tsx` renders `AttendanceGrid` without `onJustify`, so the "Justificar" button never shows.
- API: `JustifyAttendanceHandler` only loads `attendance_record`; workshop records live in `workshop_attendance_record`.
- DB: `justification` is 1:1 with `attendance_record`; there is nowhere to store a workshop justification.

## Decisions
- D1 (user, 2026-10-23): option B — a dedicated `workshop_justification` table (1:1 with `workshop_attendance_record`), its own entity/repository/mapper/handler. The existing `justification` table is untouched.
- D2 (parent default): same business rules as daily justification (which statuses can be justified, status becomes JUSTIFIED, academic-year checks) — mirror `JustifyAttendanceHandler`; access follows the existing workshop attendance access policy (commission preceptor or admin).

## Scope
- API: migration, domain entity + repository + ORM entity + mapper, justify command/handler, endpoint, workshop attendance GET returns the justification per record, unit tests.
- Web: hook, `WorkshopAttendancePage` justification props + `JustificationModal`, client page wiring, tests.

## Out of scope
- Mobile app workshop screen (follow-up).
- Demo app parity (new UI props stay optional).

## Checklist
- [x] T1: API — migration `Migration20261023120000_workshop_justification` (`workshop_justification`: id, unique FK `workshop_attendance_record_id` → `workshop_attendance_records` ON DELETE CASCADE, reason, notes, created_by, created_at), `WorkshopJustification` entity/repo/mapper, `JustifyWorkshopAttendanceHandler`, `POST /attendance/workshop/records/:recordId/justify` (ADMIN, PRECEPTOR; body `{ reason, notes? }`; 201 no body; 403 via workshop access policy; 404 record/commission/active year; DomainError if not absent/late), GET workshop attendance batch-loads `justification` per JUSTIFIED record, `ATTENDANCE_ROUTES.workshopJustify(recordId)`, optional `justification` on `WorkshopAttendanceRecord`. Route: delegated writer (2+ non-trivial files).
- [x] T2: Web — `useJustifyWorkshopAttendance` (invalidates `queryKeys.attendance.workshop(commissionId, date)`, falls back to `['attendance','workshop']`), `WorkshopAttendancePage` optional justify props + `JustificationModal`, client page wiring (no role gating, like daily; API enforces commission ownership), tests. Route: delegated writer (2+ non-trivial files).
- [ ] T3: API — bulk justification: `POST /attendance/justify/bulk` (daily table; also accepts subject records since they share `attendance_record`) and `POST /attendance/workshop/records/justify/bulk`, body `{ recordIds, reason, notes? }`, all-or-nothing, unit tests. Route: delegated writer (2+ non-trivial files).
- [ ] T4: Web — multi-select of justifiable saved records in `AttendanceGrid`, "Justificar seleccionados" action reusing `JustificationModal`, wired in daily and workshop pages/containers, hooks, tests. Route: delegated writer (2+ non-trivial files).

## Bulk justification (added 2026-10-23)
- User request: "agrega un bulk justification". Scope (user, 2026-10-23): daily + workshop screens. Subject screen keeps individual justification (it has it today; the parent wrongly said it didn't, then verified and corrected).
- D3 (parent default): all-or-nothing. Every record is validated first (exists, same tenant, absent/late, access); if any fails nothing is saved and the error names the failing records. Same reason/notes for all selected records.
- D4 (parent default): bulk handlers reuse the single-record rules (`JustificationService`, access policy) instead of duplicating them.

## Acceptance criteria
- A preceptor of the commission (or an admin) can justify an absent/late workshop record with a reason and optional notes; the row shows "Justificado" with the reason.
- A preceptor of another commission gets 403; daily justification behavior is unchanged.

## TDD
- Off (no TDD configuration in the project). Checks: `pnpm --filter api test` (jest), `pnpm ts:check`, `pnpm lint:check`; T2 also vitest in `packages/ui` and `packages/hooks`, and `pnpm --filter client build`.

## Delivery
- Forecast ~600 authored changed lines (API ~400 with tests, web ~200). Work-unit commits on `dev`; push is the user's call.

## Progress / evidence
- RDD: on (global). Review boundary starts at `97aee05`.
- T1 checks (writer): `jest test/unit/attendance` 37 suites/340 tests; `pnpm --filter api test` 133 suites/972 tests; `ts:check` 9/9; `lint:check` clean. Parent spot check: migration references the right table, is the latest in order, and columns match the ORM's default snake_case naming (the old `justification` table is camelCase via explicit `fieldName`). Not verified: migration run against a database.
- T1 choices to note: academic-year check uses the workshop record `date` (daily uses `createdAt`); no `AttendanceJustifiedEvent` emitted (no listeners; event is daily-specific); justified workshop absences still count in weighted absences (unchanged). No workshop controller spec exists, none added.
- T2 checks (writer): hooks vitest 42 passed; ui vitest 225 passed; demo vitest 181 passed; `ts:check` 9/9 after fixing a test type; `lint:check` clean; `pnpm --filter client build` OK. Parent re-ran `@repo/ui` tests: 36 files passed.
- T2 discrepancy caught by the parent: the writer reported that the container passes `justification` and blanks the id for unsaved status changes, but the diff did not contain it (the "Justificado" badge would never render in workshop). Parent fixed it in `apps/client/.../attendance/workshop/page.tsx`: only an unchanged saved record keeps its `id` and `justification` (`canJustify` requires an id). Client `tsc` and biome OK. Not verified: real browser run against the API.
