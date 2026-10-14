# Feature: student-history-metrics

## Objective
Add a per-student history and metrics screen at `/attendance/student/[id]` for ADMIN and PRECEPTOR. It shows the student's identity header, attendance KPIs, monthly progress, a comparison against the course average, a per-subject breakdown, the student's alerts, and the full attendance history — plus legajo export (Excel/PDF) named after the student.

## Source of truth
- Spec: `docs/superpowers/specs/2026-10-14-student-history-metrics-design.md` (facts F1–F16, decisions D1–D8, risks R1–R6, acceptance criteria, verification plan).
- Plan: `docs/superpowers/plans/2026-10-14-student-history-metrics.md` (Tasks 1–9, with files, context, steps, and commit messages). This document tracks progress and does not duplicate the plan steps.

## Key decisions (spec §3)
- **D1** No new backend for data — the screen uses existing hooks only.
- **D2** Per-subject breakdown is computed client-side by grouping `AttendanceRecord[]` by `subjectId`; records without a subject fall under "Asistencia diaria".
- **D3** Sections are independent — nothing is gated on `report == null`; history, subjects, and alerts stay visible even without a generated report.
- **D4** Route access is ADMIN + PRECEPTOR.
- **D5** Displayed attendance % = `(present + late) / total`; justified absences are reported separately and do not count as attendance. The authoritative percentage remains `StudentReport.totals`.
- **D6** Legajo = the existing annual student report (`type: 'student'`); the Excel/PDF layout is unchanged.
- **D7** The export filename is built by a pure service (`ExportFilenameService`) that resolves the student name through `IStudentPort` → `legajo-<alumno>-<año>.<ext>`.
- **D8** Only the active academic year is used (`useActiveAcademicYear()` startDate..endDate); no year selector.

## TDD
- Mode: off (no project/session TDD config). Plan tests are ordinary checks written alongside each unit.
- Runners: `@repo/common` vitest, `@repo/ui` vitest (jsdom + RTL), api jest.

## Delivery
- Actual code change is ~1250 authored lines (plus ~805 docs), over the 400-line review budget. Strategy `ask-on-risk` → the user chose **chained PRs** with **feature-branch-chain**, target `dev`.
- Tracker: `feat/student-history-metrics` (starts at `dev`, `fab66e3`). Only the tracker merges into `dev`.
- Slice branches are plain points on the linear commit chain, so each PR's diff is exactly its slice:

| PR | Head | Base | Slice | Diff |
|----|------|------|-------|------|
| [#69](https://github.com/ianespinillo/vir-ttend/pull/69) | `…-01-foundation` | tracker | nav rule + pure helpers (T1, T2) | 280 / 0 |
| [#70](https://github.com/ianespinillo/vir-ttend/pull/70) | `…-02-ui-components` | `01` | chart + breakdown + history (T3–T5) | 362 / 0 |
| [#71](https://github.com/ianespinillo/vir-ttend/pull/71) | `…-03-page-composition` | `02` | page composition + barrels (T6) | 265 / 0 |
| [#72](https://github.com/ianespinillo/vir-ttend/pull/72) | `…-04-client-route` | `03` | client route (T7) | 135 / 0 |
| [#73](https://github.com/ianespinillo/vir-ttend/pull/73) | `…-05-legajo-export` | `04` | legajo filename (T8) | 162 / 46 |
| [#74](https://github.com/ianespinillo/vir-ttend/pull/74) | `…-06-docs` | `05` | spec + plan + ODD doc (T9) | 805 / 0 |

- **Merge procedure (the repo has `delete_branch_on_merge: false`, so GitHub will NOT retarget children automatically):** merge bottom-up (69 → 74), and before merging each next PR retarget its base to `feat/student-history-metrics`. Each retarget keeps that PR's diff identical, because its previous base is already merged. Finally open and merge a `feat/student-history-metrics` → `dev` PR.

## Tasks (plan numbering)
- [x] Task 1 — restrict `/attendance/student` to ADMIN + PRECEPTOR in `nav.ts` (`9399f3a`; `@repo/common` 7 files / 66 tests pass, nav 34 tests).
- [x] Task 2 — pure helpers in `packages/ui/src/lib/student-history.ts` (`cf10b9b`; 5 vitest tests pass).
- [x] Task 3 — `StudentCourseComparisonChart` (`e46c2d0`; 1 vitest test — empty state; recharts data rendering is not asserted in jsdom).
- [x] Task 4 — `StudentSubjectBreakdown` (`1f8c9df`; 2 vitest tests pass).
- [x] Task 5 — `StudentAttendanceHistory` (`27a7d01`; 2 vitest tests pass).
- [x] Task 6 — `StudentHistoryPage` + barrel exports (`0d6bea4`; 2 vitest tests pass; `@repo/ui` `ts:check` clean).
- [x] Task 7 — client page `apps/client/src/app/(dashboard)/attendance/student/[id]/page.tsx` (`0bc05a0`; `client` `ts:check` clean).
- [x] Task 8 — `ExportFilenameService` + controller/module wiring (`3eb6976`; 4 jest tests pass; monthly filename unchanged, student filename `legajo-<alumno>-<año>.<ext>`).
- [x] Task 9 — end-to-end verification + docs close.

## Route log
| Task | Route | Trigger evidence |
|------|-------|------------------|
| 1 | direct inline | one mechanical file + its colocated test |
| 2 | direct inline | one new lib file + test (already understood) |
| 3–6 | direct inline | one new component file + test per task, sequential |
| 7 | direct inline | one new page, wiring verified against existing page patterns |
| 8 | direct inline | service + spec + two small wiring edits in already-read files |

> Note: the `task`/`explore` subagent tool was unavailable this session ("OpenCode's free tier can only be used from within OpenCode"), so mapping was done inline. Delegation triggers that would normally fire for 4+ file exploration were satisfied by bounded inline reading of already-identified files.

## Progress / evidence
- `pnpm turbo run ts:check` → 9/9 tasks successful.
- `pnpm biome check .` → 5 warnings, all pre-existing (`set-schedule.handler.spec.ts`, `settings/users/create/page.tsx`, `settings/users/@modal/(.)create/page.tsx`, `users/users-page.tsx`). Zero in the files touched by this feature.
- `pnpm --filter @repo/common test` → 7 files / 66 tests pass.
- `pnpm --filter @repo/ui test` → 24 files / 124 tests pass (4 new component suites + the new lib suite: 12 new tests).
- `pnpm --filter api test -- --maxWorkers=2` → 103 suites / 722 tests pass.
  - Gotcha: a plain `pnpm --filter api test` (and `pnpm -r test`) intermittently fails 7–16 suites with `A jest worker process was terminated by another process: signal=SIGTERM` — 0 test-assertion failures, 681–722 tests passing. This is Windows worker contention in this environment, pre-existing and unrelated to this change; limiting workers makes the whole suite green.

## Next step
- Review and merge the chain #69 → #74 (see merge procedure above), then merge the tracker into `dev`.
- Review the screen manually in the browser: navigate from a student card to "Historial y Métrica de Asistencia", confirm each section renders, and export the legajo as Excel and PDF.
