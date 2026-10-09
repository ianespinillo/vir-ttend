# Feature: Alerts mark-as-seen fix

## Objective
User report: "no se marcan las alertas como vistas de forma apropiada" —
alerts marked as seen reappeared as unseen, so the bell badge re-lit.
Fix root cause + the related 500 on repeated marking.

## Evidence (Phase 1-2, systematic-debugging)
- Live API flow worked end-to-end: `PATCH /alerts/:id/seen` -> 200, count
  decrements, `seenAt` persisted; UI E2E: click "Marcar como vista" ->
  item count and bell badge both decrement (`alerts_ui_check.py`).
- **Root cause (respawn):** `apps/api/src/modules/attendance/domain/services/threshold-checker.service.ts`
  dedupe required `!alert.seenAt`. Once marked, `check()` returned the type
  again, and `GenerateAlertHandler` (fires on every `attendance.registered`
  event via `attendance-registered.listener.ts`) saved a NEW alert row with
  `seenAt = NULL` -> badge re-lights.
- Spec encoded the bug as intent: `test/unit/attendance/threshold-checker.service.spec.ts`
  ("permite crear alerta si la existente fue vista"). User report overrides
  that design decision.
- **Secondary defect:** repeating the PATCH returned **500** —
  `AttendanceAlert.markAsSeen` throws plain `Error('Attendance alert already seen')`,
  uncaught in `MarkAlertSeenHandler`.
- Cosmetic (out of scope, schema change): `seenAt` ORM column `type: 'date'`
  stores midnight only.
- Discarded: 401s on `GET /users/me` + `POST /auth/refresh` are the
  user-owned auth layer (explicitly out of scope per user);
  `StudentAlertsSummary` and `useAlertsByStudent` have no consumers.

## Scope
1. Dedupe in `ThresholdCheckerService.check` by alert type regardless of
   `seenAt` (marked alerts must not respawn).
2. Scope dedupe to the current academic year in `GenerateAlertHandler`
   (avoid blocking new-year alerts now that seen alerts also suppress).
3. Idempotent `PATCH /alerts/:id/seen`: already-seen -> success no-op, no 500.
4. Tests: flip spec, add cross-year coverage, add handler coverage.
No schema/migration changes. No commit (user declined committing for now).

## Constraints
- Tabs + LF (root `biome.jsonc`). NO Prettier, no `--write` formatters.
- Test names in Spanish (existing spec style).
- Rebuild `vir-ttend_api` container after the fix for live verification.

## Verification evidence
- RED (before fix): flipped dedupe spec failed with `Received: {"_status":"warning"}`.
- GREEN: attendance unit suite `14 suites / 79 tests` green; full api jest
  `52 suites / 273 tests` green (baseline 51/268 before this task).
- `npx tsc --noEmit` -> 0 errors. `biome check` (read-only) on touched files -> 0 errors.
- Independent verifier (fresh context) round 1 -> **FAIL**: writer had claimed
  the academic-year filter but `generate-alert.handler.ts` had an EMPTY diff;
  spec mocks (`academicYearId`) were dead data -> false-green. Correction
  applied (real filter + 2 cross-year tests + guard widened to
  `seenAt || seenBy`). Round 2 -> **PASS**, no CRITICAL/WARNING remaining.
- Parent spot-check: re-ran `test/unit/attendance` -> 14/79 green, exit 0.
- Live (rebuilt `vir-ttend_api`): repeat `PATCH /alerts/a8960c7e.../seen` on an
  already-seen alert -> **200 / 200** (was 500 on repeat); list integrity
  unchanged (unseen 0 -> 0, total 4 -> 4). Script: `alerts_idempotency_live.py`.
- Respawn itself is unit-proven (no live `generate` endpoint exists); live DB
  has no duplicate rows (verified: 4 alerts, 0 duplicate studentId+type keys).

## Checklist
- [x] RED: spec flipped -> failed against current code
- [x] Fix ThresholdChecker + academic-year scoping in GenerateAlertHandler
- [x] Idempotent mark-as-seen (no 500 on repeat)
- [x] GREEN: attendance unit suite + full jest + tsc + biome check (read-only)
- [x] Rebuild api container, live verify: repeat PATCH 200, no false mutation
- [x] Independent verification (round 2 PASS) + parent spot-check
- [x] Mirror doc to engram

## Files changed
- `apps/api/src/modules/attendance/domain/services/threshold-checker.service.ts` (+1/-1)
- `apps/api/src/modules/attendance/application/commands/generate-alert/generate-alert.handler.ts` (+4/-1)
- `apps/api/src/modules/attendance/application/commands/mark-alert-seen/mark-alert-seen.handler.ts` (+3)
- `apps/api/test/unit/attendance/threshold-checker.service.spec.ts`
- `apps/api/test/unit/attendance/generate-alert.handler.spec.ts` (+35/-1)
- `apps/api/test/unit/attendance/mark-alert-seen.handler.spec.ts` (new)

## Follow-ups (not done, honest pending)
- SUGGESTION (coverage only) — **DONE**: `mark-alert-seen.handler.spec.ts` now has two
  independent idempotency tests (`seenAt`-only and `seenBy`-only) beside the original
  case, locking each OR branch; attendance suite green as part of the 55 suites / 278
  tests full run after the change.
- `seenAt` column `type: 'date'` loses time of day (midnight). Needs a
  migration; cosmetic, out of scope for this report.
- Writer staged the new spec with `git add`; index restored to prior state
  (0 staged) after verification.

## Status
DONE and verified. No commit (per user decision).
