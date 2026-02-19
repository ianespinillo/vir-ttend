# Sprint 02 — Gestión de Usuarios y Tenants

> **Objetivo:** Implementar multi-tenancy completo, gestión de schools, roles de usuario y aislamiento de datos por tenant.
> **Duración:** 1 semana · **Estimación:** 35 h · **Dependencias:** Sprint 01

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 6 |
| Application Layer | 7 |
| Infrastructure Layer | 6 |
| Presentation Layer | 6 |
| Frontend (UI + hooks + páginas) | 10 |
| **Total** | **35** |

---

## Concepto clave: Multi-tenancy

Cada tenant es una institución educativa. Cada request autenticado lleva `tenantId` en el JWT. El `TenantMiddleware` extrae ese ID y lo pone disponible en `TenantContextService` para que todos los repositorios filtren por él automáticamente. **Ningún dato cruza el límite de un tenant.**

---

## 1. Domain Layer — `modules/identity/domain` (ampliar)

```
apps/api/src/modules/identity/domain/
├── entities/
│   ├── tenant.entity.ts                    # Aggregate root: institución educativa
│   └── school.entity.ts                    # Escuela dentro de un tenant (puede haber varias)
├── value-objects/
│   ├── tenant-id.value-object.ts           # UUID tipado para no confundir con otros IDs
│   ├── school-id.value-object.ts           # UUID tipado para schoolId
│   └── subdomain.value-object.ts           # Valida formato: solo letras, números y guiones
├── services/
│   ├── tenant.service.ts                   # lógica: validar unicidad de subdomain, activar/desactivar tenant
│   └── authorization.service.ts           # canUserAccess(user, resource): verifica rol y tenant
├── events/
│   ├── tenant-created.event.ts             # Se emite al crear un tenant
│   └── school-created.event.ts             # Se emite al crear una school
└── repositories/
    ├── tenant.repository.interface.ts      # findById, findBySubdomain, save, list
    └── school.repository.interface.ts      # findById, findByTenant, save, list
```

### Esquema de entidades nuevas

| Entidad | Campos |
|---|---|
| `Tenant` | `id`, `name`, `subdomain` (unique), `contactEmail`, `status` (active/inactive), `createdAt` |
| `School` | `id`, `tenantId`, `name`, `address`, `levels` (array: 'primary' \| 'secondary'), `status`, `createdAt` |

### `User` entity — actualizar

```ts
// Agregar campo: schoolId (nullable) → el usuario puede estar asignado a una school específica
// Agregar campo: status: 'active' | 'inactive' | 'pending'
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
│   │   └── update-tenant.handler.ts
│   ├── create-school/
│   │   ├── create-school.command.ts        # { tenantId, name, address, levels[] }
│   │   └── create-school.handler.ts        # valida que tenant exista y esté activo, crea School
│   ├── update-school/
│   │   ├── update-school.command.ts        # { schoolId, name?, address?, levels?, status? }
│   │   └── update-school.handler.ts
│   ├── assign-user-role/
│   │   ├── assign-user-role.command.ts     # { userId, role }
│   │   └── assign-user-role.handler.ts     # solo admin o superadmin puede ejecutar
│   └── assign-user-school/
│       ├── assign-user-school.command.ts   # { userId, schoolId }
│       └── assign-user-school.handler.ts   # verifica que school pertenezca al mismo tenant
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
│   ├── list-users/
│   │   ├── list-users.query.ts             # { tenantId, schoolId?, role?, page, limit }
│   │   └── list-users.handler.ts
│   └── get-user-permissions/
│       ├── get-user-permissions.query.ts   # { userId }
│       └── get-user-permissions.handler.ts # retorna rol, tenantId, schoolId y permisos derivados
├── dtos/
│   ├── create-tenant.request.dto.ts        # name (required), subdomain (required, slug), contactEmail
│   ├── tenant.response.dto.ts              # id, name, subdomain, contactEmail, status, createdAt
│   ├── create-school.request.dto.ts        # name, address, levels[]
│   ├── school.response.dto.ts              # id, tenantId, name, address, levels, status
│   ├── assign-role.request.dto.ts          # role: UserRole
│   └── user.response.dto.ts               # actualizar: agregar schoolId, status
└── identity.module.ts                      # actualizar: registrar nuevos commands y queries
```

---

## 3. Infrastructure Layer — `modules/identity/infrastructure` (ampliar)

```
apps/api/src/modules/identity/infrastructure/
├── persistence/
│   ├── entities/
│   │   ├── tenant.orm-entity.ts            # @Entity() Tenant
│   │   └── school.orm-entity.ts            # @Entity() School
│   ├── repositories/
│   │   ├── tenant.repository.ts            # implementa ITenantRepository
│   │   └── school.repository.ts            # implementa ISchoolRepository
│   ├── mappers/
│   │   ├── tenant.mapper.ts                # TenantOrmEntity ↔ Tenant (dominio)
│   │   └── school.mapper.ts                # SchoolOrmEntity ↔ School (dominio)
│   └── identity.persistence.module.ts     # actualizar: agregar nuevas entities y repos
├── auth/
│   ├── guards/
│   │   ├── roles.guard.ts                  # implementar RolesGuard real usando @Roles() metadata
│   │   └── tenant.guard.ts                 # verifica que tenantId del JWT coincida con el recurso
│   └── identity.auth.module.ts            # actualizar: registrar guards
└── events/
    ├── tenant-created.listener.ts          # @OnEvent('tenant.created') → loguea
    └── identity.events.module.ts          # actualizar
```

### `apps/api/src/common/tenant/` — NUEVO módulo compartido

```
apps/api/src/common/tenant/
├── tenant-context.service.ts               # Almacena tenantId del request actual (AsyncLocalStorage)
│                                           # getTenantId(): string | null
│                                           # setTenantId(id: string): void
├── tenant.middleware.ts                    # Lee tenantId del JWT o del header X-Tenant-ID
│                                           # Llama a TenantContextService.setTenantId()
│                                           # Se aplica globalmente en AppModule
└── tenant.decorator.ts                     # @Tenant() param decorator → extrae tenantId del request
```

> **Por qué AsyncLocalStorage:** permite que los repositorios llamen a `TenantContextService.getTenantId()` sin necesidad de recibir `tenantId` como parámetro. El contexto se propaga automáticamente por toda la cadena de llamadas del request.

### `user.orm-entity.ts` — actualizar

```ts
// Agregar campo: schoolId: string | null
// Agregar campo: status: 'active' | 'inactive' | 'pending'
```

### Migración a generar

```bash
pnpm mikro-orm migration:create --name=create_tenants_schools_update_users
```

Tablas que genera/modifica:
- `tenants` (id, name, subdomain, contact_email, status, created_at)
- `schools` (id, tenant_id, name, address, levels, status, created_at)
- `users` — agrega columnas `school_id` (FK nullable) y `status`

---

## 4. Presentation Layer — `modules/identity/presentation` (ampliar)

```
apps/api/src/modules/identity/presentation/
├── controllers/
│   ├── tenants.controller.ts               # CRUD /tenants — solo superadmin
│   ├── schools.controller.ts               # CRUD /schools — admin del tenant
│   └── users.controller.ts                 # actualizar: agregar PUT /users/:id/role y /users/:id/school
└── identity.presentation.module.ts        # actualizar
```

### Endpoints

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/tenants` | `superadmin` | Listar todos los tenants |
| `POST` | `/tenants` | `superadmin` | Crear tenant |
| `GET` | `/tenants/:id` | `superadmin` | Obtener tenant |
| `PUT` | `/tenants/:id` | `superadmin` | Actualizar tenant |
| `GET` | `/schools` | `admin`, `superadmin` | Listar schools del tenant actual |
| `POST` | `/schools` | `admin` | Crear school en el tenant actual |
| `GET` | `/schools/:id` | `admin`, `preceptor` | Obtener school |
| `PUT` | `/schools/:id` | `admin` | Actualizar school |
| `GET` | `/users` | `admin` | Listar usuarios del tenant |
| `PUT` | `/users/:id/role` | `admin`, `superadmin` | Cambiar rol de un usuario |
| `PUT` | `/users/:id/school` | `admin` | Asignar usuario a una school |

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/settings/
├── school-form.tsx                         # Formulario de creación/edición de school
│                                           # Props: onSubmit, isLoading, defaultValues?, error
├── schools-list.tsx                        # Lista de schools con acciones (editar, desactivar)
│                                           # Props: schools[], onEdit, onToggleStatus
├── users-list.tsx                          # Tabla de usuarios con rol y school asignados
│                                           # Props: users[], onChangeRole, onChangeSchool
├── role-badge.tsx                          # Badge de color por rol (admin=azul, preceptor=verde, etc.)
│                                           # Props: role: UserRole
└── role-select.tsx                         # Select para cambiar el rol de un usuario
                                            # Props: value, onChange, availableRoles
```

### 5.2 `packages/ui` — layout compartido

```
packages/ui/src/components/layout/
├── sidebar.tsx                             # Sidebar de navegación con links según rol
│                                           # Props: user: UserResponseDto, currentPath: string
├── topbar.tsx                              # Barra superior con nombre de usuario y logout
│                                           # Props: user: UserResponseDto, onLogout
└── dashboard-layout.tsx                   # Layout general autenticado: sidebar + topbar + children
                                            # Props: children, user
```

### 5.3 `packages/hooks` — hooks nuevos

> Todos los hooks usan `apiClient` de `../lib/axios-client` y rutas de `@vir-ttend/common`.
> Ningún hook hardcodea strings de URL.

```
packages/hooks/src/
├── lib/
│   └── axios-client.ts                     # ya creado en Sprint 00 — no modificar
├── identity/
│   ├── use-schools.ts                      # useQuery → apiClient.get(ACADEMIC_ROUTES.courses)
│   ├── use-create-school.ts               # useMutation → apiClient.post(ACADEMIC_ROUTES.courses)
│   ├── use-update-school.ts               # useMutation → apiClient.put(ACADEMIC_ROUTES.course(id))
│   ├── use-users.ts                        # useQuery → apiClient.get('/users')
│   ├── use-assign-role.ts                  # useMutation → apiClient.put('/users/:id/role')
│   └── use-assign-school.ts               # useMutation → apiClient.put('/users/:id/school')
└── index.ts                                # actualizar re-exports
```

### 5.4 `apps/client` — páginas

```
apps/client/src/app/
├── (dashboard)/
│   ├── layout.tsx                          # Importa DashboardLayout de @vir-ttend/ui
│   │                                       # Protege la ruta: redirige a /login si no autenticado
│   └── settings/
│       ├── school/
│       │   └── page.tsx                    # Importa SchoolsList y SchoolForm de @vir-ttend/ui
│       │                                   # Usa useSchools, useCreateSchool, useUpdateSchool
│       └── users/
│           ├── page.tsx                    # Importa UsersList de @vir-ttend/ui
│           │                               # Usa useUsers, useAssignRole, useAssignSchool
│           └── [id]/
│               └── page.tsx               # Página de detalle de usuario (futuro)
```

---

## 6. Testing

```
apps/api/test/unit/identity/
├── tenant.service.spec.ts                  # validar subdomain único, activar/desactivar
├── authorization.service.spec.ts          # canUserAccess con distintos roles
├── create-tenant.handler.spec.ts          # mock repo, verificar evento emitido
└── assign-user-role.handler.spec.ts       # verificar que solo admin puede asignar
```

---

## 7. Tareas por día

### Día 1: Domain Layer
- [ ] Crear entidades `Tenant` y `School`
- [ ] Crear Value Objects: `TenantIdVO`, `SchoolIdVO`, `SubdomainVO`
- [ ] Implementar `TenantService` y `AuthorizationService`
- [ ] Definir interfaces de repositorios

### Día 2: Application Layer
- [ ] Crear commands de Tenant (create, update)
- [ ] Crear commands de School (create, update)
- [ ] Crear commands de User (assign-role, assign-school)
- [ ] Crear queries y DTOs

### Día 3: Infrastructure Layer
- [ ] Crear ORM entities para Tenant y School
- [ ] Implementar repositorios
- [ ] Implementar `RolesGuard` y `TenantGuard` reales
- [ ] Crear `TenantContextService` con AsyncLocalStorage
- [ ] Crear `TenantMiddleware`
- [ ] Generar y ejecutar migración

### Día 4: Presentation Layer
- [ ] Crear `TenantsController`, `SchoolsController`
- [ ] Actualizar `UsersController` con nuevos endpoints
- [ ] Aplicar `@Roles()` y guards en todos los endpoints
- [ ] Probar aislamiento con dos tenants distintos

### Día 5–6: Frontend
- [ ] Crear layout compartido (`Sidebar`, `Topbar`, `DashboardLayout`) en `packages/ui`
- [ ] Crear componentes de settings en `packages/ui`
- [ ] Crear hooks en `packages/hooks`
- [ ] Crear páginas en `apps/client`
- [ ] Implementar protección de rutas en `(dashboard)/layout.tsx`

### Día 7: Integración y tests
- [ ] Test de aislamiento: tenant A no puede ver datos de tenant B
- [ ] Test de roles: preceptor no puede acceder a endpoints de admin
- [ ] Tests unitarios de servicios y handlers

---

## 8. Criterios de aceptación

- [ ] CRUD de schools funciona correctamente
- [ ] Asignar rol a usuario funciona y se refleja en el JWT al renovar token
- [ ] Asignar school a usuario funciona
- [ ] Un usuario de tenant A no puede ver ni modificar datos de tenant B
- [ ] `RolesGuard` bloquea acceso a rutas con rol insuficiente (devuelve 403)
- [ ] `TenantMiddleware` popula `TenantContextService` en cada request
- [ ] Sidebar muestra links según el rol del usuario autenticado
- [ ] `(dashboard)/layout.tsx` redirige a `/login` si no hay sesión

---

**Siguiente sprint →** Sprint 03: Gestión Académica
