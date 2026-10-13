# Feature: fix 3 findings — subject soft delete, domain errors -> 400, alerts seenAt type

## Objective

Close the three pre-existing findings reported after the dual-FK mapper work:

- **T1** — `DELETE /subjects/:id` returns 200 but does not delete: migrate `subjects` to real soft delete.
- **T2** — business-rule violations surface as HTTP **500** instead of 400 (`Subject already exists`, `Schedule overlap detected …`).
- **T3** — alerts `seen_at` column is `date` (stores midnight, loses time of day): change to `timestamptz`.

## Recon facts (read-only mapping, this session)

### T1 — soft delete
- `apps/api/src/modules/academic/domain/entities/subject.entity.ts` ALREADY has `deletedAt?` (L22,34,46,57,69,77), the getter (L105-107) and `softDelete()` (L131-134). Domain is ready.
- `apps/api/src/modules/academic/application/commands/delete-subject/delete-subject.handler.ts:14` already calls `subject.softDelete()` then `subjectRepo.save(subject)` — but nothing persists, because:
- `apps/api/src/modules/academic/infrastructure/persistence/entities/subject.orm-entity.ts` has NO `deletedAt` mapping (BaseEntity only has id/createdAt/updatedAt) and the `subjects` table has NO `deleted_at` column.
- `apps/api/src/modules/academic/infrastructure/persistence/repositories/subject.repository.ts`: `findByCourse`, `findByTeacher`, `findByTeacherAndCourses`, `findByCourses`, `findById` do not filter deleted rows; the `save` update branch does not copy `deletedAt`.
- No `SoftDeleteHandler` extension and no global `@Filter` anywhere. Naming strategy = MikroORM default `UnderscoreNamingStrategy` (no `namingStrategy` key in `apps/api/src/modules/shared/database/mikro-orm.config.ts`), so `deletedAt` maps to `deleted_at`.
- `subjects` columns: id, created_at, updated_at, course_id, teacher_id, name, area, weekly_hours, **courseId** (stray camelCase uuid FK). Referenced by `schedule_slots_subjectId_foreign`.
- List routes: `@Get()` branches to `GetSubjectsByCourseHandler` (courseId) / `GetTeacherSubjectsQueryHandler` (academicYearId). There is NO `@Get(':id')` on the subjects controller.

### T2 — errors -> 400
- Global filter `apps/api/src/common/filters/http-exception.filter.ts` (registered in `main.ts:29`): `HttpException` keeps its status; **any plain `Error` -> 500 `'Internal server error'`** (message swallowed, L75-80).
- Convention already in place: `BadRequestException` used in 49 places across 21 files (application layer). Domain layer is framework-free (`HttpExceptionFilter` is the only Nest-aware HTTP piece).
- Offenders: `create-subject.handler.ts:32` `throw new Error('Subject already exists')` (application); `course.service.ts:12-14` `throw new Error('Schedule overlap detected …')` (domain service, called from `set-schedule.handler.ts:29`).
- Only `extends Error` in the repo: `identity/domain/exceptions/invalid-mail.exception.ts` (not wired to the filter).

### T3 — seenAt type
- `attendance/infrastructure/persistence/entities/attendance-alert.orm-entity.ts:44-48`: `@Property({ type: 'date', nullable: true }) seenAt`. DB `attendance_alerts.seen_at` = `date`, nullable. Created in `Migration20260714043602_create_attendance_alerts.ts:6`, retyped to `date` in `Migration20260730032324_create_monthly_reports.ts:25`.
- Domain `attendance/domain/entities/attendance-alert.entity.ts:41,53,68,103` uses a real `Date`; mapper `attendance-alert.mapper.ts:12,24`; DTO `alert.response.dto.ts:65,88`. Nothing depends on date-only semantics.

## Scope

### T1 — subjects soft delete (DB column + persistence + read filtering)
1. `subject.orm-entity.ts`: add `@Property({ type: 'datetime', nullable: true }) deletedAt: Date | null = null;` (column `deleted_at`).
2. Migration `Migration20261009120000_subject_soft_delete.ts`:
   `alter table "subjects" add column "deleted_at" timestamptz;` (+ `down`: drop column).
3. `subject.repository.ts`: add `deletedAt: null` filter to `findByCourse`, `findByTeacher`, `findByTeacherAndCourses`, `findByCourses`; **keep `findById` unfiltered** so admin delete/update stay idempotent (avoid turning a repeated delete into a new 500); persist `existing.deletedAt = subject.deletedAt ?? null` in the `save` update branch.
4. `mapper` (`subject.mapper.ts` / its toDomain + toOrm): map `deletedAt` both directions.
5. Update `.snapshot-vir_ttend.json` for the new `deleted_at` property.

### T2 — business errors -> 400
1. New `apps/api/src/common/errors/domain.error.ts`: `DomainError extends Error` (name set, prototype fixed) — framework-free, usable from the domain layer.
2. `course.service.ts`: throw `DomainError` instead of `Error` for the overlap rule (domain stays Nest-free).
3. `http-exception.filter.ts`: add a branch mapping `DomainError` -> **400**, preserving the message.
4. `create-subject.handler.ts:32`: `throw new BadRequestException('Subject already exists')` (application-layer convention; message unchanged so existing tests keep passing where possible).
5. `'Subject not found'` and other plain-Error throws stay out of scope (do NOT mass-convert the 90 throws).

### T3 — alerts seenAt timestamptz
1. ORM: `type: 'date'` -> `type: 'datetime'` on `seenAt`.
2. Migration `Migration20261009120100_attendance_alerts_seen_at_timestamptz.ts`:
   `alter table "attendance_alerts" alter column "seen_at" type timestamptz using ("seen_at"::timestamptz);` (+ `down` back to `date using ("seen_at"::date)`).
3. Update `.snapshot-vir_ttend.json` for the `seen_at` type.

## Constraints
- Tabs + LF (root `biome.jsonc`). NO Prettier, no `--write` formatter.
- No commit; the user declined commits in this worktree.
- Test names in Spanish (existing spec style); specs under `apps/api/test/unit/...`.
- Do NOT run `mikro-orm migration:create` (the snapshot/DB drift would generate spurious diffs); hand-write the two migration files following `Migration20260801120000_create_announcements.ts`.
- Do NOT apply migrations / rebuild the container (the parent does that for live verification).
- Keep `findById` unfiltered (decision above).

## Checks
- `cd apps/api && npx tsc --noEmit` -> 0 errors.
- `cd apps/api && npx jest` -> all green (baseline 55 suites / 278 tests; expect +>=4 new).
- New/changed tests must fail (RED) against current code, then pass (GREEN).
- Read-only `npx biome check <touched files>` -> clean.

## Checklist
- [x] T1 ORM + migration + repository filter/persist + mapper + snapshot
- [x] T1 tests (mapper maps deletedAt; repo read filters exclude soft-deleted)
- [x] T2 DomainError + filter branch 400 + course.service + create-subject handler
- [x] T2 tests (filter: DomainError -> 400; course.service throws DomainError; create-subject duplicate -> BadRequestException)
- [x] T3 ORM type + migration + snapshot
- [x] T3 tests updated if any assert the type (verify none break)
- [x] tsc + jest green, biome read-only clean
- [x] Parent: apply migrations + rebuild + live verify + docs + memory

## Evidence (verification of record)

- Writer: RED first (5 suites failed with the intended assertions), then GREEN: **58 suites / 292 tests** (baseline 55/278). `npx tsc --noEmit` -> 0. `biome check` read-only -> clean. Nothing staged.
- Independent read-only verifier (fresh context): **PASS, 15/15 checks, confidence 0.96**, no BLOCKER/WARNING. Verified DomainError wiring, framework-free domain, filter 400 with message + plain Error still 500, NO mass conversion of the other ~85 throws, `findById` unfiltered, both migrations symmetric, snapshot valid JSON, TAB/LF integrity, empty staging, specs non-vacuous.
- `gentle-ai review assess` -> `review_due: true (high_risk)`; RDD is off (global) so no review lifecycle was started; gate satisfied by writer self-verification + independent verifier + parent spot-check (`npx jest` re-run: 58/292).
- Migrations applied via `pnpm -C apps/api migration:up` (both rows in `mikro_orm_migrations`); DB columns now `timestamptz` (`subjects.deleted_at`, `attendance_alerts.seen_at`).
- **Live (rebuilt image sha 84950629..., real Postgres)**:
  - T2: duplicate subject `POST /subjects` (same payload twice) -> second is **400** `'Subject already exists'` (was 500); `POST /schedule` with an overlapping slot (mon 08:00-09:00 vs seeded 08:00-09:20) -> **400** `'Schedule overlap detected between 08:00-09:20 and 08:00-09:00 on monday'` (was 500).
  - T1: create subject -> 201 and listed (6 rows); `DELETE /subjects/:id` -> 200; row disappears from `GET /subjects?courseId` (6 -> 5) while `subjects.deleted_at = 2026-10-09 13:55:04+00` in the DB (soft delete persisted); `findById` still resolves it (admin idempotency preserved).
  - T3: nulled `seen_at/seen_by` on alert `a8960c7e`, `PATCH /alerts/:id/seen` -> 200, `seen_at = 2026-10-09 13:57:33.471+00` (time-of-day preserved; old `date` stored midnight). Original state restored afterward.
- Test data cleaned: test subject hard-deleted via SQL; alert timer state reverted to its original values.

## Status

All three findings fixed, migrated (2 new migrations applied), and live-verified. Not committed (user declined commits in this worktree).
