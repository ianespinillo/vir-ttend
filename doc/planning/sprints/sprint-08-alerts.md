# Sprint 08: Alertas Automáticas

**Objetivo:** Sistema de alertas por umbral de ausencia  
**Duración:** 1 semana  
**Estimación:** 25 horas  
**Depende de:** Sprint 05 y 06 (Attendance)

---

## Objetivo

Implementar el sistema de alertas automáticas que se generan cuando un estudiante supera el umbral de ausencia configurable.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 4 |
| Application Layer | 6 |
| Infrastructure Layer | 4 |
| Presentation Layer | 3 |
| Frontend | 8 |
| **Total** | **25** |

---

## Backend

### Domain Layer

**Módulo:** `modules/attendance`

**Archivos a crear:**

```
modules/attendance/
├── domain/
│   ├── entities/
│   │   └── attendance-alert.entity.ts   # NUEVO
│   ├── value-objects/
│   │   ├── alert-id.value-object.ts
│   │   └── alert-type.value-object.ts    # warning | critical | exceeded
│   ├── services/
│   │   └── threshold-checker.service.ts  # NUEVO - genera alertas
│   ├── events/
│   │   ├── alert-triggered.event.ts
│   │   └── alert-seen.event.ts
│   └── repositories/
│       └── attendance-alert.repository.interface.ts  # NUEVO
```

**Detalles de entidades:**

| Entidad | Campos |
|---------|--------|
| AttendanceAlert | id, student_id, academic_year_id, alert_type, absence_percent, seen_by, seen_at, created_at |

**Tipos de alertas:**

| Tipo | Umbral |
|------|--------|
| warning | 50% de ausencias |
| critical | 75% de ausencias |
| exceeded | 100% de ausencias |

### Application Layer

**Módulo:** `modules/attendance/application`

**Archivos a crear:**

```
modules/attendance/
├── application/
│   ├── commands/
│   │   ├── generate-alerts/
│   │   │   ├── generate-alerts.command.ts
│   │   │   └── generate-alerts.handler.ts
│   │   └── mark-alert-seen/
│   │       ├── mark-alert-seen.command.ts
│   │       └── mark-alert-seen.handler.ts
│   ├── queries/
│   │   ├── get-alerts/
│   │   │   ├── get-alerts.query.ts
│   │   │   └── get-alerts.handler.ts
│   │   ├── get-unseen-alerts/
│   │   │   ├── get-unseen-alerts.query.ts
│   │   │   └── get-unseen-alerts.handler.ts
│   │   ├── get-student-alerts/
│   │   │   └── get-student-alerts.handler.ts
│   │   └── get-alerts-count/
│   │       └── get-alerts-count.handler.ts
│   ├── dtos/
│   │   ├── alert.response.dto.ts
│   │   └── alerts-list.response.dto.ts
│   └── attendance.module.ts   # Actualizar
```

### Infrastructure Layer

**Módulo:** `modules/attendance/infrastructure`

**Archivos a crear:**

```
modules/attendance/
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   └── attendance-alert.repository.ts  # NUEVO
│   │   └── attendance.persistence.module.ts   # Actualizar
│   └── events/
│       ├── alert-triggered.handler.ts   # NUEVO - genera alerta
│       └── attendance.events.module.ts
```

### Presentation Layer

**Módulo:** `modules/attendance/presentation`

**Archivos a crear/actualizar:**

```
modules/attendance/
└── presentation/
    ├── controllers/
    │   └── alerts.controller.ts   # NUEVO
    └── attendance.presentation.module.ts   # Actualizar
```

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /alerts | Listar alertas |
| GET | /alerts/unseen | Alertas no vistas |
| GET | /alerts/count | Count de alertas no vistas |
| PATCH | /alerts/:id/seen | Marcar como vista |
| POST | /alerts/generate | Generar alertas manualmente |

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── (dashboard)/
│   └── alerts/
│       ├── page.tsx              # /alerts
│       └── components/
│           ├── alerts-page.tsx
│           ├── alerts-list.tsx
│           └── alert-detail.tsx
```

### Components

**Archivos a crear:**

```
src/components/
├── features/
│   └── alerts/
│       ├── alerts-list/
│       │   ├── alerts-list.tsx
│       │   ├── alert-item.tsx
│       │   └── index.ts
│       └── alert-badge/
│           ├── alert-badge.tsx   # Para el header
│           └── index.ts
```

### Hooks

**Archivos a crear:**

```
packages/hooks/
├── src/
│   ├── attendance/
│   │   ├── use-alerts.ts
│   │   ├── use-unseen-alerts.ts
│   │   ├── use-alerts-count.ts
│   │   └── use-mark-alert-seen.ts
│   └── index.ts   # Actualizar
```

### Layout

**Actualizar header:**

```
src/components/
├── layout/
│   └── header/
│       └── header.tsx   # Agregar AlertBadge
```

---

## Testing

**Archivos a crear:**

```
apps/api/
├── test/
│   └── unit/
│       └── attendance/
│           └── threshold-checker.service.spec.ts
```

---

## Tareas por Día

### Día 1: Domain Layer

- [ ] Crear entidad AttendanceAlert
- [ ] Crear ThresholdCheckerService
- [ ] Crear Value Objects

### Día 2: Application Layer

- [ ] Crear GenerateAlertsCommand
- [ ] Crear MarkAlertSeenCommand
- [ ] Crear queries de alertas

### Día 3: Infrastructure Layer

- [ ] Implementar AttendanceAlertRepository
- [ ] Crear AlertTriggeredHandler

### Día 4: Presentation Layer

- [ ] Crear AlertsController
- [ ] Probar con Postman

### Día 5-6: Frontend

- [ ] Crear página /alerts
- [ ] Crear AlertsList
- [ ] Agregar AlertBadge al header
- [ ] Conectar con API

### Día 7: Integración

- [ ] Test de generación de alertas
- [ ] Test de threshold

---

## Criterios de Aceptación

- [ ] Alertas se generan automáticamente al superar umbral
- [ ] Preceptor ve alertas no vistas al iniciar
- [ ] Badge muestra count de alertas pendientes
- [ ] Marcar como vista funciona

---

## Siguiente Sprint

- Sprint 09: Reportes Mensuales
