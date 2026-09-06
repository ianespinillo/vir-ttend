# Demo Data Seeds — Plan

**Proyecto:** Vir-ttend
**Objetivo:** Generar data seeds para una demo que permita evaluar **todos** los endpoints del API.
**Estado:** Propuesta con opciones · **Decisión tomada:** A+A+A+A (recomendado, ver sección 3)

---

## 1. Contexto relevante (investigación)

| Hecho | Detalle |
|---|---|
| Stack | NestJS 10 + MikroORM 6.6 + PostgreSQL 16 + Redis 7 (monorepo Turborepo) |
| API | `apps/api`, puerto `3000`, Swagger en `/docs` y `/docs-json` |
| Auth | Cookies httpOnly: `POST /auth/login` → cookie `pending_user_id` → `POST /auth/select-tenant` → cookies `access_token` (15 min) + `refresh_token` (7 días) |
| Envelope | `TransformInterceptor` global: `{ success, data, timeStamp }`; excepciones `{ success, statusCode, message, error }`. Export (Excel/PDF) streamea binario sin envelope |
| Superadmin | Usuario **sin memberships** (`login.handler.ts` lo detecta y devuelve `isSuperAdmin: true`) |
| Multi-tenancy | El tenant activo sale del claim JWT (`user.tenantId`); los repos filtran por `tenantId`/`schoolId`. Sin aislamiento a nivel ORM |
| RolesGuard | El guard cableado es un **no-op** (no rechaza por rol). Se respeta igualmente el rol declarado en cada endpoint |
| Seeds existentes | **Ninguno.** `turbo.json` declara `db:seed` como tarea pero no hay script ni `@mikro-orm/seeder` |

### Pitfalls al seedear (críticos)

1. **Columnas FK duplicadas** de MikroORM (scalar + camelCase) en: `courses.academic_year_id`/`academicYearId`, `subjects.course_id`/`courseId`, `students.course_id`/`courseId`, `schedule_slots.subject_id`/`subjectId`, `justification.attendance_record_id`/`attendanceRecordId`. Ambas deben tener el mismo valor.
2. **Enums por caso:** roles (`superadmin|admin|preceptor|teacher`) y `ATTENDANCE_STATUS` (`present|absent|late|justified`) y `DAYOFWEEK` (`monday..friday`) en **minúsculas**; `LEVEL` y `SHIFT` y `STUDENTSTATUS` en **MAYÚSCULAS**.
3. **Typo `LEVEL.SEONDARY`** — en los seeds usar `'SEONDARY'`, nunca `'SECONDARY'`.
4. Tablas `attendanceRecord` (camelCase) y `justification` (singular); su `id` **no tiene default en BD** (hay que generarlo).
5. `courses.division`: migración lo define `int`, el ORM lo mapea como `string`. Seedear vía ORM (funciona string) o verificar el esquema vivo antes de SQL crudo.
6. `students.documentNumber`: DNI de **8 dígitos** (VO: `/^\d{8}$/`, ≥ 1000000).
7. **Password** (VO `password.vo.ts`): regex `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/`. Hash bcrypt (`bcryptjs`).
8. `school_id` en `academic_years`, `courses`, `announcements` = **UUID del tenant**.
9. `attendanceRecord` única `(course_id, student_id, subject_id, date)`: diaria → `subject_id = NULL`; por materia → UUID de la materia.
10. Alertas: `absence_percent` real (≥50 `warning`, ≥75 `critical`, ≥100 `exceeded`); se generan por evento, por eso se seedean directo.
11. `monthly_reports`: única `(course_id, month, year)`; `data` jsonb con shape `IMonthlyReportData`.

---

## 2. Opciones por decisión

### Decisión 1 — Mecanismo de seeding

| Opción | Descripción | Pros | Contras |
|---|---|---|---|
| **A. Script standalone con MikroORM** | `apps/api/scripts/seed.ts` + script `db:seed`. Bootstrappea `MikroORM.init(config)` y escribe con `EntityManager` / repositorios de dominio | Sin dependencias nuevas; reutiliza entidades y VOs (valida password/DNI); evita columnas FK duplicadas; seed de alertas directo; reset trivial | Bootstrap a mano |
| **B. Extension `@mikro-orm/seeder`** | Agregar dependencia y clases `Seeder` oficiales | Idiomático, integrado al CLI (`database:seed`) | Nueva dependencia + config |
| **C. Vía HTTP (login + endpoints)** | Script que crea todo llamando a la API real | Valida endpoints de creación de paso | Frágil, lento, **no genera alertas** (event-driven, sin `POST /alerts/generate`). Descartada |

### Decisión 2 — Verificación de endpoints

| Opción | Descripción |
|---|---|
| **A. Guía de demo + checklist** | Doc con credenciales, orden de ejecución y request/response esperado por endpoint (Swagger) |
| **B. Colección Postman/Bruno** | Colección importable con todos los requests organizados por flujo |
| **C. Smoke test e2e (supertest)** | Test que golpea todos los endpoints y reporta éxito/fallo |
| **D. Checklist + Postman** | Combinación de A y B |

### Decisión 3 — Alcance de datos demo

| Opción | Descripción |
|---|---|
| **A. 1 escuela completa** | 1 tenant, 1 año académico activo, 3 cursos (Primaria 6ºA mañana, Secundaria 1ºA tarde, Secundaria 4ºB mañana), 3–4 materias por curso, horarios, ~20 estudiantes, asistencia diaria + por materia de ~3 semanas, justificaciones, alertas, reportes mensuales, comunicados. Cubre el 100% de los endpoints |
| **B. 2 escuelas multi-tenant** | Todo lo de A + un segundo tenant con 1 curso para demostrar aislamiento |
| **C. Mínimo funcional** | 1 tenant, 1 curso, 3 materias, 5 estudiantes |

### Decisión 4 — Ubicación de la documentación

| Opción | Descripción |
|---|---|
| **A. Crear `doc/opencode/`** | Guardar aquí el plan y la guía de demo |
| **B. `doc/planning/demo/`** | Junto a los sprints |
| **C. Solo en el chat** | No guardar nada |

---

## 3. Decisión tomada (recomendada)

| Decisión | Elección |
|---|---|
| 1. Seeding | **A — Script standalone con MikroORM** (`apps/api/scripts/seed.ts` + `db:seed`) |
| 2. Verificación | **A — Guía de demo + checklist** (`doc/opencode/demo-guide.md`) |
| 3. Alcance | **A — 1 escuela completa** |
| 4. Ubicación | **A — `doc/opencode/`** |

---

## 4. Plan de ejecución

### Fase 0 — Preparación
- `docker compose up -d` (Postgres `5436`, Redis `6379`).
- Verificar/ajustar `DATABASE_URL` en `apps/api/.env` (`postgresql://postgres:postgres@localhost:5436/vir_ttend`).
- Aplicar migraciones: `pnpm mikro-orm migration:up` (en `apps/api`).

### Fase 1 — Seed script (`apps/api/scripts/seed.ts`)
1. `MikroORM.init(ormConfig)` (la misma config de `mikro-orm.config.ts`).
2. **Reset** en orden inverso de dependencias: `justification` → `attendanceRecord` → `attendance_alerts` → `monthly_reports` → `announcements` → `schedule_slots` → `students` → `subjects` → `courses` → `academic_years` → `refresh_tokens` → `user_tenant_memberships` → `tenants` → `users`.
3. Insertar datos con **entidades de dominio + repositorios** (o EM con ORM entities) para que los VOs validen.
4. Asistencias con **fechas relativas a hoy** (últimas 3 semanas hábiles) → dashboard/reportes siempre con datos.
5. Hash de passwords con `bcryptjs` + VO `Password`.
6. Log final: credenciales y IDs de referencia.

### Fase 2 — Script npm
- `apps/api/package.json`: `"db:seed": "ts-node -r tsconfig-paths/register scripts/seed.ts"`.
- Verificar que `turbo.json` ya tiene la tarea `db:seed` y que `pnpm db:seed` resuelve el workspace correcto.

### Fase 3 — Documentación demo
- `doc/opencode/demo-guide.md` (ver entregable).

### Fase 4 — Verificación
- Levantar `pnpm dev`, recorrer la checklist.
- Validar login por rol, dashboard con datos, alertas, `PATCH /alerts/:id/seen`, generación de reporte, export Excel/PDF, aislamiento de tenant.

---

## 5. Dataset demo (Decisión 3 — 1 escuela completa)

### 5.1 Identidad
- **Superadmin** global (sin memberships): `superadmin@virttend.demo` / `Superadmin1!`.
- **Tenant:** `Colegio Demo San Martín` · subdomain `colegio-demo` (único) · `contacto@colegiodemo.edu`.
- **Usuarios del tenant** (password común `DemoPass1!`):
  - `admin@colegio.demo` → `admin`
  - `preceptor1@colegio.demo` → `preceptor` (preceptor del curso A)
  - `preceptor2@colegio.demo` → `preceptor` (preceptor de los cursos B/C)
  - `teacher1@colegio.demo` … `teacher4@colegio.demo` → `teacher` (uno por materia)

### 5.2 Académico
- **Año académico** actual (activo): `startDate` 2026-03-02, `endDate` 2026-12-18, `nonWorkingDays` feriados, `absenceThresholdPercent: 75`, `lateCountAbscenseAfterMinutes: 15`.
- **Cursos:**
  | Curso | level | yearNumber | division | shift | preceptorId |
  |---|---|---|---|---|---|
  | 6º A | `PRIMARY` | 6 | `A` | `MORNING` | preceptor1 |
  | 1º A | `SEONDARY` | 1 | `A` | `AFTERNOON` | preceptor2 |
  | 4º B | `SEONDARY` | 4 | `B` | `MORNING` | preceptor2 |
- **Materias por curso** (3–4 c/u), con `teacherId` asignado y `weeklyHours` ≥ 1.
- **Horarios** (`schedule_slots`): bloques `dayOfWeek` minúsculas + `startTime`/`endTime` HH:mm, consistentes con el shift.

### 5.3 Estudiantes (~20, DNI de 8 dígitos)
- ~8 en 6ºA, ~7 en 1ºA, ~5 en 4ºB. Tutor con `tutorName`, `tutorPhone`, `tutorEmail` opcional.
- Perfiles diseñados: 2 con alta inasistencia (para alertas `critical`/`exceeded`), 2 con tardanzas, 1 inactivo, 1 transferido (para testear status).

### 5.4 Asistencia y alertas
- **Diaria** (`subject_id = NULL`): últimos 15 días hábiles por curso.
- **Por materia**: últimas 3 semanas según el horario, con mezcla `present/absent/late/justified`.
- **Justificaciones** sobre registros `absent`/`late` (1:1 con `attendanceRecord`).
- **Alertas** directas: `warning` (≥50%), `critical` (≥75%), `exceeded` (≥100%), varias `unseen` + una `seen` para testear `PATCH /alerts/:id/seen`.

### 5.5 Reportes y comunicados
- **Reportes mensuales** del mes actual (y mes anterior opcional) por curso, con `data` jsonb válido (`IMonthlyReportData`).
- **Comunicados:** draft + publicado a `school`, publicado a `course` (UUID), publicado a `level` (`primary`/`secondary`), con/sin `publishAt`.

---

## 6. Entregables

| # | Entregable | Ruta |
|---|---|---|
| 1 | Plan aprobado | `doc/opencode/demo-seed-plan.md` (este archivo) |
| 2 | Seed script | `apps/api/scripts/seed.ts` |
| 3 | Script npm | `apps/api/package.json` (`db:seed`) |
| 4 | Guía de demo + checklist | `doc/opencode/demo-guide.md` |

**Opcionales (no elegidos):** colección Postman/Bruno, smoke test e2e, segundo tenant.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Columnas FK duplicadas mal pobladas | Seedear vía ORM (popula ambas automáticamente) |
| División int vs string | Verificar con `db:generate` o seedear vía ORM |
| Fechas fijas que quedan viejas | Fechas relativas a hoy en el script |
| Alertas no generables por API | Seedear la tabla `attendance_alerts` directo |
| `LEVEL=SEONDARY` typo | Constante compartida `LEVEL` de `@repo/common` |
| Reset parcial | Orden de borrado por dependencias + transacción |
