# Slots infinitos por materia (sin tope de horas semanales)

## Objective
Impedir que una misma materia reciba franjas horarias sin límite validando que la suma
de duraciones de sus franjas no supere sus `weeklyHours`.

## Root cause
1. `POST /schedule` con `courseId` reemplaza todas las franjas del curso
   (`apps/api/src/modules/academic/application/commands/set-schedule/set-schedule.handler.ts`).
2. El único validador es `CourseService.validateScheduleOverlap` (pares) -> `ScheduleSlot.overlaps`
   (día + intervalo horario). **No mira la materia ni `weeklyHours`.**
3. `ScheduleSlot.create` sólo exige `startTime < endTime`. No hay tope de cantidad.
4. Consecuencia: franjas **no solapadas ilimitadas** por materia (hasta ~1439 de 1 min/día x 5 días).
   El `weeklyHours` ("N hs/sem", mostrado en el selector) nunca se usa para validar.

## Regla (decidida por el usuario)
Suma de duraciones de las franjas de una materia **<= `weeklyHours`** (se permite menos, nunca más).

## Scope
- API: `CourseService.validateWeeklyHours` + wiring en `set-schedule.handler.ts` (rama `courseId` y `subjectId`).
  Se lanza `DomainError` -> el filtro global lo mapea a **HTTP 400** `{ statusCode, message, error }`.
- UI: chequeo espejo en `ScheduleForm` (evita cerrar el modal y muestra el error sin esperar al backend).
- Tests: unit de API (TDD).

## Out of scope
- Sin commits (el usuario declinó commitear en este worktree; el fix queda en working tree).
- No se cambia la semántica de `weeklyHours` ni el chequeo de solapamiento existente.

## Tasks
- [ ] T1 Contrato + validación: `CourseService.validateWeeklyHours` (RED -> GREEN).
- [ ] T2 Wiring del handler (`courseId` + `subjectId`) + tests del handler.
- [ ] T3 Chequeo espejo en el cliente (`ScheduleForm`).
- [ ] T4 Verificación: jest API, ts:check api/ui, tests UI, E2E live, rebuild/deploy.

## Checks
- `pnpm -C apps/api exec jest --silent test/unit/academic`
- `pnpm -C apps/api ts:check`
- `pnpm -C packages/ui ts:check` (+ suite de tests UI)
- E2E live contra `http://localhost:3001` (crear curso/materia de prueba y exceder `weeklyHours` -> 400).

## Constraints
- **No commit** (decisión del usuario; working tree permanece sin commitear).
