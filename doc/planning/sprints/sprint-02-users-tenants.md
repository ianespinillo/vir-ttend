# Sprint 02: Gestión de Usuarios y Tenants

**Objetivo:** Completar sistema multi-tenant, roles y gestión de schools  
**Duración:** 1 semana  
**Estimación:** 30 horas  
**Depende de:** Sprint 01 (Auth)

---

## Objetivo

Implementar gestión completa de tenants, schools, roles de usuario y permisos. Establecer el aislamiento multi-tenant.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 4 |
| Application Layer | 6 |
| Infrastructure Layer | 4 |
| Presentation Layer | 6 |
| Frontend | 10 |
| **Total** | **30** |

---

## Backend

### Domain Layer

**Módulo:** `modules/identity`

**Archivos a crear:**

```
modules/identity/
├── domain/
│   ├── entities/
│   │   ├── tenant.entity.ts
│   │   └── school.entity.ts
│   ├── value-objects/
│   │   ├── tenant-id.value-object.ts
│   │   └── school-id.value-object.ts
│   ├── services/
│   │   ├── tenant.service.ts
│   │   └── authorization.service.ts
│   └── repositories/
│       ├── tenant.repository.interface.ts
│       └── school.repository.interface.ts
```

**Detalles de entidades:**

| Entidad | Campos |
|---------|--------|
| Tenant | id, name, subdomain, contact_email, status, created_at |
| School | id, tenant_id, name, address, levels[], status, created_at |

### Application Layer

**Módulo:** `modules/identity/application`

**Archivos a crear:**

```
modules/identity/
├── application/
│   ├── commands/
│   │   ├── create-tenant/
│   │   ├── update-tenant/
│   │   ├── create-school/
│   │   ├── update-school/
│   │   ├── assign-user-role/
│   │   └── assign-user-school/
│   ├── queries/
│   │   ├── get-tenant/
│   │   ├── list-tenants/
│   │   ├── get-school/
│   │   ├── list-schools/
│   │   ├── list-users-by-school/
│   │   └── get-user-permissions/
│   ├── dtos/
│   │   ├── tenant.request.dto.ts
│   │   ├── tenant.response.dto.ts
│   │   ├── school.request.dto.ts
│   │   ├── school.response.dto.ts
│   │   └── role-assignment.dto.ts
│   └── identity.module.ts   # Actualizar
```

### Infrastructure Layer

**Módulo:** `modules/identity/infrastructure`

**Archivos a crear:**

```
modules/identity/
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   ├── tenant.repository.ts
│   │   │   └── school.repository.ts
│   │   └── identity.persistence.module.ts   # Actualizar
│   └── auth/
│       ├── guards/
│       │   ├── roles.guard.ts
│       │   └── tenant.guard.ts
│       └── identity.auth.module.ts   # Actualizar
```

### Presentation Layer

**Módulo:** `modules/identity/presentation`

**Archivos a crear:**

```
modules/identity/
└── presentation/
    ├── controllers/
    │   ├── tenants.controller.ts     # CRUD /tenants
    │   ├── schools.controller.ts    # CRUD /schools
    │   └── users.controller.ts      # PUT /users/:id/role, /users/:id/school
    └── identity.presentation.module.ts   # Actualizar
```

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /tenants | Listar tenants |
| POST | /tenants | Crear tenant |
| GET | /tenants/:id | Obtener tenant |
| PUT | /tenants/:id | Actualizar tenant |
| GET | /schools | Listar schools |
| POST | /schools | Crear school |
| GET | /schools/:id | Obtener school |
| PUT | /schools/:id | Actualizar school |
| PUT | /users/:id/role | Asignar rol |
| PUT | /users/:id/school | Asignar school |

### Common/Shared

**Actualizar:**

```
src/common/
├── decorators/
│   └── roles.decorator.ts        # Actualizar con @Roles
├── guards/
│   ├── roles.guard.ts            # Actualizar
│   └── tenant.guard.ts           # Nuevo
├── filters/
│   └── http-exception.filter.ts  # Agregar manejo de errores específicos
└── middleware/
    └── tenant.middleware.ts      # Extraer tenant del subdomain/header
```

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── (dashboard)/
│   └── settings/
│       ├── school/
│       │   └── page.tsx         # /settings/school
│       └── users/
│           ├── page.tsx         # /settings/users
│           └── [id]/
│               └── page.tsx     # /settings/users/:id
```

### Components

**Archivos a crear:**

```
src/components/
├── features/
│   └── settings/
│       ├── tenants-list.tsx
│       ├── schools-list.tsx
│       ├── users-list.tsx
│       ├── role-assignment.tsx
│       └── school-form.tsx
```

### Hooks

**Archivos a crear/actualizar:**

```
packages/hooks/
├── src/
│   ├── auth/
│   │   └── use-current-user.ts   # Agregar tenant/school info
│   └── identity/
│       ├── use-tenants.ts
│       ├── use-create-tenant.ts
│       ├── use-schools.ts
│       ├── use-create-school.ts
│       ├── use-update-school.ts
│       ├── use-users.ts
│       └── use-assign-role.ts
```

---

## Multi-Tenancy Implementation

### Tenant Context

```
src/common/
└── tenant/
    ├── tenant-context.service.ts   # Thread-local storage
    ├── tenant.decorator.ts         # @Tenant() decorator
    └── tenant-middleware.ts        # Extraer tenant_id
```

### Row Level Security

```typescript
// Ejemplo en repository
async findAll(): Promise<School[]> {
  const tenantId = this.tenantContext.getTenantId();
  return this.em.find(School, { tenant_id: tenantId });
}
```

---

## Testing

**Archivos a crear:**

```
apps/api/
├── test/
│   └── unit/
│       └── identity/
│           ├── tenant.service.spec.ts
│           └── authorization.service.spec.ts
```

---

## Tareas por Día

### Día 1: Domain Layer

- [ ] Crear entidades Tenant, School
- [ ] Crear Value Objects
- [ ] Crear TenantService

### Día 2: Application Layer

- [ ] Crear commands de Tenant/School CRUD
- [ ] Crear queries
- [ ] Crear DTOs

### Día 3: Infrastructure Layer

- [ ] Implementar TenantRepository
- [ ] Implementar SchoolRepository
- [ ] Crear RolesGuard, TenantGuard
- [ ] Crear TenantMiddleware

### Día 4: Presentation Layer

- [ ] Crear TenantsController
- [ ] Crear SchoolsController
- [ ] Actualizar UsersController
- [ ] Probar con Postman

### Día 5-6: Frontend

- [ ] Crear página de settings/school
- [ ] Crear página de settings/users
- [ ] Crear components de gestión
- [ ] Conectar con API

### Día 7: Integración

- [ ] Test de aislamiento multi-tenant
- [ ] Verificar que cada tenant ve solo sus datos
- [ ] Test de roles y permisos

---

## Criterios de Aceptación

- [ ] CRUD de tenants funciona correctamente
- [ ] CRUD de schools funciona correctamente
- [ ] Asignar rol a usuario funciona
- [ ] Asignar school a usuario funciona
- [ ] Aislamiento de datos por tenant funciona
- [ ] Roles limitan acceso a endpoints
- [ ] Frontend muestra gestión de schools y usuarios

---

## Siguiente Sprint

- Sprint 03: Gestión Académica (AcademicYear, Course, Subject)
