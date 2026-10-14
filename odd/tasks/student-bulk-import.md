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
- [ ] T1: API — template download endpoint + parse/validate (preview) endpoint + commit endpoint, with unit tests. Route: delegated writer (2+ non-trivial files).
- [ ] T2: UI — import entry point on the course/students screen, upload, preview table with per-row errors, confirm. Route: delegated writer.
- [ ] T3: docs + commit.

## TDD
- Off (no TDD configuration in the project). Checks: `pnpm --filter api test`, `pnpm ts:check`, `pnpm lint:check`.

## Progress / evidence
- (pending)
