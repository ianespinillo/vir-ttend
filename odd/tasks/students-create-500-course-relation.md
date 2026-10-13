# Fix: `POST /students` 500 — MikroORM dual FK mapping (`course` + `courseId`)

## Objective

Student creation from the UI wizard (`POST /students`) returned HTTP 500 for the user-created
student "Pepe flores". Goal: make student creation persist successfully and remain readable
(with its course) through the API.

## Problem

`POST /students` → 500:

```
ValidationError: Value for StudentOrmEntity.course is required, 'undefined' found
```

## Root cause

`apps/api/src/modules/academic/infrastructure/persistence/entities/student.orm-entity.ts`
maps the same column twice:

- `@Property() courseId!: string` (line 11)
- `@ManyToOne(() => CourseOrmEntity, { fieldName: 'courseId' }) course!: CourseOrmEntity` (lines 21-22)

MikroORM 6.6 validates **both** properties as independently required. Setting only one leaves
the other `undefined` and the insert fails:

| Attempt | Mapper set | Resulting error |
| --- | --- | --- |
| Original (insert path) | scalar `courseId` only | `Value for StudentOrmEntity.course is required` |
| First fix (relation only) | `course` via `em.getReference` only | `Value for StudentOrmEntity.courseId is required` |
| Final fix | **both** | insert succeeds |

The repository **update** branch already set both scalar and a guarded relation (and PUT edits
worked), so the fix mirrors that proven pattern.

## Change

- `mappers/student.mapper.ts` — `toOrm(domain, em)` now sets **both** the scalar FK and the relation:
  ```ts
  student.courseId = domain.courseId;
  student.course = em.getReference(CourseOrmEntity, domain.courseId);
  ```
- `repositories/student.repository.ts` — insert branch passes `this.em` to the mapper; update branch
  unchanged (already sets scalar + guarded relation).
- `test/unit/academic/infrastructure/student.mapper.spec.ts` — asserts the FK scalar, the relation
  reference, and the `getReference` call. The earlier version asserted only the relation and passed
  while the bug was live.

No entity change. No repository change beyond the insert call.

## Evidence (live, after `docker compose build api && docker compose up -d api`)

- `POST /students` (payload: Pepe / flores / doc 49567832 / birthDate 2009-05-23 / tutor Carla Morales / 1156789001 / courseId 1d4eb30f-…) → **201**.
- `GET /students/:id` → **200** with `courseId: 1d4eb30f-10b1-4ab0-b7b9-a72463fac51c` and `courseName: "6° 1 - MORNING"`.
- `PUT /students/:id` (mutable fields only; `documentNumber` is rejected by the update DTO) → **200**; DB `updated_at` matches.
- DB: `select course_id, tutor_phone from students where id = 'cf26487e-…'` → `1d4eb30f-…`, `1156789001`; 23/23 rows have a non-null `course_id`.
- `npx tsc --noEmit` → 0 errors. `npx jest` → 53 suites / 274 tests green. `biome check` read-only → clean.
- Independent read-only verifier: **PASS** (changes match convention, spec is a real assertion, no regressions).

## Accepted decisions

- Fix the mapper (mirror the working update branch) instead of altering the entity's dual mapping.
  The dual `@Property` + `@ManyToOne({ fieldName })` shape also exists on `CourseOrmEntity`, so the
  entity shape was left untouched.

## Round 2 — same root-cause class, applied to subject + schedule-slot (user requested "arregla todo")

**`subject.mapper.ts`** — `SubjectOrmEntity` requires `courseId` (scalar, L16) **and** the `course`
relation (`@ManyToOne({ fieldName: 'courseId' })`, L22-23). The mapper set only the scalar.
Fix: `SubjectMapper.toOrm(entity, em)` now also sets `ormEntity.course = em.getReference(CourseOrmEntity, entity.courseId)`;
`SubjectRepository` insert passes `this.em`, update branch keeps scalar + guarded relation.

**`schedule-slot.mapper.ts`** — `ScheduleSlotOrmEntity` requires `subjectId` (L13), `courseId` (L14)
and the `subject` relation (L19-20, `fieldName: 'subjectId'`); there is **no** `course` relation.
The mapper set **none** of them, and the domain `ScheduleSlot` did not even carry `courseId`.
Fix: mapper sets `subjectId`, `courseId` and `subject = em.getReference(SubjectOrmEntity, …)`;
the domain entity gained `courseId` (required in `CreateProps`, optional in
`ConstructorProps`/`ReconstituteProps` to avoid breaking existing callers);
`SetScheduleHandler` passes `courseId: subject.courseId`; repository `save`/`saveMany` pass `this.em`.
The attendance module's own `ScheduleSlot` is a **different class** (positional `reconstitute`) and is unaffected.

**Tests** — new `test/unit/academic/infrastructure/subject.mapper.spec.ts` and
`schedule-slot.mapper.spec.ts`; `mark-alert-seen.handler.spec.ts` gained two idempotency tests
(`seenAt`-only, `seenBy`-only).

## Round 2 evidence

- `npx tsc --noEmit` → 0 errors. `npx jest` → **55 suites / 278 tests** green (baseline 53/274).
- Independent read-only verifier: **PASS** (every required ORM property set on the insert path,
  no missed `toOrm` call site, domain change regression-checked, specs would fail against old code,
  nothing staged, tabs + LF preserved).
- **Live inserts (rebuilt `vir-ttend_api`, real Postgres)** — the gap the verifier flagged is closed:
  - `POST /subjects` `{courseId: 1d4eb30f-…, teacherId: 89edf4b6-…, name, area, weeklyHours: 5}` → **201**;
    DB `subjects.course_id = 1d4eb30f-…` (FK persisted).
  - `POST /schedule` `{subjectId, slots:[tue 09:30-10:50, wed 09:30-10:50]}` → **201**;
    DB `schedule_slots` 2 rows with `subject_id` **and** `course_id` set; 21/21 rows non-null `course_id`.
  - Test data cleaned up: slots cleared (`POST /schedule` with `slots: []`), subject removed; 19 slots remain.
- Live call notes: the first `POST /schedule` returned a **business-rule** 500 (overlap with the course's
  seeded Monday block), not a persistence error.

## Follow-ups / findings from Round 2 (pre-existing, not caused by these fixes, not applied)

- **`DELETE /subjects/:id` returns 200 but does not delete**: the row remains in `subjects`
  (no soft-delete column exists) and still appears in `GET /subjects`. Verified live; cleaned the test
  row via SQL. Candidate defect — worth its own task.
- **Domain business rules surface as HTTP 500** (same class as the alerts `markAsSeen` 500):
  `Error('Subject already exists')` (duplicate subject name) and
  `Error('Schedule overlap detected …')` reach the client as 500 instead of 409/400.
  Candidate fix: map domain errors to HTTP status in the exception filter.
- Cosmetic: alerts `seenAt` ORM column typed `date` → stores midnight (from the previous task).
- Alerts spec split: **DONE** (see `odd/tasks/alerts-mark-seen.md`).

## Status

Both rounds fixed and live-verified. Not committed — the user explicitly declined commits for this worktree.
Worktree changes stay unstaged/untracked.
