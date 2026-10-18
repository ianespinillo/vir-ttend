# Feature: api-error-handling

Objective: the API answers every error with a clear Spanish message for the user and the HTTP status that fits the context (404, 409, 401, 403, 400/422) instead of generic 500s.
Branch: `feat/api-error-handling` (from `dev`). Delivery: `ask-on-risk` → cached choice from the previous feature: chained PRs, `feature-branch-chain`, target `dev`.
Test runner: Jest in `apps/api` (`npx jest test/unit/...`); baseline 103 suites / 722 tests passing.

## Specs

- **S1 — Typed domain errors.** User decision (L2): "Errores de dominio tipados". Domain and application layers express errors with `DomainError` subclasses that do not depend on NestJS: not found, conflict, forbidden, unauthorized, business rule/validation. The global filter maps them to 404, 409, 403, 401 and 422 (business rule) / 400 (invalid input). The existing `DomainError` base keeps mapping to 400.
- **S2 — Unhandled errors.** Anything not mapped still answers 500, with a Spanish message for the user and without leaking internals. Client errors (4xx) are logged as warnings; only 5xx are logged as errors with the stack.
- **S3 — Request validation.** `ValidationPipe` errors answer 400 with Spanish messages. Pipes that reject a parameter (`valid-role`, `valid-shift`) answer 400, not 500.
- **S4 — Database errors.** Unique-constraint violations answer 409, foreign-key violations answer 409, not-null violations answer 400, and malformed ids (invalid UUID syntax) answer 400, all with Spanish messages and without exposing SQL.
- **S5 — Module errors.** Every `throw new Error` in handlers, entities and value objects of identity, academic, attendance and reporting becomes the typed error that fits its meaning, with a Spanish message. Nest HTTP exceptions with the wrong status are corrected (for example, duplicate DNI → 409, which `apps/client/.../students/[id]/page.tsx` already expects; not found answered as 500 or 400 → 404). Startup/config errors stay as plain errors.
- **S6 — Auth messages and shared contract.** Guard and auth errors answer 401/403 with Spanish messages. The shared `ErrorResponse` type in `@repo/common` matches what the filter sends (`timestamp`, `details`).
- **Assumption A1:** messages use neutral, professional Spanish (artifact language rule; the project UI is in Spanish).
- **Assumption A2:** the response shape stays `{ statusCode, timestamp, path, method, message, error, details? }`; validation keeps `message` as `string[]` so existing consumers that handle arrays keep working.

## Tasks

| ID | Specs | Route | Status | Commit / evidence |
|---|---|---|---|---|
| T1 | S1, S2 | inline | done | `f7e00a6` — RED (missing module) → GREEN filter spec 11/11; API 103 suites / 730 tests |
| T2 | S3 | inline | done | `9506591` — RED (missing factory, 3 pipe tests) → GREEN; API 105 suites / 742 tests |
| T3 | S4 | inline | done | `e71e6f0` — RED 6 DB cases → GREEN; API 105 suites / 749 tests |
| T4 | S5 (identity) + S6 auth | delegated (parallel writers: disjoint module surfaces) | done | `cac2024` — RED 65 failing → GREEN identity+shared 25 suites / 179 tests |
| T5 | S5 (academic) | delegated (parallel writers) | done | `35d8821` — RED 34 failing → GREEN 35 suites / 207 tests |
| T6 | S5 (attendance, reporting) | delegated (parallel writers) | done | `5972002` — RED ~60 failing → GREEN 42 suites / 361 tests |
| T7 | S6 (shared type) + seam check + independent verifier (high risk: item 3, API status contract) | inline + verifier | done | `a7d9b81` (500 HttpException message hidden, RED→GREEN), `002fe5a` (ErrorResponse), `2acf1c8` (axios 401 on auth routes, RED 3 → GREEN 38); seam: API 111 suites / 795 tests, ts:check 9/9, biome clean |

## Log

- **L1 (2026-10-15, user, verbatim):** "necesito que hagas una nueva feat/fix donde se mejore el manejo de errores en backend, proporcionando mejores mensajes para el usuario y mejor manejo de los codigos de error adecuado al contexto"
- **L2 (2026-10-15, user decision):** approach "Errores de dominio tipados (Recomendado)" over Nest HTTP exceptions in handlers.
- **L3 (2026-10-15, exploration):** single global `@Catch()` filter at `apps/api/src/common/filters/http-exception.filter.ts` maps `DomainError`→400, keeps `HttpException`, everything else → 500 "Internal server error". ~91 `throw new Error` in handlers/entities/VOs become 500 (mostly English). No DB error mapping. `ValidationPipe` has no `exceptionFactory`. Many specs assert exact English messages and must be updated with the new messages.
- **L4:** forecast well over 400 authored lines → slices per task, chained PRs (`feature-branch-chain`) as in `student-history-metrics`.
- **L5 (2026-10-15):** T1–T3 done. T4–T6 run as parallel writers in the same tree with disjoint module surfaces; the parent owns git and commits each unit after checking its diff against its surface.
- **L6 (2026-10-15):** T7 partial (uncommitted until writers finish, because the pre-commit hook checks the whole repo): `ErrorResponse` in `@repo/common` now has `timestamp` and `details` (66 tests pass). Web axios interceptor no longer refreshes on a 401 from login/select-tenant/refresh/logout, so the user sees the real auth error; RED 3 failing → GREEN 38/38 in `packages/hooks`. Fixed a pre-existing test flaw: `mock.restore()` in `afterEach` detached the mock, so later tests hit the real API; the mock is now per test with `onNoMatch: 'throwException'`.
- **L7 (2026-10-15):** writers done; not-found messages unified on the academic wording ("Curso no encontrado"...). Seam check passed. Open user decisions: login reveals a deactivated account because the active check runs before the password check (behavior change, not done); course.service weekly-hours and commission-on-theory rules stay 400 (could be 422). Advisory: `get-reports-by-course` rebuilds `ReportPeriod` for stored reports and fails for past years (pre-existing; now 400 instead of 500). Independent verifier launched against base `02a3028`.
- **L8 (2026-10-15, verifier):** PASS on S1–S6, no blockers. API 111 suites / 795 tests, hooks 38, common 66, ui 126. Client consumers checked: login 401 shows the Spanish message on web and mobile; duplicate DNI 409 matches the client; import 422 + details intact. Advisories: (1) mobile outbox `classifyError` treats 4xx except 401/408 as permanent, so a race on the attendance unique constraint that used to be a retried 500 is now a permanent 409; (2) dead English-text branches in client user-create pages; (3) web login direct-select shows `err.message` instead of `response.data.message` (pre-existing); (4) voseo in unchanged `student-import.service.ts:38` (pre-existing).
