# Estructura de Directorios - Backend

**Proyecto:** Vir-ttend  
**Tipo:** NestJS con Arquitectura Hexagonal y DDD  
**Versión:** 1.0 MVP

---

## 1. Estructura General del Monorepo

```
vir-ttend/
├── apps/
│   ├── api/                 # NestJS API
│   └── client/               # Next.js Frontend
├── packages/
│   ├── common/               # DTOs, interfaces, tipos compartidos
│   ├── hooks/                # TanStack Query hooks
│   ├── ui/                   # Componentes shadcn/ui
│   ├── eslint-config/
│   └── typescript-config/
├── doc/                     # Documentación
└── turbo.json               # Turborepo config
```

---

## 2. Estructura del Backend (apps/api)

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/               # Configuración global
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── app.config.ts
│   │
│   ├── common/               # Shared recursos del API
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── tenant.decorator.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   └── constants/
│   │       └── roles.ts
│   │
│   ├── modules/              # Bounded Contexts
│   │   ├── identity/         # Autenticación, usuarios, tenants
│   │   ├── academic/         # Cursos, materias, estudiantes
│   │   ├── attendance/       # Registros de asistencia
│   │   └── reporting/       # Reportes y analytics
│   │
│   └── shared/               # Recursos compartidos entre módulos
│       ├── database/
│       │   ├── entities/     # Entidades base
│       │   └── migrations/   # Migraciones MikroORM
│       ├── cache/
│       │   └── cache.module.ts
│       ├── events/
│       │   ├── event-bus.module.ts
│       │   └── handlers/
│       └── email/
│           └── email.service.ts
│
├── test/
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## 3. Estructura de un Bounded Context (Arquitectura Hexagonal)

### 3.1 Patrón General

```
modules/<bounded-context>/
├── application/              # Capa de Aplicación (CASOS DE USO)
│   ├── commands/             # Escritura (CQRS Write)
│   │   ├── <feature>/
│   │   │   ├── <feature>.command.ts
│   │   │   └── <feature>.handler.ts
│   │   └── index.ts
│   ├── queries/               # Lectura (CQRS Read)
│   │   ├── <feature>/
│   │   │   ├── <feature>.query.ts
│   │   │   └── <feature>.handler.ts
│   │   └── index.ts
│   ├── dtos/                  # Data Transfer Objects
│   │   ├── <feature>.request.dto.ts
│   │   └── <feature>.response.dto.ts
│   └── <context>.module.ts   # Module raíz del contexto
│
├── domain/                   # Capa de Dominio
│   ├── entities/             # Entidades del dominio
│   │   ├── <entity>.entity.ts
│   │   └── index.ts
│   ├── value-objects/         # Value Objects
│   │   ├── <vo>.value-object.ts
│   │   └── index.ts
│   ├── aggregates/           # Aggregate Roots
│   │   ├── <aggregate>.aggregate.ts
│   │   └── index.ts
│   ├── services/              # Servicios de dominio
│   │   ├── <domain-service>.service.ts
│   │   └── index.ts
│   ├── events/               # Domain Events
│   │   ├── <event>.event.ts
│   │   └── index.ts
│   ├── repositories/          # Interfaces de repositorios
│   │   ├── <entity>.repository.interface.ts
│   │   └── index.ts
│   └── <context>.types.ts    # Tipos internos del dominio
│
├── infrastructure/           # Capa de Infraestructura
│   ├── persistence/          # Implementación de repositorios
│   │   ├── repositories/
│   │   │   ├── <entity>.repository.ts
│   │   │   └── index.ts
│   │   ├── mappers/
│   │   │   ├── <entity>.mapper.ts
│   │   │   └── index.ts
│   │   └── <context>.persistence.module.ts
│   ├── external/             # Servicios externos
│   │   ├── <service>/
│   │   │   └── <service>.client.ts
│   │   └── index.ts
│   └── events/               # Event Handlers
│       ├── <event>.handler.ts
│       └── index.ts
│
└── presentation/             # Capa de Presentación (API)
    ├── controllers/
    │   ├── <resource>.controller.ts
    │   └── index.ts
    ├── routes/
    │   ├── <resource>.routes.ts
    │   └── index.ts
    └── <context>.presentation.module.ts
```

### 3.2 Ejemplo Concreto: Identity Context

```
modules/identity/
├── application/
│   ├── commands/
│   │   ├── login/
│   │   │   ├── login.command.ts
│   │   │   └── login.handler.ts
│   │   ├── register-user/
│   │   │   ├── register-user.command.ts
│   │   │   └── register-user.handler.ts
│   │   ├── refresh-token/
│   │   │   ├── refresh-token.command.ts
│   │   │   └── refresh-token.handler.ts
│   │   └── create-tenant/
│   │       ├── create-tenant.command.ts
│   │       └── create-tenant.handler.ts
│   ├── queries/
│   │   ├── get-current-user/
│   │   │   ├── get-current-user.query.ts
│   │   │   └── get-current-user.handler.ts
│   │   └── list-users/
│   │       ├── list-users.query.ts
│   │       └── list-users.handler.ts
│   ├── dtos/
│   │   ├── login.request.dto.ts
│   │   ├── login.response.dto.ts
│   │   └── user.response.dto.ts
│   └── identity.module.ts
│
├── domain/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── tenant.entity.ts
│   │   ├── school.entity.ts
│   │   └── refresh-token.entity.ts
│   ├── value-objects/
│   │   ├── user-id.value-object.ts
│   │   ├── tenant-id.value-object.ts
│   │   ├── email.value-object.ts
│   │   └── password.value-object.ts
│   ├── aggregates/
│   │   ├── user.aggregate.ts
│   │   └── tenant.aggregate.ts
│   ├── services/
│   │   ├── auth.domain-service.ts
│   │   ├── password.service.ts
│   │   └── token.service.ts
│   ├── events/
│   │   ├── user-registered.event.ts
│   │   ├── user-logged-in.event.ts
│   │   └── token-refreshed.event.ts
│   ├── repositories/
│   │   ├── user.repository.interface.ts
│   │   ├── tenant.repository.interface.ts
│   │   └── refresh-token.repository.interface.ts
│   └── identity.types.ts
│
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   ├── tenant.repository.ts
│   │   │   └── refresh-token.repository.ts
│   │   ├── mappers/
│   │   │   └── user.mapper.ts
│   │   └── identity.persistence.module.ts
│   ├── auth/
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── identity.auth.module.ts
│   └── events/
│       ├── user-registered.handler.ts
│       └── identity.events.module.ts
│
└── presentation/
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── users.controller.ts
    │   └── tenants.controller.ts
    ├── routes/
    │   ├── auth.routes.ts
    │   └── users.routes.ts
    └── identity.presentation.module.ts
```

---

## 4. Estructura del Módulo Attendance (Detallado)

```
modules/attendance/
├── application/
│   ├── commands/
│   │   ├── register-daily-attendance/
│   │   ├── register-subject-attendance/
│   │   ├── justify-attendance/
│   │   └── mark-alert-seen/
│   ├── queries/
│   │   ├── get-daily-attendance/
│   │   ├── get-subject-attendance/
│   │   ├── get-student-history/
│   │   └── get-attendance-metrics/
│   ├── dtos/
│   │   ├── register-attendance.request.dto.ts
│   │   ├── daily-attendance.response.dto.ts
│   │   └── attendance-metrics.response.dto.ts
│   └── attendance.module.ts
│
├── domain/
│   ├── entities/
│   │   ├── attendance-record.entity.ts
│   │   ├── justification.entity.ts
│   │   └── attendance-alert.entity.ts
│   ├── value-objects/
│   │   ├── attendance-id.value-object.ts
│   │   ├── attendance-status.value-object.ts
│   │   └── justification-reason.value-object.ts
│   ├── aggregates/
│   │   ├── attendance-record.aggregate.ts
│   │   └── student-attendance.aggregate.ts
│   ├── services/
│   │   ├── attendance-calculation.service.ts
│   │   ├── threshold-checker.service.ts
│   │   └── alert-generator.service.ts
│   ├── events/
│   │   ├── attendance-registered.event.ts
│   │   ├── attendance-justified.event.ts
│   │   ├── alert-triggered.event.ts
│   │   └── alert-seen.event.ts
│   ├── repositories/
│   │   ├── attendance-record.repository.interface.ts
│   │   ├── justification.repository.interface.ts
│   │   └── attendance-alert.repository.interface.ts
│   └── attendance.types.ts
│
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   ├── attendance-record.repository.ts
│   │   │   ├── justification.repository.ts
│   │   │   └── attendance-alert.repository.ts
│   │   ├── mappers/
│   │   │   └── attendance-record.mapper.ts
│   │   └── attendance.persistence.module.ts
│   └── events/
│       ├── attendance-registered.handler.ts
│       ├── alert-triggered.handler.ts
│       └── attendance.events.module.ts
│
└── presentation/
    ├── controllers/
    │   ├── attendance.controller.ts
    │   └── alerts.controller.ts
    └── routes/
        ├── attendance.routes.ts
        └── alerts.routes.ts
```

---

## 5. Convenciones de Nombrado

### 5.1 Archivos

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Entidad | `<entity>.entity.ts` | `user.entity.ts` |
| Value Object | `<name>.value-object.ts` | `email.value-object.ts` |
| Aggregate | `<name>.aggregate.ts` | `attendance-record.aggregate.ts` |
| Comando | `<action>.command.ts` | `register-attendance.command.ts` |
| Handler | `<action>.handler.ts` | `register-attendance.handler.ts` |
| Query | `<view>.query.ts` | `get-daily-attendance.query.ts` |
| DTO Request | `<action>.request.dto.ts` | `register-attendance.request.dto.ts` |
| DTO Response | `<view>.response.dto.ts` | `daily-attendance.response.dto.ts` |
| Controller | `<resource>.controller.ts` | `attendance.controller.ts` |
| Repository | `<entity>.repository.ts` | `attendance-record.repository.ts` |
| Event | `<event>.event.ts` | `attendance-registered.event.ts` |

### 5.2 Clases

| Tipo | Sufijo | Ejemplo |
|------|--------|---------|
| Entidad | `Entity` | `UserEntity` |
| Value Object | `VO` | `EmailVO` |
| Aggregate | `Aggregate` | `AttendanceRecordAggregate` |
| Comando | `Command` | `RegisterAttendanceCommand` |
| Handler | `Handler` | `RegisterAttendanceHandler` |
| Query | `Query` | `GetDailyAttendanceQuery` |
| DTO | `Dto` | `RegisterAttendanceDto` |
| Repository | `Repository` | `AttendanceRecordRepository` |
| Event | `Event` | `AttendanceRegisteredEvent` |

---

## 6. Dependencias entre Capas (Reglas)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│         (Controllers, Routes, Guards, Interceptors)          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│              (Commands, Queries, Use Cases, DTOs)            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│    (Entities, Value Objects, Aggregates, Domain Events)    │
│                     (SIN DEPENDENCIAS)                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                      │
│      (Repositories, External Services, Event Handlers)     │
└─────────────────────────────────────────────────────────────┘
```

**Reglas:**
- Presentation → Application
- Application → Domain
- Infrastructure → Domain (implementa interfaces)
- NUNCA: Domain → Application o Domain → Infrastructure
- NUNCA: Presentation → Infrastructure directamente

---

## 7. Multi-Tenancy en la Estructura

### 7.1 Tenant Context (Thread Local)

```
src/common/
└── tenant/
    ├── tenant-context.service.ts    # Maneja tenant_id actual
    ├── tenant-middleware.ts          # Extrae tenant de subdomain/header
    └── tenant.decorator.ts           # @Tenant() decorator
```

### 7.2 Repository Pattern con Tenant Filter

```typescript
// infrastructure/persistence/repositories/attendance-record.repository.ts
@Injectable()
export class AttendanceRecordRepository implements IAttendanceRecordRepository {
  constructor(
    private readonly em: EntityManager,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findByCourseAndDate(courseId: string, date: Date): Promise<AttendanceRecord[]> {
    const tenantId = this.tenantContext.getTenantId();
    
    return this.em.find(AttendanceRecordEntity, {
      tenant_id: tenantId,
      course_id: courseId,
      date,
    });
  }
}
```

---

## 8. Estructura de Testing

```
apps/api/
├── src/
│   └── ... (modules)
└── test/
    ├── unit/                    # Tests unitarios
    │   ├── <module>/
    │   │   ├── <entity>.spec.ts
    │   │   ├── <handler>.spec.ts
    │   │   └── <service>.spec.ts
    │   └── ...
    ├── integration/             # Tests de integración
    │   ├── <module>/
    │   │   └── <feature>.e2e-spec.ts
    │   └── ...
    ├── fixtures/                # Datos de test
    │   └── ...
    └── utils/
        └── test-helpers.ts
```

---

## 9. Resumen Visual de la Estructura

```
apps/api/src/
├── config/                    # Configuración global
├── common/                    # Decoradores, guards, filtros compartidos
├── modules/
│   ├── identity/              # Bounded Context 1
│   │   ├── application/       ✓
│   │   ├── domain/            ✓
│   │   ├── infrastructure/    ✓
│   │   └── presentation/      ✓
│   ├── academic/              # Bounded Context 2
│   ├── attendance/            # Bounded Context 3
│   └── reporting/             # Bounded Context 4
└── shared/                    # Recursos compartidos
    ├── database/
    ├── cache/
    ├── events/
    └── email/
```

---

**Fin del documento**
