# Sprint 10 — Admin y Configuración

> **Objetivo:** Implementar la administración: gestión de tenants (superadmin), usuarios y memberships (admin), y perfil personal.
> **Duración:** 1 semana · **Estimación:** 30 h · **Dependencias:** Sprint 02

---

## Decisiones de diseño

**Dos áreas, dos roles:** `/tenants` es exclusivo de `SUPERADMIN` (guard en el segmento, ver Sprint 02). Usuarios/memberships y settings del tenant son de `ADMIN` del tenant activo.

**Tenant selector para superadmin:** dentro de `/tenants` el superadmin puede hacer *impersonación* (switch de tenant en el store ligero, sin re-login) y ver usuarios de cada tenant. Esto usa el mismo `tenant` del `AuthProvider`.

**Alta de usuario:** crear usuario + asignar rol (membership) en un tenant. El backend expone `POST /users` y `POST /tenants/:tenantId/memberships`; el form manda ambos en secuencia (con enmascarado de error 409 por email duplicado).

**Perfil:** `/profile` muestra datos del usuario actual y permite cambio de contraseña (`PATCH /users/me/password`). Común a todos los roles; aparece en el `UserMenu` (Sprint 02).

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — tipos/routes tenants+users | 3 |
| `@repo/hooks` — hooks admin | 7 |
| `@repo/ui` — componentes admin | 12 |
| `apps/client` — páginas | 8 |
| **Total** | **30** |

---

## 1. `@repo/common`

- Tipos (Sprint 00): `TenantResponse`, `UserResponse`, `MembershipResponse`, `CreateUserDto`. Verificar contra Swagger.
- Rutas (Sprint 00): `TENANT_ROUTES` y `USER_ROUTES`. Confirmar: `POST /users`, `GET /tenants/:id/users`, `POST /tenants/:id/memberships`, `PATCH /users/me/password`.
- Schemas Zod: `user.schema.ts` (create/update/password), `membership.schema.ts`.

---

## 2. `@repo/hooks` — hooks

```
packages/hooks/src/features/
├── tenants/
│   ├── use-tenants.ts            # useQuery → GET /tenants
│   ├── use-create-tenant.ts      # useMutation → POST /tenants
│   ├── use-update-tenant.ts      # useMutation → PUT /tenants/:id
│   ├── use-deactivate-tenant.ts  # useMutation → PATCH /tenants/:id/status
│   ├── use-tenant-users.ts       # useQuery → GET /tenants/:tenantId/users
│   ├── use-add-membership.ts     # useMutation → POST /tenants/:tenantId/memberships
│   └── use-remove-membership.ts  # useMutation → DELETE memberships/:membershipId
└── users/
    ├── use-users.ts              # useQuery → GET /users?tenantId=&page=
    ├── use-create-user.ts        # useMutation → POST /users
    ├── use-update-user.ts        # useMutation → PUT /users/:id
    ├── use-change-password.ts    # useMutation → PATCH /users/me/password
    └── use-profile.ts            # useQuery → GET /users/me (alias de useCurrentUser)
```

---

## 3. `@repo/ui` — componentes

```
packages/ui/src/components/features/
├── tenants/
│   ├── tenants-page.tsx          # tabla de tenants + crear
│   ├── tenant-form.tsx           # datos del tenant (nombre, dominio, configuración)
│   ├── tenant-status-badge.tsx   # activo/inactivo
│   ├── tenant-users-table.tsx    # usuarios del tenant + membresías
│   └── add-membership-modal.tsx  # email + rol → useAddMembership
├── users/
│   ├── users-page.tsx            # lista de usuarios del tenant activo
│   ├── users-table.tsx           # nombre, email, rol(es), estado
│   ├── user-form.tsx             # crear/editar (nombre, email, rol)
│   └── user-status-badge.tsx
└── profile/
    ├── profile-page.tsx          # datos + PasswordForm
    └── password-form.tsx         # actual + nueva + confirmar (zod)
```

---

## 4. `apps/client` — páginas

```
apps/client/src/app/(dashboard)/
├── tenants/
│   ├── page.tsx                      # guard SUPERADMIN → TenantsPage
│   └── [id]/page.tsx                 # TenantDetail (users + memberships)
├── settings/
│   ├── users/page.tsx                # guard ADMIN → UsersPage
│   └── tenant/page.tsx               # guard ADMIN → datos del tenant (form)
└── profile/page.tsx                  # ProfilePage (todos los roles)
```

**Integraciones previas:**
- `nav.ts` (Sprint 02): agregar grupo "Administración" solo para `SUPERADMIN`/`ADMIN`.
- `UserMenu` (Sprint 02): link a `/profile`.

---

## 5. Tareas por día

### Día 1: Contrato + hooks tenants
- [ ] Verificar `TENANT_ROUTES`/`USER_ROUTES` y tipos vs Swagger
- [ ] Schemas `user.schema.ts`, `membership.schema.ts`
- [ ] Hooks de tenants

### Día 2: Hooks users
- [ ] Hooks de users (create/update/password/profile)

### Día 3–4: Componentes tenants
- [ ] `tenant-form`, `tenant-status-badge`, `tenants-page`
- [ ] `tenant-users-table`, `add-membership-modal`

### Día 5: Componentes users + profile
- [ ] `users-page`, `users-table`, `user-form`
- [ ] `profile-page`, `password-form`

### Día 6: Páginas + navegación
- [ ] `/tenants`, `/tenants/[id]`, `/settings/users`, `/settings/tenant`, `/profile`
- [ ] Guard SUPERADMIN en `/tenants`; entrada en `nav.ts` y `UserMenu`

### Día 7: Verificación
- [ ] Flujo: superadmin crea tenant → admin crea usuario + rol → usuario hace login
- [ ] Impersonación del superadmin (switch tenant)
- [ ] Cambio de contraseña con validación de actual
- [ ] `biome check` + `tsc --noEmit`

---

## 6. Criterios de aceptación

- [ ] Superadmin lista, crea, edita y desactiva tenants
- [ ] Superadmin ve usuarios de cada tenant y asigna membresías
- [ ] Admin crea/edita usuarios del tenant y cambia roles
- [ ] Cambio de contraseña valida la actual y actualiza la sesión
- [ ] `/tenants` devuelve 403 a roles que no sean `SUPERADMIN`
- [ ] Email duplicado muestra error mapeado (409) en el form

---

**Siguiente sprint →** [Sprint 11: Polish, Tests y Deploy](./sprint-11-polish-tests-deploy.md)
