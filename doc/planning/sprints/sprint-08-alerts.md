# Sprint 08 — Alertas Automáticas

> **Objetivo:** Implementar el sistema de alertas que se genera automáticamente cuando un estudiante supera el umbral de ausencias configurado en el AcademicYear.
> **Duración:** 1 semana · **Estimación:** 28 h · **Dependencias:** Sprint 05, Sprint 06

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 5 |
| Application Layer | 6 |
| Infrastructure Layer | 5 |
| Presentation Layer | 4 |
| Frontend (UI + hooks + páginas) | 8 |
| **Total** | **28** |

---

## Concepto clave: Alertas dirigidas por eventos

Las alertas **no se calculan en el momento del request**. Se generan de forma asíncrona cuando el `AttendanceRegistered` event es emitido (Sprint 05/06). El `ThresholdCheckerHandler` escucha ese evento, calcula el porcentaje actualizado del alumno y crea una `AttendanceAlert` si supera algún umbral. Esto mantiene el registro de asistencia rápido y desacopla la lógica de alertas.

### Umbrales de alerta (fuente de verdad: `@vir-ttend/common`)

| Tipo | Umbral | Color |
|---|---|---|
| `warning` | ≥ 50% de ausencias | Amarillo |
| `critical` | ≥ 75% de ausencias | Naranja |
| `exceeded` | ≥ 100% (superó el límite) | Rojo |

> Nota: los porcentajes de ATTENDANCE_THRESHOLDS en `packages/common` son para la UI (75% y 85% para semáforo). Los umbrales de alerta son distintos y están aquí definidos por el dominio.

---

## 1. Domain Layer — `modules/attendance/domain` (ampliar)

```
apps/api/src/modules/attendance/domain/
├── entities/
│   └── attendance-alert.entity.ts          # Aggregate root de una alerta
├── value-objects/
│   ├── alert-id.value-object.ts
│   └── alert-type.value-object.ts          # 'warning' | 'critical' | 'exceeded'
│                                           # con método: fromPercent(percent): AlertType
├── services/
│   └── threshold-checker.service.ts        # checkStudent(studentId, courseId, academicYear): AlertType | null
│                                           # 1. calcula porcentaje con AttendanceCalculationService
│                                           # 2. compara contra umbrales
│                                           # 3. retorna el tipo de alerta o null si está OK
│                                           # 4. no crea la alerta directamente — solo determina el tipo
└── repositories/
    └── attendance-alert.repository.interface.ts # findByStudent, findUnseen, countUnseen,
                                                # findByPreceptor, markAsSeen, save
```

### Esquema de entidad

| Entidad | Campos |
|---|---|
| `AttendanceAlert` | `id`, `studentId`, `courseId`, `academicYearId`, `tenantId`, `alertType`, `absencePercent` (snapshot del % en el momento), `seenBy` (userId, nullable), `seenAt` (nullable), `createdAt` |

### Lógica de deduplicación

```ts
// Solo se crea una alerta si:
// 1. No existe una alerta activa (no vista) del mismo tipo para ese alumno+curso+año
// 2. O el porcentaje aumentó lo suficiente para escalar a un tipo mayor
// Se evita spam: si ya hay una alerta 'warning', no se crea otra 'warning'
// Si escala a 'critical', se crea 'critical' y la 'warning' existente se marca como vista automáticamente
```

---

## 2. Application Layer — `modules/attendance/application` (ampliar)

```
apps/api/src/modules/attendance/application/
├── commands/
│   ├── generate-alert/
│   │   ├── generate-alert.command.ts       # { studentId, courseId, academicYearId }
│   │   └── generate-alert.handler.ts       # usa ThresholdCheckerService, aplica deduplicación
│   │                                       # crea AttendanceAlert si corresponde, emite AlertTriggered
│   └── mark-alert-seen/
│       ├── mark-alert-seen.command.ts      # { alertId, seenBy: userId }
│       └── mark-alert-seen.handler.ts      # actualiza seenBy y seenAt
├── queries/
│   ├── get-alerts/
│   │   ├── get-alerts.query.ts             # { preceptorId, courseId?, alertType?, page, limit }
│   │   └── get-alerts.handler.ts           # lista alertas del preceptor con datos del alumno
│   ├── get-unseen-alerts/
│   │   ├── get-unseen-alerts.query.ts      # { preceptorId }
│   │   └── get-unseen-alerts.handler.ts    # alertas con seenAt = null
│   ├── get-alerts-count/
│   │   ├── get-alerts-count.query.ts       # { preceptorId }
│   │   └── get-alerts-count.handler.ts     # COUNT rápido para el badge del header
│   └── get-student-alerts/
│       ├── get-student-alerts.query.ts     # { studentId, academicYearId }
│       └── get-student-alerts.handler.ts   # historial de alertas de un alumno específico
├── dtos/
│   ├── alert.response.dto.ts               # id, studentId, studentName, courseId, courseName,
│   │                                       # alertType, absencePercent, seenAt, createdAt
│   ├── alerts-list.response.dto.ts         # items: AlertResponseDto[], total, unseen
│   └── alerts-count.response.dto.ts        # count: number
└── attendance.module.ts                    # actualizar
```

---

## 3. Infrastructure Layer — `modules/attendance/infrastructure` (ampliar)

```
apps/api/src/modules/attendance/infrastructure/
├── persistence/
│   ├── entities/
│   │   └── attendance-alert.orm-entity.ts  # @Entity() AttendanceAlert
│   │                                       # @Index(['student_id', 'academic_year_id', 'alert_type'])
│   ├── repositories/
│   │   └── attendance-alert.repository.ts  # implementa IAttendanceAlertRepository
│   │                                       # countUnseen: query optimizada con COUNT
│   ├── mappers/
│   │   └── attendance-alert.mapper.ts
│   └── attendance.persistence.module.ts   # actualizar: agregar AttendanceAlertOrmEntity y repo
└── events/
    ├── attendance-registered.listener.ts   # REEMPLAZAR el listener placeholder del Sprint 05
    │                                       # @OnEvent('attendance.registered')
    │                                       # → por cada record del evento: ejecuta GenerateAlertCommand
    ├── alert-triggered.listener.ts         # @OnEvent('alert.triggered') → loguea la alerta
    │                                       # Futuro: enviar email/notificación
    └── attendance.events.module.ts        # actualizar: registrar alert-triggered.listener
```

### Migración a generar

```bash
pnpm mikro-orm migration:create --name=create_attendance_alerts
```

Tabla:
- `attendance_alerts` (id, student_id, course_id, academic_year_id, tenant_id, alert_type, absence_percent, seen_by, seen_at, created_at)
- Índice: `(student_id, academic_year_id, alert_type)` — para deduplicación eficiente
- Índice: `(seen_at)` — para filtrar no vistas eficientemente

---

## 4. Presentation Layer — `modules/attendance/presentation` (ampliar)

```
apps/api/src/modules/attendance/presentation/
├── controllers/
│   └── alerts.controller.ts                # endpoints de alertas
└── attendance.presentation.module.ts      # actualizar
```

### Endpoints

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/alerts?courseId=&alertType=&page=&limit=` | `preceptor`, `admin` | Listar alertas del preceptor |
| `GET` | `/alerts/unseen` | `preceptor`, `admin` | Alertas no vistas |
| `GET` | `/alerts/count` | `preceptor`, `admin` | Count de alertas no vistas (para badge) |
| `GET` | `/alerts/student/:studentId?academicYearId=` | `preceptor`, `admin` | Alertas de un alumno |
| `PATCH` | `/alerts/:id/seen` | `preceptor`, `admin` | Marcar como vista |
| `POST` | `/alerts/generate` | `admin` | Generar alertas manualmente (para testing/batch) |

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/alerts/
├── alerts-list/
│   ├── index.ts
│   ├── alerts-list.tsx                     # Lista completa de alertas con filtros
│   │                                       # Props: alerts: AlertResponseDto[], onMarkSeen, onViewStudent
│   └── alert-item.tsx                      # Ítem de alerta: tipo (badge coloreado) + alumno + % + fecha
│                                           # Props: alert, onMarkSeen, onClick
├── alert-badge/
│   ├── index.ts
│   └── alert-badge.tsx                     # Badge numérico para el topbar/header
│                                           # Muestra el count de alertas no vistas
│                                           # Props: count: number, onClick
├── alert-type-badge.tsx                    # Badge de tipo: warning (amarillo) | critical (naranja) | exceeded (rojo)
│                                           # Props: type: AlertType
└── student-alerts-summary.tsx             # Resumen de alertas de un alumno en StudentDetail (Sprint 04)
                                            # Props: alerts: AlertResponseDto[]
```

### 5.2 `packages/ui` — actualizar componentes existentes

```
packages/ui/src/components/layout/
└── topbar.tsx                              # Agregar AlertBadge junto al nombre del usuario
                                            # Props: agregar alertsCount: number, onAlertsClick
```

```
packages/ui/src/components/features/students/
└── student-detail.tsx                     # Agregar tab "Alertas" con StudentAlertsSummary
                                            # (ya existe el componente, solo se agrega el tab)
```

### 5.3 `packages/hooks` — hooks nuevos

> **Patrón:** todos los hooks importan `apiClient` de `../lib/axios-client` (interno de `packages/hooks`) y las rutas de `@vir-ttend/common`. Ningún hook hardcodea URLs ni importa axios directamente.

```
packages/hooks/src/
├── attendance/
│   ├── use-alerts.ts                       # useQuery → apiClient.get(alerts?courseId=&alertType=&page=
│   ├── use-unseen-alerts.ts                # useQuery → apiClient.get(alerts/unseen
│   ├── use-alerts-count.ts                 # useQuery con refetchInterval: 60000
│   │                                       # → GET /alerts/count (polling para badge en header)
│   ├── use-mark-alert-seen.ts             # useMutation → apiClient.patch(alerts/:id/seen
│   │                                       # onSuccess: invalida alerts-count y unseen-alerts
│   └── use-student-alerts.ts              # useQuery → apiClient.get(alerts/student/:id
└── index.ts                               # actualizar
```

### 5.4 `apps/client` — páginas

```
apps/client/src/app/(dashboard)/
└── alerts/
    └── page.tsx                            # Importa AlertsList de @vir-ttend/ui
                                            # Usa useAlerts, useMarkAlertSeen
                                            # Filtros por tipo y curso en la URL (query params)
```

### 5.5 `apps/client` — layout actualizar

```
apps/client/src/app/(dashboard)/layout.tsx  # Usar useAlertsCount con refetch cada 60s
                                            # Pasar count al Topbar de @vir-ttend/ui
```

---

## 6. Testing

```
apps/api/test/unit/attendance/
├── threshold-checker.service.spec.ts       # checkStudent: sin alerta, warning, critical, exceeded
│                                           # deduplicación: no crea warning si ya existe warning
├── generate-alert.handler.spec.ts          # mock repos y ThresholdCheckerService
│                                           # verificar escalada: warning existente → nueva critical
└── attendance-registered.listener.spec.ts  # verificar que invoca GenerateAlertCommand por cada record
```

---

## 7. Tareas por día

### Día 1: Domain Layer
- [ ] Crear entidad `AttendanceAlert`
- [ ] Crear `AlertTypeVO` con `fromPercent()`
- [ ] Implementar `ThresholdCheckerService` con lógica de deduplicación

### Día 2: Application Layer — commands y eventos
- [ ] `GenerateAlertCommand` + handler
- [ ] `MarkAlertSeenCommand` + handler
- [ ] Reemplazar `attendance-registered.listener.ts` con lógica real

### Día 3: Application Layer — queries + DTOs
- [ ] Queries: GetAlerts, GetUnseenAlerts, GetAlertsCount, GetStudentAlerts
- [ ] DTOs con datos de alumno y curso anidados

### Día 4: Infrastructure Layer
- [ ] ORM entity con índices
- [ ] `AttendanceAlertRepository` con `countUnseen` optimizado
- [ ] `AlertTriggeredListener`
- [ ] Migración

### Día 5: Presentation Layer
- [ ] `AlertsController` con todos los endpoints
- [ ] Probar flujo completo: registrar asistencia → verificar alerta generada

### Día 6–7: Frontend
- [ ] Componentes de alertas en `packages/ui`
- [ ] Actualizar `Topbar` con badge
- [ ] Actualizar `StudentDetail` con tab de alertas
- [ ] Hooks y página en `apps/client`
- [ ] Actualizar layout con polling de count

---

## 8. Criterios de aceptación

- [ ] Al registrar asistencia, el `ThresholdChecker` calcula el porcentaje del alumno automáticamente
- [ ] Se crea alerta `warning` cuando el alumno supera 50% de ausencias
- [ ] Se crea alerta `critical` cuando supera 75% (y se auto-cierra la `warning` anterior)
- [ ] Se crea alerta `exceeded` cuando supera 100%
- [ ] No se crean alertas duplicadas del mismo tipo para el mismo alumno en el mismo año
- [ ] Badge del topbar muestra el conteo correcto de alertas no vistas
- [ ] Marcar como vista actualiza el badge inmediatamente
- [ ] Preceptor solo ve alertas de sus propios cursos

---

**Siguiente sprint →** Sprint 09: Reportes Mensuales
