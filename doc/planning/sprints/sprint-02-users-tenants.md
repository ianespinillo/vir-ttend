# Sprint 02 — Gestión de Tenants y Usuarios

> **Objetivo:** Implementar CRUD de tenants y gestión de usuarios dentro de tenants. Sin entidad `School` — el tenant representa directamente la institución educativa.
> **Duración:** 1 semana · **Estimación:** 30 h · **Dependencias:** Sprint 01

---

## Concepto clave: Tenant = institución educativa

Cada tenant es una escuela. Las escuelas que comparten edificio son tenants independientes — no hay relación en el sistema. Un usuario que trabaja en ambas tiene dos `UserTenantMembership` con roles potencialmente distintos, lo cual ya está cubierto por el modelo del Sprint 01.

El JWT lleva `tenantId` y `role` del membership elegido. El `TenantMiddleware` extrae el `tenantId` y lo pone disponible en `TenantContextService` para que todos los repositorios filtren automáticamente. **Ningún dato cruza el límite de un tenant.**

---

## Resumen de horas

| Área                 | Horas  |
| -------------------- | ------ |
| Domain Layer         | 4      |
| Application Layer    | 8      |
| Infrastructure Layer | 8      |
| Presentation Layer   | 5      |
| Tests                | 5      |
| **Total**            | **30** |

---

## 1. Domain Layer — `modules/identity/domain` (ampliar)

```
apps/api/src/modules/identity/domain/
├── entities/
│   └── tenant.entity.ts                    # Aggregate root: institución educativa
├── value-objects/
│   └── subdomain.vo.ts                     # Valida formato slug: solo letras, números y guiones
│                                           # normalize(): lowercase + trim
├── services/
│   └── authorization.service.ts           # canManageRole(actorRole, targetRole): boolean
│                                           # canAccessTenant(jwtTenantId, resourceTenantId): boolean
└── repositories/
    └── tenant.repository.interface.ts      # findById, findBySubdomain, save, list
```

### Esquema de entidad

| Entidad  | Campos                                                                                        |
| -------- | --------------------------------------------------------------------------------------------- |
| `Tenant` | `id`, `name`, `subdomain` (SubdomainVO), `contactEmail`, `isActive`, `createdAt`, `updatedAt` |

### `tenant.entity.ts` — comportamiento

```ts
// static create(props: CreateTenantProps): Tenant
// static reconstitute(props): Tenant
// deactivate(): void → isActive = false, actualiza updatedAt
// activate(): void → isActive = true, actualiza updatedAt
// updateContactEmail(email: string): void
// updateName(name: string): void
```

### `authorization.service.ts` — comportamiento

```ts
const canManage: Record<Roles, Roles[]> = {
  [ROLES.SUPERADMIN]: [ROLES.ADMIN],
  [ROLES.ADMIN]:      [ROLES.PRECEPTOR, ROLES.TEACHER],
  [ROLES.PRECEPTOR]:  [],
  [ROLES.TEACHER]:    [],
};

// canManageRole(actorRole, targetRole): boolean
// canAccessTenant(jwtTenantId: string | null, resourceTenantId: string): boolean
//   → superadmin (jwtTenantId = null) siempre puede acceder
//   → resto: jwtTenantId === resourceTenantId
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
│   │   ├── update-tenant.command.ts        # { tenantId, name?, contactEmail? }
│   │   └── update-tenant.handler.ts        # busca tenant, aplica cambios, persiste
│   ├── toggle-tenant-status/
│   │   ├── toggle-tenant-status.command.ts # { tenantId, isActive }
│   │   └── toggle-tenant-status.handler.ts # activa o desactiva el tenant
│   ├── change-membership-role/
│   │   ├── change-membership-role.command.ts  # { userId, tenantId, newRole, actorRole }
│   │   └── change-membership-role.handler.ts  # verifica jerarquía, llama membership.changeRole()
│   └── deactivate-membership/
│       ├── deactivate-membership.command.ts   # { userId, tenantId, actorRole }
│       └── deactivate-membership.handler.ts   # verifica jerarquía, llama membership.deactivate()
├── queries/
│   ├── get-tenant/
│   │   ├── get-tenant.query.ts             # { tenantId }
│   │   └── get-tenant.handler.ts           # retorna TenantResponseDto
│   ├── list-tenants/
│   │   ├── list-tenants.query.ts           # { page, limit } — solo superadmin
│   │   └── list-tenants.handler.ts
│   ├── list-users-by-tenant/
│   │   ├── list-users-by-tenant.query.ts   # { tenantId, role?, page, limit }
│   │   └── list-users-by-tenant.handler.ts # memberships del tenant + hidrata con User
│   └── get-user-with-membership/
│       ├── get-user-with-membership.query.ts   # { userId, tenantId }
│       └── get-user-with-membership.handler.ts
├── dtos/
│   ├── create-tenant.request.dto.ts        # name, subdomain, contactEmail
│   ├── update-tenant.request.dto.ts        # name?, contactEmail?
│   ├── tenant.response.dto.ts              # id, name, subdomain, contactEmail, isActive, createdAt
│   ├── change-role.request.dto.ts          # newRole: Roles
│   ├── user-with-membership.response.dto.ts # id, email, firstName, lastName, role, isActive, mustChangePassword
│   └── users-list.response.dto.ts         # items: UserWithMembershipResponseDto[], total, page
└── identity.module.ts                      # actualizar: registrar nuevos commands, queries y AuthorizationService
```



### `ListUsersByTenantHandler` — detalle

```ts
// 1. membershipRepository.findByTenant(tenantId, { role?, page, limit })
// 2. Por cada membership: userRepository.findById(membership.userId)
// Deuda técnica: si hay problemas de performance, agregar query SQL directa en el repo
```

### `ChangeMembershipRoleHandler` — detalle

```ts
// 1. Verificar jerarquía con authorizationService.canManageRole(actorRole, newRole)
// 2. Buscar membership con membershipRepository.findByUserAndTenant(userId, tenantId)
// 3. Si no existe → throw
// 4. membership.changeRole(newRole)
// 5. membershipRepository.save(membership)
```

---

## 3. Infrastructure Layer — `modules/identity/infrastructure` (ampliar)

```
apps/api/src/modules/identity/infrastructure/
├── persistence/
│   ├── entities/
│   │   └── tenant.orm-entity.ts            # @Entity('tenants')
│   ├── repositories/
│   │   └── tenant.repository.ts            # implementa ITenantRepository con MikroORM
│   ├── mappers/
│   │   └── tenant.mapper.ts                # TenantOrmEntity ↔ Tenant (dominio)
│   └── identity.persistence.module.ts     # actualizar: agregar TenantOrmEntity y TenantRepository
├── auth/
│   └── guards/
│       ├── roles.guard.ts                  # implementar RolesGuard real
│       │                                   # lee metadata de @Roles() decorator
│       │                                   # compara con request.user.role del JWT
│       └── tenant.guard.ts                 # verifica que tenantId del JWT coincida con el recurso
│                                           # superadmin (tenantId = null en JWT) siempre pasa
└── events/
    ├── tenant-created.listener.ts          # @OnEvent('tenant.created') → loguea
    └── identity.events.module.ts          # actualizar
```

### `apps/api/src/common/tenant/` — NUEVO módulo compartido

```
apps/api/src/common/tenant/
├── tenant-context.service.ts               # AsyncLocalStorage — getTenantId(), setTenantId()
├── tenant.middleware.ts                    # Extrae tenantId del JWT → TenantContextService.setTenantId()
│                                           # superadmin → setTenantId(null)
│                                           # Rutas públicas → no hace nada
└── tenant.module.ts                        # @Global() — exporta TenantContextService
```

### `RolesGuard` — implementación

```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Roles[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### `@Roles()` decorator

```ts
export const Roles = (...roles: Roles[]) => SetMetadata('roles', roles);
```

### Migración a generar

```bash
pnpm mikro-orm migration:create --name=create_tenants
```

Tabla:

- `tenants` (id, name, subdomain, contact_email, is_active, created_at, updated_at)
- Índice único: `(subdomain)`

---

## 4. Presentation Layer — `modules/identity/presentation` (ampliar)

```
apps/api/src/modules/identity/presentation/
├── controllers/
│   ├── tenants.controller.ts               # CRUD /tenants — solo superadmin
│   └── users.controller.ts                 # actualizar: agregar PUT /users/:id/role
│                                           #             DELETE /users/:id/membership
└── identity.presentation.module.ts        # actualizar
```

### Endpoints

| Método   | Ruta                        | Roles                 | Descripción                        |
| -------- | --------------------------- | --------------------- | ---------------------------------- |
| `GET`    | `/tenants`                  | `superadmin`          | Listar todos los tenants           |
| `POST`   | `/tenants`                  | `superadmin`          | Crear tenant                       |
| `GET`    | `/tenants/:id`              | `superadmin`          | Obtener tenant                     |
| `PUT`    | `/tenants/:id`              | `superadmin`          | Actualizar tenant                  |
| `PATCH`  | `/tenants/:id/status`       | `superadmin`          | Activar/desactivar tenant          |
| `GET`    | `/users?role=&page=&limit=` | `admin`, `superadmin` | Listar usuarios del tenant del JWT |
| `POST`   | `/users`                    | `admin`, `superadmin` | Crear usuario o vincular existente |
| `PUT`    | `/users/:id/role`           | `admin`, `superadmin` | Cambiar rol del membership         |
| `DELETE` | `/users/:id/membership`     | `admin`, `superadmin` | Desactivar membership              |

### `AppModule` — descomentar en este sprint

```ts
import { TenantModule } from './common/tenant/tenant.module';

@Module({
  imports: [
    // ...
    TenantModule,
    IdentityModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
```

---

## 5. Testing

```
apps/api/test/unit/identity/
├── authorization.service.spec.ts           # canManageRole todos los casos, canAccessTenant
├── create-tenant.handler.spec.ts           # subdomain único, evento emitido, subdomain duplicado
├── change-membership-role.handler.spec.ts  # jerarquía correcta, incorrecta, membership no existe
├── deactivate-membership.handler.spec.ts   # desactiva correctamente, jerarquía incorrecta
└── list-users-by-tenant.handler.spec.ts    # hidrata memberships con users correctamente
```

---

## 6. Tareas por día

### Día 1: Domain Layer

- [ ] `Tenant` entity con factory methods
- [ ] `SubdomainVO`
- [ ] `AuthorizationService`
- [ ] `ITenantRepository` interface

### Día 2: Application Layer — commands

- [ ] `CreateTenantCommand` + handler
- [ ] `UpdateTenantCommand` + handler
- [ ] `ToggleTenantStatusCommand` + handler
- [ ] `ChangeMembershipRoleCommand` + handler
- [ ] `DeactivateMembershipCommand` + handler

### Día 3: Application Layer — queries + DTOs

- [ ] `GetTenantQuery` + handler
- [ ] `ListTenantsQuery` + handler
- [ ] `ListUsersByTenantQuery` + handler
- [ ] `GetUserWithMembershipQuery` + handler
- [ ] Todos los DTOs

### Día 4: Infrastructure Layer

- [ ] `TenantOrmEntity`, `TenantRepository`, `TenantMapper`
- [ ] `RolesGuard` + `@Roles()` decorator
- [ ] `TenantGuard`
- [ ] `TenantContextService` + `TenantMiddleware` + `TenantModule`
- [ ] Generar y ejecutar migración

### Día 5: Presentation Layer + integración

- [ ] `TenantsController`
- [ ] Actualizar `UsersController`
- [ ] Descomentar `TenantModule` y `TenantMiddleware` en `AppModule`
- [ ] Probar aislamiento: tenant A no ve datos de tenant B

### Día 6–7: Tests

- [ ] Tests de handlers y servicios
- [ ] Test de aislamiento con dos tenants distintos
- [ ] Test de roles: preceptor no accede a endpoints de admin

---

## 7. Criterios de aceptación

- [ ] CRUD de tenants funciona correctamente
- [ ] Crear usuario nuevo crea `User` + `UserTenantMembership`
- [ ] Crear usuario existente en nuevo tenant solo crea `UserTenantMembership`
- [ ] Cambiar rol actualiza el membership, no el usuario
- [ ] Un admin no puede cambiar el rol de otro admin
- [ ] Un usuario de tenant A no puede ver datos de tenant B (devuelve 403)
- [ ] `TenantMiddleware` popula `TenantContextService` en cada request autenticado
- [ ] `RolesGuard` devuelve 403 si el rol del JWT no tiene permiso
- [ ] `superadmin` puede acceder a todos los tenants

---

**Siguiente sprint →** Sprint 03: Gestión Académica
