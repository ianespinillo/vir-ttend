# Sprint 10 — Admin y Configuración: Design Spec

> Implementación de administración de tenants (superadmin), usuarios/memberships (admin), y perfil personal (todos los roles). Frontend completo mockeando endpoints que no existen aún en el API.

---

## 1. Context

El backend tiene: `GET/POST /tenants`, `PUT/PATCH /tenants/:id`, `GET /users`, `PUT /users/:id/role`, `DELETE /users/:id/membership`. Faltan: `POST /users`, `POST /tenants/:id/memberships`, `PATCH /users/me/password`. La impersonación del superadmin reutiliza el existente `POST /auth/select-tenant`.

## 2. Tipos (`@repo/common`)

### Nuevos en `types/tenants/`

```ts
// create-tenant-payload.type.ts
type CreateTenantPayload = {
  name: string;
  subdomain: string;
  contactEmail: string;
};

// update-tenant-payload.type.ts
type UpdateTenantPayload = {
  name: string;
  contactEmail: string;
};

// membership-response.type.ts
type Membership = {
  id: string;
  userId: string;
  tenantId: string;
  role: string;
  userName: string;
  isActive: boolean;
};

// add-membership-payload.type.ts
type AddMembershipPayload = {
  email: string;
  role: string;
};
```

### Nuevos en `types/users/`

```ts
// create-user-payload.type.ts
type CreateUserPayload = {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
};

// update-user-payload.type.ts
type UpdateUserPayload = {
  firstName: string;
  lastName: string;
};

// change-password-payload.type.ts
type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// profile-response.type.ts (alias de CurrentUser existente)
type ProfileResponse = CurrentUser;
```

### Modificación existente

`IUserWithMembershipResponse` → agregar campo `mustChangePassword: boolean` (ya lo devuelve el API pero falta en el type).

### Schemas Zod

```ts
// user.schema.ts
createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.string().optional(),
});

updateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden', path: ['confirmPassword'],
});

// membership.schema.ts
addMembershipSchema = z.object({
  email: z.string().email(),
  role: z.string().min(1),
});
```

### Rutas

```ts
TENANT_ROUTES = {
  tenants:      '/tenants',                            // existente
  tenant:  (id) => `/tenants/${id}`,                   // existente
  status:  (id) => `/tenants/${id}/status`,            // existente
  memberships:(id) => `/tenants/${id}/memberships`,    // nuevo (mock)
  membership:(id) => `/tenants/memberships/${id}`,     // nuevo (delete)
}

USER_ROUTES = {
  users:          '/users',                            // existente
  me:             '/users/me',                         // existente
  user:      (id) => `/users/${id}`,                   // nuevo
  changeRole:(id) => `/users/${id}/role`,              // existente
  membership:(id) => `/users/${id}/membership`,        // existente
  changePassword:  '/users/me/password',               // nuevo (mock)
}
```

## 3. Hooks (`@repo/hooks`)

### Tenants

| Hook | Type | Endpoint | Key | Invalidates |
|---|---|---|---|---|
| `useTenants()` | query | GET /tenants | `tenants.list()` | — |
| `useTenant(id)` | query | GET /tenants/:id | `tenants.detail(id)` | — |
| `useCreateTenant()` | mutation | POST /tenants | — | `tenants.list()` |
| `useUpdateTenant()` | mutation | PUT /tenants/:id | — | `tenants.list()`, `tenants.detail(id)` |
| `useToggleTenantStatus()` | mutation | PATCH /tenants/:id/status | — | `tenants.list()` |
| `useTenantUsers(tenantId)` | query | GET /users?tenantId= | `tenants.users(tenantId)` | — |
| `useRemoveMembership()` | mutation | DELETE /tenants/memberships/:id | — | `tenants.users(tenantId)` |

### Users

| Hook | Type | Endpoint | Key | Invalidates |
|---|---|---|---|---|
| `useUsers(filters)` | query | GET /users?role=&page= | `users.list(filters)` | — |
| `useCreateUser()` | mutation | POST /users (mock) | — | `users.list()` |
| `useUpdateUser()` | mutation | PUT /users/:id (mock) | — | `users.list()` |
| `useChangePassword()` | mutation | PATCH /users/me/password (mock) | — | — |
| `useProfile()` | query | GET /users/me | `users.profile` | — |

`useProfile` reexporta `useCurrentUser` con key `users.profile`.

### Impersonación

Superadmin llama a `useSelectTenant` existente → `POST /auth/select-tenant` con el `tenantId` elegido → refetch user → AuthProvider actualiza el tenant.

## 4. UI Components (`@repo/ui`)

### `tenants/`

| File | Props | Description |
|---|---|---|
| `tenants-page.tsx` | — | PageHeader + grid de TenantCards + Dialog para crear |
| `tenant-form.tsx` | `{ mode, initial?, onSubmit, isLoading }` | RHF+zod: nombre, subdominio, email. Create/Edit |
| `tenant-status-badge.tsx` | `{ isActive }` | Badge verde/rojo |
| `tenant-users-table.tsx` | `{ tenantId, users }` | DataTable: nombre, email, rol, estado, acciones |
| `add-membership-modal.tsx` | `{ tenantId, onAdded }` | Dialog: email + rol select |

### `users/`

| File | Props | Description |
|---|---|---|
| `users-page.tsx` | — | PageHeader + filtros + tabla + Dialog crear |
| `users-table.tsx` | `{ users, onEdit, onDeactivate }` | Table: nombre, email, rol, estado, acciones |
| `user-form.tsx` | `{ mode, initial?, onSubmit, isLoading }` | RHF+zod: nombre, email, rol, contraseña |
| `user-status-badge.tsx` | `{ isActive }` | Badge activo/inactivo |

### `profile/`

| File | Props | Description |
|---|---|---|
| `profile-page.tsx` | — | Card datos (read-only) + PasswordForm |
| `password-form.tsx` | `{ onSubmit, isLoading }` | RHF+zod: actual + nueva + confirmar |

### Barrel

Cada directorio tiene `index.ts` con exports nombrados (tipo + valor).

## 5. Pages (`apps/client`)

```
(dashboard)/
├── tenants/
│   ├── page.tsx                    # SUPERADMIN guard → TenantsPage
│   └── [id]/page.tsx              # SUPERADMIN guard → TenantUsersPage
├── settings/
│   ├── users/page.tsx             # ADMIN guard → UsersPage
│   └── profile/page.tsx           # ALL roles → ProfilePage
```

### `/tenants` (SUPERADMIN)
- PageHeader "Instituciones" + "Crear Institución" button
- Grid cards: nombre, subdominio, email, badge estado, link a `[id]`
- Dialog para crear tenant (TenantForm)

### `/tenants/[id]` (SUPERADMIN)
- PageHeader nombre tenant + "Cambiar a este tenant" (impersonación)
- TenantUsersTable + "Agregar Membresía" modal
- Botón editar tenant (Dialog)

### `/settings/users` (ADMIN)
- PageHeader "Usuarios"
- Filtros: role select + búsqueda
- UsersTable + "Crear Usuario" dialog
- Acciones: cambiar rol (select inline), desactivar (confirm dialog)

### `/settings/profile` (ALL)
- PageHeader "Mi Perfil"
- Card 1: datos del usuario (nombre, email, rol, fecha creación) — solo lectura
- Card 2: PasswordForm (actual + nueva + confirmar)

## 6. Navegación

### nav.ts

Agrego grupo "Administración":

```ts
{ label: 'Administración', items: [
  { label: 'Instituciones', href: '/tenants', icon: Building2, roles: [ROLES.SUPERADMIN] },
  { label: 'Usuarios', href: '/settings/users', icon: UserCog, roles: [ROLES.ADMIN] },
]}
```

### UserMenu

Agrego link a `/settings/profile` con icono User.

## 7. Testing Strategy

- **Schemas**: tests de validación Zod (8 tests: create, update, password match, email format)
- **Components**: tests de forms (submit, validation errors), badges, tables
- **Mocks**: hooks mockeados se testean como resolve inmediato (6 hooks × 1 test = 6 tests)
- **Total estimado**: ~25-30 tests nuevos

## 8. Notas de implementación

- Los endpoints mockeados (`POST /users`, `POST /tenants/:id/memberships`, `PATCH /users/me/password`) se implementan con `apiClient.post()` pero fallarán 404 hasta que el backend los exponga. El UI muestra error state gracefully.
- `useProfile` es wrapper de `useCurrentUser` — no fetch adicional.
- La impersonación reutiliza `useSelectTenant` existente → el superadmin ve el tenant seleccionado como si fuera admin de ese tenant.
- `settings/academic` existente es la referencia principal para el patrón Dialog + Form + CRUD.
- Biome: tabs, single quotes, width 80, LF.
- Nunca `git add .` — solo archivos intencionales.
