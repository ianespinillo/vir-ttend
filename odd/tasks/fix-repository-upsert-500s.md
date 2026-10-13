# Fix: 500s por persist-instead-of-update en repositorios

## Objetivo
Eliminar los `500 Internal Server Error` que ocurren al editar/desactivar usuarios (y otros
recursos) porque el `save()` de varios repositorios hace `em.persist()` sobre una entidad que
ya existe → INSERT → `duplicate key value violates unique constraint "_pkey"`.

## Problema / Por qué
Reporte del usuario: "hay error status 500 al desactivar y editar". Confirmado con stack traces
de `docker logs vir-ttend_api` (contenedor `vir-ttend_api`, puerto 3001) y con lectura del
`dist/` desplegado (`persist-only`).

## Alcance (autorizado)
- Arreglar el error de sintaxis en `apps/api/src/modules/identity/infrastructure/persistence/repositories/user.repository.ts`
  (falta el `}` que cierra `findById`, línea 21-22) → el build de API no compila.
- Completar el patrón ya establecido en el árbol de trabajo (`findOne` + copia de campos sobre la
  instancia existente, `persist` solo en el `else`) en TODOS los repositorios cuyo `save()` puede
  actualizar una fila existente.
- Correr typecheck/tests. NO reconstruir imágenes Docker sin autorización explícita.

## Fuera de alcance
- Cambios de arquitectura (no migrar a `em.assign`/`em.upsert` si no es necesario).
- Regresar/commitear/pushear. Entrega = decisión del usuario.
- El guard de rutas del cliente (ya arreglado por el usuario: "ya fixee eso").

## Hipótesis de raíz (verificada)
1. `em.persist(mapper.toOrm(entity))` con PK existente → INSERT duplicado → 500.
2. El API corriendo está en imágenes Docker construidas ANTES de estos fixes → verificar en vivo
   requiere rebuild.

## Checklist de tareas
- [ ] T1. Sintaxis de `user.repository.ts` (corchete `findById`) + revisar completitud de campos copiados contra `UserMapper.toOrm`.
- [ ] T2. `attendance/infrastructure/persistence/repository/attendance-alert.repository.ts` — `save()` línea 124 (500 confirmado en `PATCH /alerts/:id/seen`).
- [ ] T3. `attendance/.../justification.repository.ts` — `save()` línea 18.
- [ ] T4. `academic/.../schedule-slot.repository.ts` — `save()` líneas 42,47.
- [ ] T5. `reporting/.../report.repository.ts` — `save()` línea 72.
- [ ] T6. `identity/.../refresh-token.repository.ts` — `save()` líneas 15,27 (rotación de refresh token).
- [ ] T7. Auditar los repos ya modificados en el árbol de trabajo (subject, student, course, academic-year, announcement, tenant, user-tenant-membership, attendance-record) y corregir si algún campo se copió incompleto o quedó `persist` sin guard.
- [ ] T8. Verificación: `tsc --noEmit` en `apps/api` + tests unitarios existentes.

## Criterios de aceptación
- `apps/api` compila sin errores (`tsc --noEmit` / build OK).
- Ningún `save()` hace `persist` de una entidad con PK ya existente.
- Tests existentes en verde (o failures documentados si ya estaban en el base).

## Progress
- [x] Investigación (root cause confirmada con logs + dist)
- [x] T1. `user.repository.ts`: corchete de `findById` + paridad de columnas (agregado `createdAt`, `getValue()`→`getRaw()`).
- [x] T2. `attendance-alert.repository.ts`: findOne + 9 columnas (incluye `seenAt`/`seenBy`, los campos del 500 confirmado).
- [x] T3. `justification.repository.ts`: patrón aplicado.
- [x] T4. `schedule-slot.repository.ts`: `save()` y `saveMany()` (SELECT `$in` + un flush, sin re-insertar PKs existentes).
- [x] T5. `report.repository.ts`: `em.assign` → patrón field-copy (equivalente, ahora consistente).
- [x] T6. `refresh-token.repository.ts`: rotación actualiza en vez de re-insertar; `revokeAllByUserId` queda (instancias ya gestionadas).
- [x] T7. Auditoría de 8 repos ya modificados: columnas faltantes agregadas (`createdAt` en student/academic-year/membership/attendance-record; `schoolId`/`tenantId`/`authorId` en announcement; `contactEmail` en tenant; FKs en attendance-record; `schoolId`→`tenantId` en course; quitado `existing.config` inexistente).
- [x] T8. Verificación (ver abajo).
- [x] T9. Rebuild de imágenes Docker + verificación en vivo (autorizado por el usuario) → los 4 endpoints pasan de 400/500 a 200.
- Pendiente: decisión del usuario sobre commits (el árbol mezcla este fix con trabajo en curso propio) y sobre los 4 hallazgos preexistentes de mappers.

## Verificación (evidencia)
- `npx tsc --noEmit` (cwd `apps/api`) → **exit 0** (corrido por el escritor y re-ejecutado por el orquestador: exit 0).
- `npx jest` (cwd `apps/api`) → **51 suites / 268 tests, 0 fallos**.
- Verificador independiente (segundo agente): `pass` — paridad columna a columna `toOrm()` vs rama de update en los 14 repos OK; ningún `persist` sobre instancia desprendida con PK existente.
- RDD: **off (global)**; riesgo nativo `high` (`hot_path`) → tier alto → verificación independiente ejecutada.
- **En vivo** (tras `docker compose build api client` + `up -d`, autorización del usuario):
  - `PATCH /users/976f22d1.../status` → **200**, DB `is_active` f→t→f verificado (antes 500).
  - `PUT /users/976f22d1...` → **200**, cambio persistido y restaurado (antes 500).
  - `PATCH /alerts/a8960c7e.../seen` → **200**, `seen_at` persistido y luego restaurado a `null` (antes 500).
  - `PUT /academic-years/710d8506...` → **200** con `{year, startDate, endDate, isActive, nonWorkingDays, absenceThresholdPercent, lateCountAbscenseAfterMinutes}` (antes 400 por `forbidNonWhitelisted`). Fechas restauradas a su valor original (`03:00:00+00`).
  - `docker logs vir-ttend_api --since 15m` → **cero `statusCode 5xx`** (sólo los 400/401 esperados del armado de la sesión).
  - Contenedores: `vir-ttend_api` healthy, `vir-ttend_client` Up.

## Hallazgos preexistentes (fuera de alcance, no fixeados)
1. `student.mapper.ts toOrm` omite `courseId` → INSERT con NULL.
2. `schedule-slot.mapper.ts toOrm` omite `subjectId` (columna NOT NULL) → INSERT probablemente falla.
3. Doble mapeo de `attendanceRecordId` en `justification.orm-entity.ts`.
4. `bulkSave` de attendance-record hace N+1 `findOne`; `findByCourseAndDate` tiene un `console.log` olvidado.
