# Feature: Excel UX — attendance report export and student import template

## Status
IN PROGRESS (started 2026-10-14, document created on resume after an interrupted session).

## Objective
Make the generated Excel files readable and pleasant for school staff: the attendance report export and the downloadable student import template.

## Why
User request (2026-10-14). The attendance export was a bare table with no breakdown of weighted absences (gap left by workshop-commissions T3b.4: "Excel has no breakdown columns"). The import template is a plain sheet with bold headers only.

## Scope
- Attendance export (`apps/api/src/modules/reporting/infrastructure/services/excel-generator.service.ts`) and its row mapping.
- Student import template (`buildTemplate` in `apps/api/src/modules/academic/infrastructure/adapters/xlsx-student-import-file.adapter.ts`).
- Out of scope: PDF export, UI, import validation rules.

## Constraints
- The import parser reads the header at row 1 and data from row 2 of the first sheet. The template must keep that layout so files already in circulation still import, and styling alone (no values) must never make an empty row count as data.
- Stored monthly reports may lack the absence breakdown; their columns stay empty.

## TDD
- Off (no TDD configuration in the project). Checks: `pnpm --filter api test`, `pnpm ts:check`, `pnpm lint:check`.

## Delivery
- Branch `feat/excel-report-ux` (branch point `553c1ba`). Forecast ~900 authored lines; delivery_strategy ask-on-risk. Push and PR creation: user's call.

## Checklist
- [x] T0 (route: inline, resumed interrupted work; commit `c7779e5`): attendance export redesign — title block, frozen header and name columns, autofilter, zebra rows, status-tinted percent, totals, weighting legend, landscape print; daily/workshop absence columns (empty for old stored reports).
- [x] T1 (route: inline, 2 small already-understood edits; commit `52c6659`): review follow-ups on T0 — unknown status from stored data renders a blank status instead of throwing (R3-status-lookup-unguarded); the empty-rows test asserts no totals row and the legend at row 6 (R3-empty-rows-weak-assertion).
- [x] T2 (route: delegated writer, interrupted with the session and finished inline by the parent; commit `60f9d92`): student import template aesthetics — styled header matching the report palette, frozen header, pre-formatted input rows, input validation hints, required vs optional columns distinguishable, styled instructions sheet with a per-column guide and example.
- [ ] T3 (route: pending mapping): bug reported by the user 2026-10-15 — justifying an absence from the mobile app throws an error. Diagnose root cause, fix with a regression test.

## Acceptance criteria
- Export: unknown status never crashes the export.
- Template: parsing the downloaded template yields zero rows; a filled template still parses as before; existing adapter tests pass.

## Progress / evidence
- T0: reporting jest 7 suites / 67 tests; ts:check 9/9; biome 5 known warnings. RDD: candidate re-scoped to base `553c1ba` (the hook's base `34b8a5a` covered 284 files and hit `lens_context_budget_exceeded`); medium, user granted, 1 lens (reliability), approved and acknowledged (lineage `review-ac4895bdaeda8bc4`). Advisory findings → T1. Reviewed boundary advances to `c7779e5`.

- T1: reporting jest 7 suites / 68 tests; api tsc clean; biome 5 known warnings.

- T2: template adapter spec 17 tests; academic jest 34 suites / 200 tests; api tsc clean; pre-commit ts:check 9/9, biome 5 known warnings. Parent change on top of the writer: birth date validation is a warning, not a stop (a non-Spanish Excel stores a typed DD/MM/AAAA as text, which the importer accepts). Fixed a non-null assertion the pre-commit lint rejected.

## Scope note
- T3 widens the feature beyond Excel at the user's request (2026-10-15): a mobile justification bug, kept on this branch.

## Next step
T3.
