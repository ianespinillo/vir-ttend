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
| T1 | S1, S2 | inline | pending | |
| T2 | S3 | inline | pending | |
| T3 | S4 | inline | pending | |
| T4 | S5 (identity) + S6 auth | delegated (parallel writers: disjoint module surfaces) | pending | |
| T5 | S5 (academic) | delegated (parallel writers) | pending | |
| T6 | S5 (attendance, reporting) | delegated (parallel writers) | pending | |
| T7 | S6 (shared type) + seam check + independent verifier (high risk: item 3, API status contract) | inline + verifier | pending | |

## Log

- **L1 (2026-10-15, user, verbatim):** "necesito que hagas una nueva feat/fix donde se mejore el manejo de errores en backend, proporcionando mejores mensajes para el usuario y mejor manejo de los codigos de error adecuado al contexto"
- **L2 (2026-10-15, user decision):** approach "Errores de dominio tipados (Recomendado)" over Nest HTTP exceptions in handlers.
- **L3 (2026-10-15, exploration):** single global `@Catch()` filter at `apps/api/src/common/filters/http-exception.filter.ts` maps `DomainError`→400, keeps `HttpException`, everything else → 500 "Internal server error". ~91 `throw new Error` in handlers/entities/VOs become 500 (mostly English). No DB error mapping. `ValidationPipe` has no `exceptionFactory`. Many specs assert exact English messages and must be updated with the new messages.
- **L4:** forecast well over 400 authored lines → slices per task, chained PRs (`feature-branch-chain`) as in `student-history-metrics`.
