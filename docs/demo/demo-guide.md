# Guía de Demo

Este documento tiene dos partes:

1. **Demo offline (`apps/demo`)** — guion para mostrar el producto a un prospecto, sin servidor.
2. **Evaluación de endpoints (API)** — checklist para probar la API real contra el seed de base de datos.

---

## Parte 1 — Demo offline (`apps/demo`)

**Cómo abrirla:** `pnpm --filter demo dev` (ver `apps/demo/README.md`). No requiere base de datos ni red. El estado vive en `localStorage` (`virttend-demo-state:v2`) y el botón **Reset demo** vuelve al estado canónico. El «hoy» de la demo es fijo: **viernes 19/06/2026**, con 60 días hábiles de asistencia. Para ver el tema oscuro, usá el selector de tema de la barra superior; para el tour y las guías, el botón de ayuda (selector de guías).

### Guion sugerido por rol

| Rol (entrar como…) | Recorrido |
|---|---|
| **Administrador** (Ana Gómez) | Panel (el 7º Año A figura «Solo taller») → **Alertas** (11 alertas: 10, 20 y 28 faltas) → **Cursos > 7º Año A**: pestañas *Horario* (franjas por comisión 7A1/7A2), *Estudiantes*, *Comisiones* (mover un alumno, regenerar reparto, asignar preceptor de taller) y *Importar alumnos* → **Ciclo lectivo**: *Ver feriados* y *Suspender clases / Feriado* (con comunicado) |
| **Preceptor secundaria** (Laura Martínez) | **Asistencia diaria** de 3º Año A (estados Tarde, Tarde fuera de tolerancia y Justificada; *Revisar justificaciones*; *Copiar de otro día*) → 7º Año A muestra «Sin asistencia diaria» con acceso a **Asistencia de taller** → comisiones 3A1 y 7A1 → **Estudiantes > Joaquín Díaz > «Ver detalle de asistencias completa»** (historial) |
| **Preceptor de taller** (Marcelo Torres) | **Asistencia de taller**: solo ve las comisiones 3A2 y 7A2, con la marca «Hay taller este día» |
| **Preceptor primaria** (Roberto López) | **Asistencia diaria** de 1º Grado A → Emma Villalba (28 faltas, tres alertas) y Thiago Medina (10 faltas solo por tardanzas) |
| **Docente** (Javier Pérez / Elena Fernández) | **Asistencia por materia**, con la copia de la clase anterior |
| **Superadmin** (Carlos Ramos) | Instituciones y métricas de plataforma |

### Reglas de asistencia que reproduce la demo

- **Faltas ponderadas** (Res. 1650/2024, Anexo 4): ausente y justificada = 1, tarde = 0,25, tarde fuera de tolerancia = 0,5. Con contraturno (taller) cada turno pesa 1/2 y un día nunca pesa más de 1; los reportes muestran «turno X · taller Y».
- **Alertas** a las **10** (advertencia), **20** (crítica) y **28** faltas (excedida, tope institucional). Se generan al guardar asistencia diaria o de taller (una por tipo) y la semilla las reproduce día a día.
- **Reportes** sobre los días efectivamente dictados (`daysGiven`); sin clases el porcentaje es «-».
- **Cursos de 7º año técnico**: solo asistencia de taller; sin asistencia diaria.
- **Comisiones de taller**: uno o dos grupos por curso, reparto alfabético 50/50; las materias de taller solo listan las comisiones de sus franjas.
- **Días no laborables**: se omiten de la asistencia sembrada y declararlos publica el comunicado a toda la institución.

### Qué es simulado

Importación de alumnos (CSV real; otro archivo muestra una planilla de ejemplo), exportaciones de reportes/historial (aviso sin archivo) y las contraseñas. Los docentes de taller sin cuenta solo figuran por nombre. Ver «Diferencias con producción» en `apps/demo/README.md`.

---

## Parte 2 — Evaluación de endpoints (API)

# Guía de Demo — Evaluación de Endpoints

**Proyecto:** Vir-ttend
**Requisito previo:** haber corrido `pnpm --filter api db:seed`.
**API:** `http://localhost:3000` · **Swagger:** `http://localhost:3000/docs`
**Formato de respuesta:** `{ success, data, timeStamp }` (salvo export).

---

## 1. Prerrequisitos

```bash
docker compose up -d
# ajustar DATABASE_URL en apps/api/.env si hace falta:
# postgresql://postgres:postgres@localhost:5436/vir_ttend
pnpm mikro-orm migration:up   # dentro de apps/api
pnpm db:seed                  # (script que se implementa junto con el seed)
pnpm dev
```

---

## 2. Credenciales demo

| Rol | Email | Password | Notas |
|---|---|---|---|
| superadmin | `superadmin@virttend.demo` | `Superadmin1!` | Sin memberships → `isSuperAdmin: true`. Solo él crea tenants |
| admin | `admin@colegio.demo` | `DemoPass1!` | Gestiona todo del tenant |
| preceptor | `preceptor1@colegio.demo` | `DemoPass1!` | Curso 6ºA |
| preceptor | `preceptor2@colegio.demo` | `DemoPass1!` | Cursos 1ºA y 4ºB |
| teacher | `teacher1@colegio.demo` … `teacher4@colegio.demo` | `DemoPass1!` | Un maestro por materia |

Tenant demo: **Colegio Demo San Martín** · subdomain `colegio-demo`.

---

## 3. Flujo de autenticación (una sola vez)

1. `POST /auth/login` → body `{ "email": "admin@colegio.demo", "password": "DemoPass1!" }`. Guarda la cookie `pending_user_id` y devuelve `{ userId, isSuperAdmin, tenants: [{ tenantId, tenantName, role }] }`.
2. `POST /auth/select-tenant` → body `{ "tenantId": "<uuid del tenant>" }` (tomar el `tenantId` del paso anterior). Guarda `access_token` + `refresh_token`.
3. A partir de acá, todos los requests autenticados llevan la cookie `access_token` (Swagger la envía sola).

---

## 4. Checklist por módulo

> Orden sugerido: de arriba hacia abajo. En cada item, `✅` al confirmar la respuesta esperada.
> Los IDs (`courseId`, `subjectId`, `studentId`, `academicYearId`) salen del seed; se pueden copiar de las respuestas de las listas.

### 4.1 Health (público)

- [ ] `GET /health` → `{ success: true, data: { status: 'ok', ... } }`
- [ ] `GET /health/db` → `data.db === 'up'`
- [ ] `GET /health/redis` → `data.redis === 'up'`

### 4.2 Auth

- [ ] `POST /auth/login` (admin) → lista de tenants + cookie `pending_user_id`
- [ ] `POST /auth/select-tenant` → cookie `access_token` + `data.user` con `role`
- [ ] `POST /auth/refresh` → renueva `access_token`
- [ ] `POST /auth/logout` → revoca `refresh_token`

### 4.3 Users

- [ ] `GET /users/me` → `{ id, email, firstName, lastName, role, tenantId, mustChangePassword }`
- [ ] `GET /users?role=teacher&page=1&limit=10` → `{ total, items }`
- [ ] `PUT /users/:id/role` → body `{ "newRole": "teacher" }` (cambiar a otro usuario y revertir)
- [ ] `DELETE /users/:id/membership` → desvincula al usuario del tenant

### 4.4 Tenants (solo superadmin)

- [ ] `POST /tenants` → body `{ "name": "Colegio Test 2", "subdomain": "colegio-test2", "contactEmail": "x@test.edu" }`
- [ ] `GET /tenants` → lista paginada
- [ ] `GET /tenants/:id` → detalle
- [ ] `PUT /tenants/:id` → body `{ "name": "…", "contactEmail": "…" }`
- [ ] `PATCH /tenants/:id/status` → body `{ "isActive": false }` y luego `true`

### 4.5 Announcements

- [ ] `POST /announcements` → `{ title, body, targetType: "school" }` (pública al instante, `publishAt` null)
- [ ] `POST /announcements` → `{ title, body, targetType: "course", targetId: "<courseId>" }`
- [ ] `POST /announcements` → `{ title, body, targetType: "level", targetId: "primary", publishAt: "<fecha futura>" }` (queda `draft`)
- [ ] `GET /announcements/for-me?courseId=<id>&level=PRIMARY` → solo los que aplican al usuario
- [ ] `GET /announcements?status=published` → `{ items, total, page }`
- [ ] `GET /announcements/:id` → detalle
- [ ] `PUT /announcements/:id` → body `{ "body": "…" }` (solo si es `draft`)
- [ ] `PATCH /announcements/:id/publish` → cambia a `published`
- [ ] `DELETE /announcements/:id` → `{ success: true }`

### 4.6 Academic Years

- [ ] `POST /academic-years` → `{ year, startDate, endDate, nonWorkingDays: [], absenceThresholdPercent: 75, lateCountAbscenseAfterMinutes: 15 }` (`schoolId` se ignora, usa el tenant del JWT)
- [ ] `GET /academic-years` → lista
- [ ] `GET /academic-years/active` → el activo
- [ ] `PUT /academic-years/:id` → body `{ "absenceThresholdPercent": 70 }`

### 4.7 Courses

- [ ] `GET /courses?academicYearId=<id>` → los 3 cursos seedeados
- [ ] `GET /courses/by-preceptor?academicYearId=<id>` → cursos del preceptor logueado
- [ ] `GET /courses/:id` → detalle con `subjects[]` y `schedule[]`
- [ ] `POST /courses` → `{ academicYearId, level: "PRIMARY", yearNumber: 5, division: "C", shift: "MORNING", preceptorId: "<id>" }`
- [ ] `PUT /courses/:id` → body `{ "shift": "AFTERNOON" }`
- [ ] `PUT /courses/:id/preceptor` → body `{ "preceptorId": "<otro preceptor>" }`
- [ ] `DELETE /courses/:id` → borra el curso creado arriba

### 4.8 Subjects

- [ ] `GET /subjects?courseId=<id>` → materias del curso (la variante `teacherId`+`academicYearId` está sombreada/no accesible)
- [ ] `POST /subjects` → `{ courseId, teacherId, name, area, weeklyHours }`
- [ ] `PUT /subjects/:id` → body `{ "weeklyHours": 4 }`
- [ ] `PUT /subjects/:id/teacher` → body `{ "teacherId": "<otro teacher>" }`
- [ ] `DELETE /subjects/:id` → borra el creado arriba

### 4.9 Schedule

- [ ] `GET /schedule?courseId=<id>` → bloques horarios del curso
- [ ] `POST /schedule` → `{ subjectId: "<id>", slots: [{ dayOfWeek: "monday", startTime: "08:00", endTime: "09:00" }] }` (el DTO usa `subjectId`; el zod schema usa `courseId` pero manda el DTO)

### 4.10 Students

- [ ] `GET /students?courseId=<id>` → `{ items, total, page }`
- [ ] `GET /students/search?q=apellido` → resultados filtrados
- [ ] `GET /students/:id` → detalle con tutor
- [ ] `POST /students` → `{ firstName, lastName, documentNumber: "45123123", birthDate: "2014-03-15", courseId, tutorName, tutorPhone, tutorEmail? }`
- [ ] `PUT /students/:id` → body `{ "tutorPhone": "…" }`
- [ ] `POST /students/:id/enroll` → body `{ "courseId": "<otro curso>" }`
- [ ] `POST /students/:id/transfer` → body `{ "newCourseId": "<otro curso>" }` (el DTO usa `newCourseId`; el zod schema usa `targetCourseId`)
- [ ] `DELETE /students/:id` → borra el creado arriba

### 4.11 Attendance — Registro

- [ ] `POST /attendance/daily` → `{ courseId, date: "<YYYY-MM-DD>", records: [{ studentId, status: "present" }] }` (status: `present|absent|late|justified`)
- [ ] `POST /attendance/daily/all` → `{ courseId, date, defaultStatus: "absent" }` (bulk del curso)
- [ ] `POST /attendance/subject` → `{ subjectId, courseId, date, records: [{ studentId, status: "late" }] }`
- [ ] `POST /attendance/subject/all` → `{ subjectId, status: "present", date }`
- [ ] `POST /attendance/subject/copy` → `{ subjectId, targetDate: "<YYYY-MM-DD>", sourceDate? }`
- [ ] `POST /attendance/:id/justify` → `{ reason, notes? }` sobre un registro `absent`

### 4.12 Attendance — Consulta

- [ ] `GET /attendance/daily?courseId=<id>&date=<YYYY-MM-DD>` → registros del día
- [ ] `GET /attendance/metrics?courseId=<id>&date=<YYYY-MM-DD>` → métricas del día
- [ ] `GET /attendance/student/:studentId?from=<date>&to=<date>` → historial del alumno
- [ ] `GET /attendance/history?courseId=<id>&from=<date>&to=<date>` → historial del curso
- [ ] `GET /attendance/subject?subjectId=<id>&date=<YYYY-MM-DD>` → asistencia de la materia en la fecha
- [ ] `GET /attendance/subject/:subjectId/history?from=<date>&to=<date>` → historial de la materia

### 4.13 Alerts

- [ ] `GET /alerts?courseId=<id>` → `{ items, total, unseen }`
- [ ] `GET /alerts/unseen` → solo no vistas
- [ ] `GET /alerts/count` → `{ count }`
- [ ] `GET /alerts/student/:studentId?academicYearId=<id>` → alertas del alumno
- [ ] `PATCH /alerts/:id/seen` → marca vista; vuelve a consultar `/alerts/unseen` para confirmar la baja

### 4.14 Dashboard

- [ ] `GET /dashboard?date=<YYYY-MM-DD>` → `{ date, courses: CourseSnapshotDto[] }`
- [ ] `GET /dashboard/course/:courseId?date=<YYYY-MM-DD>` → snapshot + registros
- [ ] `GET /dashboard/metrics?academicYearId=<id>` → `{ averageAttendance, coursesAtRisk, weeklyTrend }`

### 4.15 Reporting

- [ ] `GET /reports/monthly?courseId=<id>&month=<mes>&year=<año>` → reporte seedeado
- [ ] `POST /reports/generate` → `{ courseId, month, year }` → regenera y devuelve `MonthlyReportResponseDto`
- [ ] `GET /reports/course/:courseId/summary?academicYearId=<id>` → resumen del curso
- [ ] `GET /reports/course/:courseId/available` → meses disponibles
- [ ] `GET /reports/student/:studentId?academicYearId=<id>` → reporte del alumno

### 4.16 Export

- [ ] `POST /reports/export/excel` → `{ courseId, month, year, type: "monthly" }` → descarga `.xlsx` (binario, sin envelope)
- [ ] `POST /reports/export/excel` → `{ courseId, month, year, type: "student", studentId: "<id>" }` → `.xlsx`
- [ ] `POST /reports/export/pdf` → `{ courseId, month, year }` → descarga `.pdf`

---

## 5. Endpoints notables / limitaciones conocidas

| Ítem | Nota |
|---|---|
| `GET /subjects` | Solo accesible por `courseId`; la variante por `teacherId` + `academicYearId` está sombreada (duplicada en Express) |
| `POST /alerts/generate` | Constante definida pero **sin handler** — la generación de alertas es por evento (se seedean directo) |
| `GET /attendance/teacher/subjects` | Constante definida, **sin handler** |
| `GET /health` (`AppController`) | Código muerto; el real es `HealthController` |
| Export | Devuelve binario stream (`@Res()`), no envuelto en el envelope |
| `LEVEL` | El valor válido es `SEONDARY` (typo en el código) |
| Roles | `RolesGuard` cableado es no-op: no rechaza por rol. Los roles declarados arriba son la intención de negocio |
| Schedule / transfer | El DTO (class-validator) gana sobre el zod schema (`subjectId`/`newCourseId`) |

---

## 6. Datos de referencia (salidas del seed)

- Tenant: `Colegio Demo San Martín` · subdomain `colegio-demo`
- Año académico: 2026 (activo)
- Cursos: `6º A` (PRIMARY/MORNING, preceptor1) · `1º A` (SEONDARY/AFTERNOON, preceptor2) · `4º B` (SEONDARY/MORNING, preceptor2)
- Estudiantes: ~20 con DNI de 8 dígitos, incluye perfiles con alta inasistencia (para alertas `warning/critical/exceeded`), 1 `INACTIVE` y 1 `TRANSFERRED`
- Alertas: varias `unseen` + una `seen`
- Reportes mensuales: mes actual (y anterior opcional) por curso
- Comunicados: `draft` + publicados a `school`, `course` y `level`
