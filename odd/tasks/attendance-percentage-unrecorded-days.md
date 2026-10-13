# Porcentaje de asistencia diluido por clases sin asistencia tomada

## Objective
Que el porcentaje de asistencia/ausencia de un curso no baje artificialmente cuando
hay clases programadas sin asistencia tomada. Debe calcularse solo sobre los registros
efectivamente cargados.

## Root cause
`CourseSnapshot` (`apps/api/src/modules/attendance/domain/value-objects/course-snapshot.vo.ts`)
calculaba:
- `totalSlots = expectedClasses * totalStudents`, donde `expectedClasses` = días de clase
  **programados** en el rango (se haya tomado asistencia o no).
- `absencePercent = (absents + late) / totalSlots * 100`
- `presentsPercent = (presents + late) / totalSlots * 100`

Las clases programadas sin asistencia tomada inflaban el denominador sin aportar al
numerador, bajando ambos porcentajes (y ocultando riesgo vía `getRiskStatus`).

El demo de referencia (`apps/demo/src/lib/store/selectors.ts`, `getCourseSnapshot`) usa
`expected = distinctRecordedDates * students`, es decir, solo días **con** registros.

## Regla
Denominador de los porcentajes = **registros cargados** (`present + absent + late + justified`).
`notRecorded` se mantiene como `expectedClasses * totalStudents - registros` ("sin cargar" en la UI).

## Scope
- API: `CourseSnapshot` (`absencePercent`, `presentsPercent` -> `recordedSlots`; se elimina el
  getter `totalSlots` y el campo `_expectedClasses`, ahora sin uso).
- Tests: `apps/api/test/unit/attendance/course-snapshot.vo.spec.ts` (TDD RED -> GREEN).

## Out of scope
- Sin commits (el usuario declinó commitear en este worktree; el fix queda en working tree).
- `get-subject-history` y el módulo `reporting` ya usan denominador de registros (correctos).
- No se cambia la semántica de `late` en los numeradores.

## Tasks
- [x] T1 Reescribir el spec del VO con el escenario de dilución (RED: 4 fails).
- [x] T2 Corregir denominador a `recordedSlots` (GREEN: 10/10).
- [x] T3 Verificar módulo attendance + ts:check.

## Checks
- `pnpm -C apps/api exec jest --silent test/unit/attendance/course-snapshot.vo.spec.ts` -> 10/10
- `pnpm -C apps/api exec jest --silent test/unit/attendance` -> 86/86
- `pnpm -C apps/api ts:check` -> limpio

## Observaciones relacionadas (no corregidas, fuera de alcance)
- `AttendanceCalculationService.calculateAbscensePercent` (usada por alertas) divide por
  `expectedClasses` y `generate-alert.handler` no pasa `subjectId` -> `expectedClasses = 0`
  (división por cero / Infinity). Revisar por separado.
- Inconsistencia de `late`/`justified` entre `report-generation.service` y
  `metrics-calculation.service` en el módulo reporting.

## Constraints
- **No commit** (decisión del usuario; working tree permanece sin commitear).
