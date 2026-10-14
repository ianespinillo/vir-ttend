# Feature: Student bulk import — upload a fixed .xlsx template per course

## Status
IN PROGRESS (started 2026-10-13). Prioritized over workshop commissions by the user.

## Objective
Let school staff load a whole course's students at once, self-service, without the developer handling student data.

## Why
User request (2026-10-13). A colleague proposed that the school fills a sheet and the developer imports it; the user prefers automation. Reasons recorded: the load recurs (start of cycle, new divisions, mid-year arrivals), the manual route makes the developer a bottleneck, it moves minors' personal data (DNI, tutor contacts) outside the system, and errors would not reach the people who can fix them.

## Current state (mapped)
- Student is its own entity (`student.orm-entity.ts`), linked to exactly one course via `courseId`; no enrollment table.
- DNI (`documentNumber`) is unique per tenant (`create-student.handler.ts`).
- `POST /students` (ADMIN, PRECEPTOR) creates one at a time; no upload infrastructure in the API; `exceljs` already in `apps/api` (used only for export).

## Agreed design
- D1: Downloadable `.xlsx` template with fixed columns (last name, first name, DNI, birth date, tutor name, tutor phone, tutor email optional). No arbitrary column mapping.
- D2: One file = one course; the course is chosen in the UI, never read from the file.
- D3: Upload → server parses and validates every row → mandatory preview with per-row errors (duplicate DNI in file or tenant, invalid date, missing field).
- D4: Confirm is all-or-nothing in a single transaction; if any row fails, nothing is inserted.
- D5: Reuse the create-student domain rules (one source of validation), emit `student.created` per student as today (or a batched equivalent — decided in T1).

## Resolved questions
- Q1 (user, 2026-10-13): a DNI that already exists in another course of the tenant → reject the row, naming the course it is in; moving is done with the existing course change. The import never transfers students.
- Q2 (user, 2026-10-13): ADMIN and PRECEPTOR may import. ADMIN into any course of the tenant; PRECEPTOR only into courses where they are the assigned preceptor (`courses.preceptorId`). Note: `POST /students` today does not scope preceptors to their courses; that existing gap stays out of scope.
- Q3 (default chosen by the parent, user may override): max 100 data rows per file.
- Q4 (technical default chosen by the parent): stateless. Preview endpoint parses and validates; commit endpoint receives the same file, re-parses and re-validates inside the transaction. No staged state, no TTL.

## Delivery
- Forecast: well over 400 authored changed lines (API with tests + UI) → chained PRs.
- delivery_strategy: ask-on-risk → chain_strategy: feature-branch-chain (user said "avanza"; the parent chose it because the user wants these features on their own branch, not direct to main).
- Tracker branch `feat/student-bulk-import` (draft, no-merge tracker PR into `main`).
  - PR 1 `feat/student-bulk-import-api` → tracker: T1.
  - PR 2 `feat/student-bulk-import-ui` → PR 1 branch: T2 + T3.
- Push and PR creation: user's call.

## Checklist
- [x] T1: API — template download endpoint + parse/validate (preview) endpoint + commit endpoint, with unit tests. Route: delegated writer (2+ non-trivial files). Commits: `d1685c4` (tutor-name fix found on the way), `0029a9a` (import API).
- [x] T2: UI — "Importar alumnos" in the course detail Estudiantes tab (ADMIN/SUPERADMIN always; PRECEPTOR only when `course.preceptorId === user.id`), template download, upload, preview with per-row errors, confirm. Route: delegated writer. Commit `e33b9df`.
- [x] T3: feature doc updated with evidence; commits on the chain branches. Push / PRs: pending user decision.

## TDD
- Off (no TDD configuration in the project). Checks: `pnpm --filter api test`, `pnpm ts:check`, `pnpm lint:check`.

## Progress / evidence
- T1 contracts: `GET /students/import/template` (binary xlsx, no envelope); `POST /students/import/preview?courseId=` (multipart `file`, 201 with rows + per-row errors); `POST /students/import/commit?courseId=` (201 `{created}`; 422 with the preview payload under `details` if any row is invalid). 400 bad file/header/>100 rows/>1 MB; 404 course missing or other tenant; 403 preceptor not assigned.
- DNI rule: exactly 8 digits, reusing the existing `DocumentNumber` value object (the brief said 7–9; existing rule wins).
- Course label in messages matches the UI: `2° "A"` (parent adjusted the writer's `2°A`).
- Added `@types/multer` (devDependency) and `multer` in `apps/api/tsconfig.json` types; `http-exception.filter.ts` now forwards an optional `details` field.
- Checks: `pnpm --filter api test` 83 suites / 490 tests passed (parent re-run; one earlier full run had a single suite fail under parallel load and pass alone — environmental flakiness, seen before in `excel-generator.service.spec.ts`); `pnpm ts:check` 9/9; `pnpm lint:check` only the 5 known warnings.
- Size: ~1,430 changed lines in PR 1 (about 600 are tests). One slicing pass: parser/validator vs handlers/controller would still leave both slices over 400 and split one behavior across PRs → recommend `size:exception` for PR 1.
- Native review: medium, granted → approved, acknowledged (lineage `review-0b91673f0d202f62`).

- T2 checks: `pnpm ts:check` 9/9; `pnpm lint:check` only the 5 known warnings; hooks vitest 21 tests and ui vitest 86 tests passed (writer); `pnpm --filter client build` compiled successfully (parent re-run). Size ~650 changed lines (~220 tests). Not verified: real browser run against the API.
- Not done (decision gap): entry point on the students list page with a course picker.

## Follow-ups (advisory review findings, non-blocking)
- R3-mime-allowlist-false-reject: a valid .xlsx sent with a generic MIME (e.g. application/octet-stream) may be rejected.
- UI review (approved, lineage of commit e33b9df): fixed in a follow-up commit — stale preview after closing (in-flight validation now detached) and preview kept after picking another file (now cleared). Left as follow-ups: template download revokes the URL right after clicking a detached anchor (same pattern as the existing report export, `use-export-report.ts`); duplicate React key risk for identical error strings in a row; 422 mapping in the container untested.
- R3-multer-size-limit-status: the 1 MB multer limit may answer with a status other than the documented 400.
- R3-concurrent-dni-race: two concurrent commits with the same DNI could both pass validation; the DB has no unique (tenantId, documentNumber) index to back it.
- R3-uow-atomicity-unproved: `em.transactional` atomicity relies on MikroORM v6 transaction context propagation into repositories; no integration test proves the rollback.
- R3-filter-details-untested, R3-tutor-split-untested: missing unit tests for the filter `details` pass-through and the tutor-name split.
- R3-today-local-vs-utc: future-date check uses local today vs UTC dates.
