# Vir-ttend - Documentación Técnica

**Versión:** 1.0 MVP  
**Fecha:** Febrero 2025  
**Autor:** Arquitectura del sistema

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
3. [Bounded Contexts](#bounded-contexts)
4. [Modelo de Datos](#modelo-de-datos)
5. [Flujo de Autenticación](#flujo-de-autenticación)
6. [Casos de Uso Principales](#casos-de-uso-principales)
7. [Stack Tecnológico](#stack-tecnológico)
8. [Deployment](#deployment)
9. [Seguridad](#seguridad)

---

## 1. Resumen Ejecutivo

Vir-ttend es un SaaS multi-tenant de gestión de asistencia escolar para instituciones de nivel primario y secundario. El sistema implementa **Domain-Driven Design (DDD)** con **Arquitectura Hexagonal** en el backend, garantizando escalabilidad y mantenibilidad a largo plazo.

### Características Principales

- Multi-tenancy con aislamiento de datos por tenant
- Registro diferenciado de asistencia: por día (Primaria) / por materia (Secundaria)
- Cálculo automático de porcentajes y alertas por umbral
- Panel de preceptoría en tiempo real
- Módulo de comunicados institucionales
- Reportes exportables a PDF y Excel

---

## 2. Arquitectura de Alto Nivel

### 2.1 Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Next.js App]
        MOBILE[Mobile Web PWA]
    end
    
    subgraph "Shared Packages"
        COMMON[common<br/>DTOs & Interfaces]
        HOOKS[hooks<br/>TanStack Query]
        UI[ui<br/>shadcn Components]
    end
    
    subgraph "API Layer - NestJS"
        GATEWAY[API Gateway<br/>Controllers]
        
        subgraph "Identity Context"
            ID_APP[Application Layer]
            ID_DOM[Domain Layer]
            ID_INF[Infrastructure Layer]
        end
        
        subgraph "Academic Context"
            AC_APP[Application Layer]
            AC_DOM[Domain Layer]
            AC_INF[Infrastructure Layer]
        end
        
        subgraph "Attendance Context"
            AT_APP[Application Layer]
            AT_DOM[Domain Layer]
            AT_INF[Infrastructure Layer]
        end
        
        subgraph "Reporting Context"
            RP_APP[Application Layer]
            RP_DOM[Domain Layer]
            RP_INF[Infrastructure Layer]
        end
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        REDIS[(Redis Cache)]
    end
    
    WEB --> GATEWAY
    MOBILE --> GATEWAY
    
    WEB -.uses.-> COMMON
    WEB -.uses.-> HOOKS
    WEB -.uses.-> UI
    
    GATEWAY --> ID_APP
    GATEWAY --> AC_APP
    GATEWAY --> AT_APP
    GATEWAY --> RP_APP
    
    ID_INF --> DB
    AC_INF --> DB
    AT_INF --> DB
    RP_INF --> DB
    
    ID_INF -.cache.-> REDIS
    AT_INF -.cache.-> REDIS
```

### 2.2 Capas de la Arquitectura Hexagonal

```mermaid
graph LR
    subgraph "Domain Layer"
        AGG[Aggregates]
        VO[Value Objects]
        EVT[Domain Events]
        SVC[Domain Services]
    end
    
    subgraph "Application Layer"
        CMD[Command Handlers]
        QRY[Query Handlers]
        UC[Use Cases]
    end
    
    subgraph "Infrastructure"
        HTTP[HTTP Controllers]
        ORM[MikroORM Repositories]
        BUS[Event Bus]
        CACHE[Cache]
    end
    
    HTTP --> CMD
    HTTP --> QRY
    CMD --> AGG
    QRY --> ORM
    AGG --> ORM
    AGG --> BUS
    ORM --> CACHE
```

---

## 3. Bounded Contexts

El sistema se divide en 4 bounded contexts independientes con límites bien definidos:

```mermaid
graph TD
    subgraph Identity
        I1[Tenant]
        I2[User]
        I3[School]
        I4[Auth]
    end
    
    subgraph Academic
        A1[Course]
        A2[Subject]
        A3[Student]
        A4[Schedule]
    end
    
    subgraph Attendance
        AT1[AttendanceRecord]
        AT2[Justification]
        AT3[Alert]
    end
    
    subgraph Reporting
        R1[MonthlyReport]
        R2[StudentHistory]
        R3[RankingReport]
    end
    
    Identity -->|provides auth| Academic
    Identity -->|provides auth| Attendance
    Academic -->|provides student data| Attendance
    Attendance -->|provides records| Reporting
    Academic -->|provides metadata| Reporting
```

### 3.1 Comunicación entre Contextos

Los bounded contexts se comunican vía **Domain Events** (asíncrono) y **referencias por ID** (síncrono cuando es inevitable).

**Principio:** Un Aggregate Root nunca referencia directamente a otro Aggregate Root. Solo usa su ID (como Value Object).

Ejemplo:
- `AttendanceRecord` NO tiene una referencia a `Student` (aggregate).
- `AttendanceRecord` tiene un `StudentId` (value object).

---

## 4. Modelo de Datos

### 4.1 Entity Relationship Diagram

```mermaid
erDiagram
    tenants ||--o{ schools : contains
    tenants ||--o{ users : has
    
    schools ||--o{ academic_years : has
    schools ||--o{ courses : has
    schools ||--o{ announcements : publishes
    
    academic_years ||--o{ courses : defines
    
    courses ||--o{ subjects : has
    courses ||--o{ students : enrolls
    courses ||--o{ attendance_records : tracks
    
    subjects ||--o{ schedule_slots : defines
    subjects ||--o{ attendance_records : records
    
    students ||--o{ attendance_records : has
    students ||--o{ attendance_alerts : generates
    
    attendance_records ||--o| justifications : may_have
    
    users ||--o{ courses : is_preceptor
    users ||--o{ subjects : teaches
    users ||--o{ announcements : creates
    users ||--o{ refresh_tokens : has
    
    tenants {
        uuid id PK
        string name
        string subdomain UK
        string contact_email
        enum status
        timestamp created_at
    }
    
    users {
        uuid id PK
        uuid tenant_id FK
        uuid school_id FK "nullable"
        string name
        string email UK
        string password_hash
        enum role
        enum status
        timestamp created_at
    }
    
    refresh_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        timestamp expires_at
        timestamp revoked_at "nullable"
    }
    
    schools {
        uuid id PK
        uuid tenant_id FK
        string name
        string address
        text[] levels
        enum status
        timestamp created_at
    }
    
    academic_years {
        uuid id PK
        uuid school_id FK
        int year
        date start_date
        date end_date
        date[] non_working_days
        numeric absence_threshold_percent
        int late_counts_as_absence_after
    }
    
    courses {
        uuid id PK
        uuid school_id FK
        uuid tenant_id FK
        uuid academic_year_id FK
        uuid preceptor_id FK
        enum level
        int year_number
        string division
        enum shift
    }
    
    subjects {
        uuid id PK
        uuid course_id FK
        uuid teacher_id FK
        string name
        string area
        int weekly_hours
    }
    
    schedule_slots {
        uuid id PK
        uuid subject_id FK
        enum day_of_week
        time start_time
        time end_time
    }
    
    students {
        uuid id PK
        uuid course_id FK
        string first_name
        string last_name
        string document_number UK
        date birth_date
        string tutor_name
        string tutor_phone
        string tutor_email "nullable"
        enum status
    }
    
    attendance_records {
        uuid id PK
        uuid tenant_id FK
        uuid student_id FK
        uuid course_id FK
        uuid subject_id FK "nullable"
        date date
        time period_start "nullable"
        enum status
        uuid edited_by FK "nullable"
        timestamp edited_at "nullable"
        timestamp created_at
    }
    
    justifications {
        uuid id PK
        uuid attendance_record_id FK
        enum reason
        text notes "nullable"
        uuid created_by FK
        timestamp created_at
    }
    
    attendance_alerts {
        uuid id PK
        uuid student_id FK
        uuid academic_year_id FK
        enum alert_type
        numeric absence_percent
        uuid seen_by FK "nullable"
        timestamp seen_at "nullable"
        timestamp created_at
    }
    
    announcements {
        uuid id PK
        uuid school_id FK
        uuid author_id FK
        string title
        text body
        enum target_type
        uuid target_id "nullable"
        enum status
        timestamp publish_at
        timestamp created_at
    }
```

### 4.2 Decisiones de Diseño del Modelo

#### tenant_id redundante

Aunque `students` ya tiene `course_id` que apunta a `courses` que tiene `tenant_id`, agregamos `tenant_id` directamente en `attendance_records` para:
- Queries con un solo filtro sin joins
- Row Level Security (RLS) de PostgreSQL más simple
- Índices más eficientes

#### subject_id nullable en attendance_records

Discriminador entre primaria y secundaria:
- `subject_id = NULL` → registro diario de primaria
- `subject_id != NULL` → registro por materia de secundaria

Alternativa descartada: dos tablas separadas (`daily_attendance` y `subject_attendance`) complicaría reportes consolidados.

#### attendance_alerts como tabla

Podría calcularse on-the-fly, pero persistirlo permite:
- Marcar alertas como vistas (UX crítico para preceptores)
- Historial de cuándo se disparó cada alerta
- Base para futuras notificaciones push

---

## 5. Flujo de Autenticación

### 5.1 Diagrama de Secuencia - Login

```mermaid
sequenceDiagram
    actor User
    participant Client as Next.js Client
    participant API as NestJS API
    participant Auth as AuthService
    participant DB as PostgreSQL
    
    User->>Client: Ingresa email/password
    Client->>API: POST /auth/login<br/>{email, password}
    
    API->>Auth: validate credentials
    Auth->>DB: SELECT user WHERE email
    DB-->>Auth: user data
    
    Auth->>Auth: bcrypt.compare(password)
    
    alt Invalid credentials
        Auth-->>API: throw UnauthorizedException
        API-->>Client: 401 Unauthorized
        Client-->>User: "Credenciales inválidas"
    end
    
    Auth->>Auth: generate access token (15min)
    Auth->>Auth: generate refresh token (7d)
    Auth->>DB: INSERT refresh_token
    
    Auth-->>API: {accessToken, refreshToken}
    
    API-->>Client: Set-Cookie: access_token (HttpOnly)<br/>Set-Cookie: refresh_token (HttpOnly)<br/>200 OK {user}
    
    Client-->>User: Redirige al dashboard
```

### 5.2 Diagrama de Secuencia - Request Autenticado

```mermaid
sequenceDiagram
    actor User
    participant Client as Next.js Client
    participant API as NestJS API
    participant Guard as AuthGuard
    participant DB as PostgreSQL
    
    User->>Client: Acción en UI
    Client->>API: GET /students<br/>Cookie: access_token=...
    
    API->>Guard: validate request
    Guard->>Guard: verify JWT signature
    Guard->>Guard: check expiration
    
    alt Token expirado
        Guard->>Client: 401 Unauthorized
        Client->>API: POST /auth/refresh<br/>Cookie: refresh_token=...
        API->>DB: SELECT refresh_token
        alt Refresh token válido
            API->>API: generate new access token
            API-->>Client: Set-Cookie: access_token<br/>200 OK
            Client->>API: Retry original request
        else Refresh token inválido/expirado
            API-->>Client: 401 Unauthorized
            Client-->>User: Redirige a /login
        end
    end
    
    Guard->>Guard: extract user from token
    Guard->>Guard: check RBAC permissions
    
    alt Sin permisos
        Guard-->>API: throw ForbiddenException
        API-->>Client: 403 Forbidden
    end
    
    Guard-->>API: user attached to request
    API->>DB: Execute business logic
    DB-->>API: result
    API-->>Client: 200 OK {data}
    Client-->>User: Actualiza UI
```

### 5.3 Configuración de Cookies

```typescript
// access_token
httpOnly: true
secure: true (solo HTTPS)
sameSite: 'strict'
maxAge: 15 minutes
path: '/'

// refresh_token
httpOnly: true
secure: true
sameSite: 'strict'
maxAge: 7 days
path: '/auth/refresh'
```

---

## 6. Casos de Uso Principales

### 6.1 Registrar Asistencia (Secundaria)

```mermaid
sequenceDiagram
    actor Teacher
    participant UI as Next.js
    participant API as NestJS
    participant Handler as RegisterAttendanceHandler
    participant Repo as AttendanceRepository
    participant DB as PostgreSQL
    participant EventBus
    
    Teacher->>UI: Marca asistencia de alumnos<br/>Materia: Matemática
    UI->>API: POST /attendance/subject<br/>{subjectId, date, records[]}
    
    API->>Handler: execute(command)
    
    Handler->>Handler: Validate academic period<br/>is active
    
    loop Para cada alumno
        Handler->>Handler: Create AttendanceRecord<br/>aggregate
        Note over Handler: AttendanceRecord.create()<br/>→ emite AttendanceRegistered
    end
    
    Handler->>Repo: save(records)
    Repo->>DB: INSERT attendance_records
    
    Repo->>Repo: Pull domain events<br/>from aggregates
    Repo->>EventBus: Publish events
    
    Note over EventBus: AttendanceRegistered events
    
    EventBus->>EventBus: AttendanceListener<br/>actualiza porcentajes
    EventBus->>EventBus: ThresholdChecker<br/>genera alertas
    
    Repo-->>Handler: success
    Handler-->>API: { recordsCreated: N }
    API-->>UI: 201 Created
    UI-->>Teacher: "Asistencia registrada"
```

### 6.2 Ver Panel de Preceptoría

```mermaid
sequenceDiagram
    actor Preceptor
    participant UI as Next.js
    participant API as NestJS
    participant Query as GetDailyAttendanceQuery
    participant Repo as AttendanceRepository
    participant DB as PostgreSQL
    
    Preceptor->>UI: Abre panel del día
    UI->>API: GET /attendance/daily?courseId=X&date=2025-03-15
    
    API->>Query: execute(query)
    
    Query->>Repo: findByCourseAndDate()
    Repo->>DB: SELECT attendance_records<br/>JOIN students<br/>WHERE course_id AND date
    
    DB-->>Repo: records[]
    
    Repo->>Repo: Map ORM entities<br/>→ domain aggregates
    Repo-->>Query: AttendanceRecord[]
    
    Query->>Query: Calculate metrics:<br/>- % present today<br/>- students at risk<br/>- unjustified absences
    
    Query-->>API: DailyAttendanceDto
    API-->>UI: 200 OK {records, metrics}
    UI-->>Preceptor: Renderiza panel
```

---

## 7. Stack Tecnológico

### 7.1 Backend

| Componente | Tecnología | Versión | Justificación |
|---|---|---|---|
| Runtime | Node.js | 20 LTS | Estabilidad a largo plazo |
| Framework | NestJS | 10.x | DI nativo, modular, decorators |
| ORM | MikroORM | 6.x | Type-safe, Unit of Work pattern |
| Base de datos | PostgreSQL | 16 | JSONB, arrays, índices avanzados |
| Validación | class-validator | 0.14 | Decorators, integración NestJS |
| Auth | Passport + JWT | - | Estrategias pluggables |
| Testing | Jest | 29.x | Ecosystem maduro |

### 7.2 Frontend

| Componente | Tecnología | Versión | Justificación |
|---|---|---|---|
| Framework | Next.js | 15.x | App Router, RSC, SSR |
| UI Library | shadcn/ui | - | Componentes accesibles, Tailwind |
| State Management | TanStack Query | 5.x | Server state, caching automático |
| Forms | React Hook Form | 7.x | Performance, validación |
| Validación | Zod | 3.x | Type-safe schemas, DX |

### 7.3 Monorepo

| Componente | Tecnología | Justificación |
|---|---|---|
| Build System | Turborepo | Caching inteligente, pipelines |
| Package Manager | pnpm | Workspaces, deduplicación |
| Linting | Biome | Rápido, todo-en-uno |
| Git Hooks | Husky + Commitlint | Conventional commits |

---

## 8. Deployment

### 8.1 Diagrama de Infraestructura

```mermaid
graph TB
    subgraph "CDN / Edge"
        CF[Cloudflare / Vercel Edge]
    end
    
    subgraph "Application Tier"
        WEB1[Next.js Instance 1]
        WEB2[Next.js Instance 2]
        API1[NestJS Instance 1]
        API2[NestJS Instance 2]
    end
    
    subgraph "Data Tier"
        PG_PRIMARY[(PostgreSQL Primary)]
        PG_REPLICA[(PostgreSQL Replica)]
        REDIS[(Redis Cluster)]
    end
    
    subgraph "Storage"
        S3[S3 / R2<br/>Reportes PDF]
    end
    
    CF --> WEB1
    CF --> WEB2
    
    WEB1 --> API1
    WEB2 --> API2
    
    API1 --> PG_PRIMARY
    API2 --> PG_PRIMARY
    
    API1 -.read.-> PG_REPLICA
    API2 -.read.-> PG_REPLICA
    
    PG_PRIMARY -.replication.-> PG_REPLICA
    
    API1 --> REDIS
    API2 --> REDIS
    
    API1 --> S3
    API2 --> S3
```

### 8.2 Estrategia de Deployment

**Environments:**
- `dev` → Railway / Render (bajo costo, CI/CD automático)
- `staging` → Réplica de producción con datos fake
- `production` → AWS ECS / GCP Cloud Run

**CI/CD Pipeline:**

```mermaid
graph LR
    PUSH[git push] --> TEST[Run tests]
    TEST --> BUILD[Turborepo build]
    BUILD --> DEPLOY_DEV[Deploy dev]
    DEPLOY_DEV --> SMOKE[Smoke tests]
    SMOKE --> |manual trigger| DEPLOY_PROD[Deploy production]
    
    DEPLOY_PROD --> BLUE[Blue environment]
    BLUE --> HEALTH[Health checks]
    HEALTH --> |success| SWITCH[Switch traffic]
    HEALTH --> |failure| ROLLBACK[Rollback]
```

---

## 9. Seguridad

### 9.1 Capas de Seguridad

```mermaid
graph TB
    subgraph "Network Layer"
        HTTPS[HTTPS Only]
        CORS[CORS Policy]
        RATE[Rate Limiting]
    end
    
    subgraph "Application Layer"
        AUTH[Authentication]
        RBAC[Role-Based Access Control]
        INPUT[Input Validation]
    end
    
    subgraph "Data Layer"
        RLS[Row Level Security]
        ENCRYPT[Encryption at Rest]
        BACKUP[Encrypted Backups]
    end
    
    HTTPS --> AUTH
    CORS --> AUTH
    RATE --> AUTH
    
    AUTH --> RBAC
    RBAC --> INPUT
    
    INPUT --> RLS
    RLS --> ENCRYPT
    ENCRYPT --> BACKUP
```

### 9.2 Controles por Capa

#### Network
- TLS 1.3 obligatorio
- CORS configurado por origen
- Rate limiting: 100 req/min por IP

#### Application
- JWT con rotación de refresh tokens
- RBAC con verificación en cada endpoint
- class-validator en todos los DTOs
- Sanitización de inputs (XSS)
- CSRF tokens en formularios críticos

#### Data
- Passwords con bcrypt (cost 12)
- Row Level Security de PostgreSQL por `tenant_id`
- Datos sensibles (passwords) nunca en logs
- Backups encriptados con KMS

---

## Apéndice A: Glosario

| Término | Definición |
|---|---|
| **Aggregate Root** | Entidad principal de un grupo de objetos relacionados. Único punto de entrada para modificar ese grupo. |
| **Bounded Context** | Límite explícito dentro del cual un modelo de dominio es definido y aplicable. |
| **Domain Event** | Algo que ocurrió en el pasado dentro del dominio. Inmutable, con nombre en pasado. |
| **Value Object** | Objeto que se define únicamente por su valor, no por una identidad. Inmutable. |
| **Multi-tenancy** | Arquitectura donde una sola instancia de software sirve a múltiples clientes (tenants) con datos aislados. |
| **DDD** | Domain-Driven Design. Enfoque de modelado donde el dominio es el centro del diseño del software. |

---

## Apéndice B: Referencias

- **Domain-Driven Design** (Eric Evans)
- **Implementing Domain-Driven Design** (Vaughn Vernon)
- **NestJS Documentation** - https://docs.nestjs.com
- **MikroORM Documentation** - https://mikro-orm.io
- **PostgreSQL Multi-tenancy Strategies** - https://www.citusdata.com/blog/

---

**Fin del documento**
