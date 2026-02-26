# Sprint 02 — Gestión de Tenants y Usuarios

> **Objetivo:** Implementar CRUD de tenants, schools y gestión de usuarios dentro de tenants. El rol del usuario vive en `UserTenantMembership`, no en `User`.
> **Duración:** 1 semana · **Estimación:** 35 h · **Dependencias:** Sprint 01

---

## Concepto clave: Multi-tenancy con memberships

Cada tenant es una institución educativa. Un usuario puede pertenecer a múltiples tenants con distintos roles. El JWT lleva el `tenantId` y `role` del membership elegido en el login. El `TenantMiddleware` extrae ese `tenantId` del JWT y lo pone disponible en `TenantContextService` para que todos los repositorios filtren automáticamente. **Ningún dato cruza el límite de un tenant.**

La entidad `UserTenantMembership` (creada en Sprint 01) es la fuente de verdad del rol. En este sprint se agrega la capacidad de cambiar el rol de un membership existente y de desactivarlo.

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 5 |
| Application Layer | 7 |
| Infrastructure Layer | 7 |
| Presentation Layer | 6 |
| Frontend (UI + hooks + páginas) | 10 |
| **Total** | **35** |

---

## 1. Domain Layer — `modules/identity/domain` (ampliar)

```
apps/api/src/modules/identity/domain/
├── entities/
│   ├── tenant.entity.ts                    # Aggregate root: institución educativa
│   └── school.entity.ts                    # Escuela dentro de un tenant
├── value-objects/
│   └── subdomain.vo.ts                     # Valida formato slug: solo letras, números y guiones
│                                           # normalize(): lowercase + trim
├── services/
│   └── authorization.service.ts           # Lógica de jerarquía de roles
│                                           # canManageRole(actorRole, targetRole): boolean
│                                           # canAccessTenant(membership, tenantId): boolean
└── repositories/
    ├── tenant.repository.interface.ts      # findById, findBySubdomain, save, list
    └── school.repository.interface.ts      # findById, findByTenant, save, list
```

### Esquema de entidades nuevas

| Entidad | Campos |
|---|---|
| `Tenant` | `id`, `name`, `subdomain` (SubdomainVO), `contactEmail`, `status` ('active'\|'inactive'), `createdAt`, `updatedAt` |
| `School` | `id`, `tenantId`, `name`, `address`, `levels` ('primary'\|'secondary')[], `status`, `createdAt` |

### `authorization.service.ts` — comportamiento

```ts
// canManageRole(actorRole: Roles, targetRole: Roles): boolean
// Usa el mismo mapa del CreateUserHandler del Sprint 01:
// superadmin → puede gestionar admin
// admin → puede gestionar preceptor y teacher
// preceptor, teacher → no pueden gestionar a nadie

// canAccessTenant(userTenantId: string, requestTenantId: string): boolean
// → simplemente verifica que sean iguales
// → superadmin (tenantId = null en JWT) siempre puede acceder
```

---

## 2. Application Layer — `modules/identity/application` (ampliar)

```
apps/api/src/modules/identity/application/
├── commands/
│   ├── create-tenant/
│   │   ├── create-tenant.command.ts        # { name, subdomain, contactEmail }
│   │   └── create-tenant.handler.ts        # valida subdomain único, crea Tenant, emite TenantCreated
│   ├── update-tenant/
│   │   ├── update-tenant.command.ts        # { tenantId, name?, contactEmail?, status? }
│   │   └── update-tenant.handler.ts        # solo superadmin puede ejecutar
│   ├── create-school/
│   │   ├── create-school.command.ts        # { tenantId, name, address, levels[] }
│   │   └── create-school.handler.ts        # valida que tenant exista y esté activo, crea School
│   ├── update-school/
│   │   ├── update-school.command.ts        # { schoolId, name?, address?, levels?, status? }
│   │   └── update-school.handler.ts
│   ├── change-membership-role/
│   │   ├── change-membership-role.command.ts  # { userId, tenantId, newRole, changedByRole }
│   │   └── change-membership-role.handler.ts  # verifica jerarquía, llama membership.changeRole()
│   └── deactivate-membership/
│       ├── deactivate-membership.command.ts   # { userId, tenantId, deactivatedByRole }
│       └── deactivate-membership.handler.ts   # verifica jerarquía, llama membership.deactivate()
├── queries/
│   ├── get-tenant/
│   │   ├── get-tenant.query.ts             # { tenantId }
│   │   └── get-tenant.handler.ts
│   ├── list-tenants/
│   │   ├── list-tenants.query.ts           # { page, limit } — solo superadmin
│   │   └── list-tenants.handler.ts
│   ├── get-school/
│   │   ├── get-school.query.ts             # { schoolId }
│   │   └── get-school.handler.ts
│   ├── list-schools/
│   │   ├── list-schools.query.ts           # { tenantId, page, limit }
│   │   └── list-schools.handler.ts
│   ├── list-users-by-tenant/
│   │   ├── list-users-by-tenant.query.ts   # { tenantId, role?, page, limit }
│   │   └── list-users-by-tenant.handler.ts # busca memberships del tenant, luego hidrata con User
│   └── get-user-with-membership/
│       ├── get-user-with-membership.query.ts   # { userId, tenantId }
│       └── get-user-with-membership.handler.ts # retorna User + su membership en ese tenant
├── dtos/
│   ├── create-tenant.request.dto.ts        # name (required), subdomain (required), contactEmail
│   ├── update-tenant.request.dto.ts        # name?, contactEmail?, status?
│   ├── tenant.response.dto.ts              # id, name, subdomain, contactEmail, status, createdAt
│   ├── create-school.request.dto.ts        # name, address, levels[]
│   ├── update-school.request.dto.ts        # name?, address?, levels?, status?
│   ├── school.response.dto.ts              # id, tenantId, name, address, levels, status
│   ├── change-role.request.dto.ts          # newRole: Roles
│   ├── user-with-membership.response.dto.ts # id, email, firstName, lastName, role, isActive, mustChangePassword
│   └── users-list.response.dto.ts         # items: UserWithMembershipResponseDto[], total, page
└── identity.module.ts                      # actualizar: registrar nuevos commands y queries
```

### `ListUsersByTenantHandler` — detalle importante

```ts
// No hay una sola query que traiga User + membership juntos directamente.
// El handler hace dos consultas:
// 1. membershipRepository.findByTenant(tenantId) → lista de memberships
// 2. Por cada membership: userRepository.findById(membership.userId)
// Esto es aceptable en el MVP. Si hay problemas de performance, se agrega una
// query SQL directa en el repositorio de infraestructura (deuda técnica documentada).
```

---

## 3. Infrastructure Layer — `modules/identity/infrastructure` (ampliar)

```
apps/api/src/modules/identity/infrastructure/
├── persistence/
│   ├── entities/
│   │   ├── tenant.orm-entity.ts            # @Entity('tenants')
│   │   └── school.orm-entity.ts            # @Entity('schools')
│   ├── repositories/
│   │   ├── tenant.repository.ts            # implementa ITenantRepository
│   │   └── school.repository.ts            # implementa ISchoolRepository
│   ├── mappers/
│   │   ├── tenant.mapper.ts                # TenantOrmEntity ↔ Tenant (dominio)
│   │   └── school.mapper.ts                # SchoolOrmEntity ↔ School (dominio)
│   └── identity.persistence.module.ts     # actualizar
├── auth/
│   └── guards/
│       ├── roles.guard.ts                  # implementar RolesGuard real
│       │                                   # lee metadata de @Roles() decorator
│       │                                   # compara con request.user.role del JWT
│       └── tenant.guard.ts                 # verifica que tenantId del JWT coincida con el recurso
│                                           # superadmin (tenantId = null) siempre pasa
└── events/
    ├── tenant-created.listener.ts          # @OnEvent('tenant.created') → loguea
    └── identity.events.module.ts          # actualizar
```

### `apps/api/src/common/tenant/` — NUEVO módulo compartido

```
apps/api/src/common/tenant/
├── tenant-context.service.ts               # Almacena tenantId del request actual con AsyncLocalStorage
│                                           # getTenantId(): string | null
│                                           # setTenantId(id: string): void
│                                           # Por qué AsyncLocalStorage: permite que los repositorios
│                                           # obtengan el tenantId sin recibirlo como parámetro,
│                                           # propagado automáticamente por toda la cadena del request
├── tenant.middleware.ts                    # Extrae tenantId del JWT (request.user.tenantId)
│                                           # Llama TenantContextService.setTenantId()
│                                           # Se aplica globalmente en AppModule
│                                           # Si no hay tenantId (superadmin) → setTenantId(null)
└── tenant.module.ts                        # @Global() — exporta TenantContextService
```

### Migración a generar

```bash
pnpm mikro-orm migration:create --name=create_tenants_and_schools
```

Tablas:
- `tenants` (id, name, subdomain, contact_email, status, created_at, updated_at)
- `schools` (id, tenant_id FK, name, address, levels, status, created_at)
- Índice único: `(subdomain)` en `tenants`
- Índice: `(tenant_id)` en `schools`

---

## 4. Presentation Layer — `modules/identity/presentation` (ampliar)

```
apps/api/src/modules/identity/presentation/
├── controllers/
│   ├── tenants.controller.ts               # CRUD /tenants — solo superadmin
│   ├── schools.controller.ts               # CRUD /schools — admin del tenant
│   └── users.controller.ts                 # GET /users, POST /users (create-user del Sprint 01)
│                                           # PUT /users/:id/role, DELETE /users/:id/membership
└── identity.presentation.module.ts        # actualizar
```

### Endpoints

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/tenants` | `superadmin` | Listar todos los tenants |
| `POST` | `/tenants` | `superadmin` | Crear tenant |
| `GET` | `/tenants/:id` | `superadmin` | Obtener tenant |
| `PUT` | `/tenants/:id` | `superadmin` | Actualizar tenant |
| `GET` | `/schools?tenantId=` | `admin`, `superadmin` | Listar schools del tenant |
| `POST` | `/schools` | `admin` | Crear school en el tenant del JWT |
| `GET` | `/schools/:id` | `admin`, `preceptor` | Obtener school |
| `PUT` | `/schools/:id` | `admin` | Actualizar school |
| `GET` | `/users?role=&page=&limit=` | `admin` | Listar usuarios del tenant del JWT |
| `POST` | `/users` | `admin`, `superadmin` | Crear usuario (o vincular existente) |
| `PUT` | `/users/:id/role` | `admin`, `superadmin` | Cambiar rol del membership |
| `DELETE` | `/users/:id/membership` | `admin`, `superadmin` | Desactivar membership del tenant |

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/settings/
├── school-form.tsx                         # Formulario creación/edición de school
│                                           # Props: onSubmit, isLoading, defaultValues?, error
├── schools-list.tsx                        # Lista de schools con acciones (editar, desactivar)
│                                           # Props: schools[], onEdit, onToggleStatus, isLoading
├── users-list.tsx                          # Tabla de usuarios del tenant con rol y estado
│                                           # Props: users: UserWithMembershipResponseDto[],
│                                           #        onChangeRole, onDeactivate, isLoading
├── create-user-form.tsx                    # Formulario: email, firstName, lastName, role
│                                           # Props: onSubmit, isLoading, error
├── role-badge.tsx                          # Badge de color por rol
│                                           # admin=azul | preceptor=verde | teacher=amarillo
│                                           # Props: role: Roles
└── role-select.tsx                         # Select de rol con opciones según el rol del actor
                                            # Props: value, onChange, actorRole: Roles
```

### 5.2 `packages/ui` — layout compartido

```
packages/ui/src/components/layout/
├── sidebar.tsx                             # Navegación lateral con links según role del JWT
│                                           # Props: user: UserResponseDto, currentPath: string
├── topbar.tsx                              # Barra superior: nombre de usuario + tenant activo + logout
│                                           # Props: user: UserResponseDto, onLogout
└── dashboard-layout.tsx                   # Layout autenticado: sidebar + topbar + main content
                                            # Props: children, user: UserResponseDto
```

### 5.3 `packages/hooks` — hooks nuevos

> **Patrón:** todos los hooks importan `apiClient` de `../lib/axios-client` y rutas de `@vir-ttend/common`. Ningún hook hardcodea URLs.

```
packages/hooks/src/
├── identity/
│   ├── use-schools.ts                      # useQuery → apiClient.get(SCHOOL_ROUTES.schools)
│   ├── use-create-school.ts               # useMutation → apiClient.post(SCHOOL_ROUTES.schools)
│   ├── use-update-school.ts               # useMutation → apiClient.put(SCHOOL_ROUTES.school(id))
│   ├── use-users.ts                        # useQuery → apiClient.get(USER_ROUTES.users)
│   ├── use-create-user.ts                  # useMutation → apiClient.post(USER_ROUTES.users)
│   ├── use-change-role.ts                  # useMutation → apiClient.put(USER_ROUTES.userRole(id))
│   └── use-deactivate-membership.ts       # useMutation → apiClient.delete(USER_ROUTES.userMembership(id))
└── index.ts                                # actualizar re-exports
```

### 5.4 `packages/common/routes` — actualizar

```ts
// Agregar en routes/index.ts:
export * from './schools.routes';
export * from './users.routes';

// schools.routes.ts
export const SCHOOL_ROUTES = {
  schools: '/schools',
  school:  (id: string) => `/schools/${id}`,
} as const;

// users.routes.ts (separado de auth.routes.ts)
export const USER_ROUTES = {
  users:          '/users',
  user:           (id: string) => `/users/${id}`,
  userRole:       (id: string) => `/users/${id}/role`,
  userMembership: (id: string) => `/users/${id}/membership`,
} as const;
```

### 5.5 `apps/client` — páginas

```
apps/client/src/app/(dashboard)/
├── layout.tsx                              # Importa DashboardLayout de @vir-ttend/ui
│                                           # Usa useCurrentUser para obtener el user
│                                           # Si no autenticado → redirige a /login
└── settings/
    ├── schools/
    │   └── page.tsx                        # Importa SchoolsList + SchoolForm de @vir-ttend/ui
    │                                       # Usa useSchools, useCreateSchool, useUpdateSchool
    └── users/
        └── page.tsx                        # Importa UsersList + CreateUserForm de @vir-ttend/ui
                                            # Usa useUsers, useCreateUser, useChangeRole, useDeactivateMembership
```

---

## 6. Testing

```
apps/api/test/unit/identity/
├── authorization.service.spec.ts           # canManageRole: todos los casos de jerarquía
├── create-tenant.handler.spec.ts           # subdomain único, evento emitido
├── change-membership-role.handler.spec.ts  # jerarquía correcta e incorrecta
├── list-users-by-tenant.handler.spec.ts    # mock memberships + users, verificar hidratación
└── tenant.middleware.spec.ts               # extrae tenantId del JWT, null para superadmin
```

---

## 7. Tareas por día

### Día 1: Domain Layer
- [ ] Entidades `Tenant` y `School`
- [ ] `SubdomainVO`
- [ ] `AuthorizationService`
- [ ] Interfaces de repositorios

### Día 2: Application Layer — commands
- [ ] `CreateTenantCommand` + handler
- [ ] `UpdateTenantCommand` + handler
- [ ] `CreateSchoolCommand` + handler
- [ ] `UpdateSchoolCommand` + handler
- [ ] `ChangeMembershipRoleCommand` + handler
- [ ] `DeactivateMembershipCommand` + handler

### Día 3: Application Layer — queries + DTOs
- [ ] `GetTenantQuery`, `ListTenantsQuery`
- [ ] `GetSchoolQuery`, `ListSchoolsQuery`
- [ ] `ListUsersByTenantQuery`, `GetUserWithMembershipQuery`
- [ ] Todos los DTOs

### Día 4: Infrastructure Layer
- [ ] ORM entities para Tenant y School
- [ ] Repositorios y mappers
- [ ] `RolesGuard` real
- [ ] `TenantGuard` real
- [ ] `TenantContextService` + `TenantMiddleware`
- [ ] Generar y ejecutar migración

### Día 5: Presentation Layer
- [ ] `TenantsController`, `SchoolsController`, `UsersController`
- [ ] Aplicar `@Roles()` y guards en todos los endpoints
- [ ] Probar aislamiento: tenant A no ve datos de tenant B
- [ ] Registrar `TenantMiddleware` en `AppModule`

### Día 6–7: Frontend
- [ ] Layout compartido (`Sidebar`, `Topbar`, `DashboardLayout`) en `packages/ui`
- [ ] Componentes de settings en `packages/ui`
- [ ] Nuevas rutas en `packages/common`
- [ ] Hooks en `packages/hooks`
- [ ] Páginas en `apps/client`
- [ ] Protección de rutas en `(dashboard)/layout.tsx`

---

## 8. Criterios de aceptación

- [ ] CRUD de schools funciona con aislamiento por tenant
- [ ] Crear usuario nuevo crea `User` + `UserTenantMembership`
- [ ] Crear usuario existente en nuevo tenant solo crea `UserTenantMembership`
- [ ] Cambiar rol actualiza el membership, no el usuario
- [ ] Un admin no puede cambiar el rol de otro admin (jerarquía respetada)
- [ ] Un usuario de tenant A no puede ver datos de tenant B (devuelve 403)
- [ ] `TenantMiddleware` popula `TenantContextService` en cada request autenticado
- [ ] `RolesGuard` devuelve 403 si el rol del JWT no tiene permiso
- [ ] Sidebar muestra links según el rol del JWT activo
- [ ] `(dashboard)/layout.tsx` redirige a `/login` si no hay sesión

---

**Siguiente sprint →** Sprint 03: Gestión Académica
