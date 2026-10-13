# Feature: Student bulk import — upload a fixed .xlsx template per course

## Status
QUEUED (2026-10-13). Not started. Design agreed at a high level; open questions below must be resolved before T1.

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
- D5: Reuse the create-student domain rules (one source of validation), emit `student.created` per student as today (or a batched equivalent — decide in T1).

## Open questions (ask the user one at a time before T1)
- Q1: A DNI that already exists in another course of the tenant: reject the row, or offer a transfer?
- Q2: Who may import: ADMIN only, or ADMIN and PRECEPTOR (same as `POST /students`)? Preceptor limited to their own courses?
- Q3: Row limit per file (e.g. 60)?
- Q4: Preview as stateless re-upload on confirm, or a server-side staged import with an id/TTL?

## Checklist (draft)
- [ ] T1: API — template download endpoint + parse/validate (preview) endpoint + commit endpoint, with unit tests.
- [ ] T2: UI — import entry point on the course/students screen, upload, preview table with per-row errors, confirm.
- [ ] T3: docs + commit.

## TDD
- Off (no TDD configuration in the project). Checks: `pnpm --filter api test`, `pnpm ts:check`, `pnpm lint:check`.
