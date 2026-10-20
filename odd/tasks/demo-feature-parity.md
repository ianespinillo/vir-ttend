# ODD — Demo feature parity (`apps/demo` vs production 1.3.0)

**Feature:** demo-feature-parity
**Branch:** `dev` (explicit instruction; no push)
**Fecha:** 2026-10-20
**Base:** demo built 2026-09-27 (`7a880ad` is the last sync point); production is at 1.3.0.

## Objetivo

Bring the offline commercial demo (`apps/demo`, localStorage store) to feature parity with the production client for every feature shipped since the demo was built, so a salesperson can show them immediately with seeded data. Everything is simulated in memory: no API calls, no new runtime dependencies.

## Scope

In: all web features reachable by `apps/client` + shared `@repo/ui` / `@repo/common`. Out: `apps/mobile`, `apps/site` (parallel agent), `apps/api`, `packages/*` (consumed as-is; `@repo/common` must be rebuilt locally with `pnpm --filter @repo/common build` because its `dist/` is git-ignored).

## Constraints

- Single writer for `apps/demo`; never touch `apps/site`; commit only explicit paths (`git add <paths> && git commit -m ... -- <paths>`); no push; no AI attribution.
- Reuse `@repo/ui` components and the existing store/selectors/mappings pattern.
- Schema change => bump `DEMO_STORAGE_KEY` to `:v2` and `STORAGE_SCHEMA_VERSION` to 2; old v1 state is simply ignored (re-seeded).
- Respect `isPathAllowedForRole` from `@repo/common`.
- UI copy Spanish, code/comments English.
- ~400 authored changed lines per task is a planning heuristic only.

## TDD / checks

TDD mode: **off — not configured** (source: no project/session declaration). Ordinary checks per task:

- `pnpm --filter demo test` (vitest ^2.1.9)
- `pnpm --filter demo ts:check` (`tsc --noEmit`)
- `pnpm --filter demo build`
- `pnpm lint:check` scoped as possible (biome).

RDD: not enabled by the user for this work; delivery follows ordinary repository policy.

## Gap list (verified against the demo source)

| Feature | Production | Demo before | Task |
|---|---|---|---|
| Dark mode + theme toggle | `ThemeProvider`/`ThemeScript`, toggle in topbar | missing provider (toggle renders but no theme state) | D1 |
| Late beyond tolerance status | `late_beyond_tolerance` (weight 0.5) | partial: counted as late in selectors; never seeded | D2 |
| Weighted absences (late 0.25, LBT 0.5, contraturno halving, day cap 1) + reports over classes given (`daysGiven`, `absenceBreakdown`, null percent) | `calculateWeightedAbsences` | missing (percent model, 3 late = 1 absence) | D2 |
| Absence alerts at 10 / 20 / cap (28), `exceeded` type, no duplicates | `ThresholdCheckerService` | partial: seed only, lifted counts, no generation on writes | D2 |
| Non-working days + institutional announcement | dialog + store action | present in store/page; seed has none; Dates not revived; not excluded from seeded days | D6 |
| Workshop commissions (1 or 2 per course, split, move, regenerate, preceptor assign) | panel in course detail | missing | D3, D4 |
| Subject kind (theory/workshop), schedule slots per commission, commission labels | schema + UI | missing in store/seed | D3, D4 |
| 7th-year technical courses workshop-only | `isWorkshopOnlyCourse` | missing | D3, D4 |
| Workshop attendance per commission (`/attendance/workshop`) | page + API | missing (route + nav filtered out, tour excluded) | D3, D4 |
| Subject rosters scoped to commissions | `resolveSubjectAudience` | missing | D3 |
| Course students inside the students tab | `CourseDetail students` | missing (props not passed) | D4 |
| Preceptor manages schedules and subjects; teachers without account | `canManageSchedule/Subjects`, `teacherName` | partial: `onSaveSchedule` never wired, subjects admin-only, no teacherName | D4 |
| Preceptor-scoped courses/students | `preceptorId` filter | present for students; courses page to verify | D4 |
| Student bulk import (course screen) | `StudentImportDialog` | missing | D4 |
| Justified status display + review justifications modal | `ReviewJustificationsModal` | partial (status ok; modal missing in daily page) | D4 |
| Student history page (metrics, comparison chart, per-subject breakdown) | `/attendance/student/[id]` | missing (link from student detail 404s) | D5 |
| Onboarding tour + functional tutorials | `tour` prop | present; excludes workshop route | D7 |
| Docs | | | D8 |

## Checklist

| ID | Tarea | Ruta | Estado | Evidencia |
|----|-------|------|--------|-----------|
| D0 | Explore + gap list + this document | inline (exploration read 1-3 files at a time; writer is this agent) | done | this file |
| D1 | Dark mode: ThemeProvider + ThemeScript + themed toaster | inline (3 files) | pending | |
| D2 | Weighted attendance model, LBT, alerts 10/20/cap, reports over classes given, store v2, seed days | single writer (delegation trigger: 2+ non-trivial files; this agent is the delegated writer) | pending | |
| D3 | Workshop domain in store: commissions, subject kind, slot commissions, workshop attendance, rosters, 7th-year course seed | same | pending | |
| D4 | UI wiring: course detail (students, commissions, import, schedule save, subjects), workshop attendance page, daily page, courses/dashboard | same | pending | |
| D5 | Student history page and route | same | pending | |
| D6 | Non-working days seed + date revival | same | pending | |
| D7 | Tour/nav: drop workshop exclusions, profile descriptors, smoke tests | same | pending | |
| D8 | Docs: demo-guide + README | inline | pending | |

## Acceptance criteria

1. Every route reachable from the sidebar and from in-page links for each role resolves (no 404 from shared components).
2. Seeded data lets a salesperson show: a 7th-year technical course with two commissions and workshop attendance, a declared non-working day with its announcement, students at 10 / 20 / cap alerts, late and late-beyond-tolerance statuses, justified absences, student history.
3. Old localStorage v1 state is discarded cleanly; reset restores the seed.
4. `pnpm --filter demo test`, `ts:check` and `build` pass.

## Notas

- `@repo/common` `dist/` is git-ignored: run `pnpm --filter @repo/common build` before `ts:check` on a fresh checkout (the stale dist produced spurious type errors).

## Próximo paso

Start D1.
