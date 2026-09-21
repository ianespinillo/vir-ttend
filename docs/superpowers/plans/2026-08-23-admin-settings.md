# Sprint 10 — Admin Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar administración de tenants (superadmin), usuarios/memberships (admin), y perfil personal (todos los roles) en el monorepo vir-ttend.

**Architecture:** Capas descendentes: tipos y schemas en `@repo/common`, hooks en `@repo/hooks`, componentes UI en `@repo/ui`, páginas en `apps/client`. Cada task produce un deliverable independiente y testeable. Se asume que todos los endpoints existen en el API.

**Tech Stack:** TypeScript, React 19, TanStack Query v5, React Hook Form + Zod, shadcn/ui, MikroORM, NestJS, Biome (tabs, single quotes, width 80, LF).

**Spec:** `docs/superpowers/specs/2026-08-23-admin-settings-design.md`

## Global Constraints

- Biome: tabs, single quotes, width 80, LF
- Nunca `git add .` — solo archivos intencionales
- Conventional commits ≤72 chars
- Husky pre-commit: `pnpm run ts:check && pnpm lint:check && pnpm run test`
- Antes de commit: `pnpm exec biome check --write .` para normalizar CRLF
- Rebuild dists después de cambios en shared-pkg types
- Los endpoints se asumen existentes — no se crea lógica de mock

---

## File Structure

### `@repo/common` (new/modified)

| File | Action | Responsibility |
|---|---|---|
| `src/types/tenants/create-tenant-payload.type.ts` | Create | CreateTenantPayload |
| `src/types/tenants/update-tenant-payload.type.ts` | Create | UpdateTenantPayload |
| `src/types/tenants/membership-response.type.ts` | Create | Membership |
| `src/types/tenants/add-membership-payload.type.ts` | Create | AddMembershipPayload |
| `src/types/users/create-user-payload.type.ts` | Create | CreateUserPayload |
| `src/types/users/update-user-payload.type.ts` | Create | UpdateUserPayload |
| `src/types/users/change-password-payload.type.ts` | Create | ChangePasswordPayload |
| `src/types/users/user-with-membership.response.type.ts` | Modify | Add mustChangePassword |
| `src/schemas/user.schema.ts` | Create | createUserSchema, updateUserSchema, changePasswordSchema |
| `src/schemas/membership.schema.ts` | Create | addMembershipSchema |
| `src/routes/tenant.routes.ts` | Modify | Add memberships/membership routes |
| `src/routes/user.routes.ts` | Modify | Add user/changePassword routes |
| `src/routes/index.ts` | No change | Already exports tenant + user routes |
| `src/schemas/index.ts` | Modify | Export new schemas |
| `src/types/index.ts` | Modify | Export new types |

### `@repo/hooks` (new)

| File | Responsibility |
|---|---|
| `src/features/tenants/use-tenants.ts` | useTenants — query GET /tenants |
| `src/features/tenants/use-tenant.ts` | useTenant — query GET /tenants/:id |
| `src/features/tenants/use-create-tenant.ts` | useCreateTenant — mutation POST /tenants |
| `src/features/tenants/use-update-tenant.ts` | useUpdateTenant — mutation PUT /tenants/:id |
| `src/features/tenants/use-toggle-tenant-status.ts` | useToggleTenantStatus — mutation PATCH /tenants/:id/status |
| `src/features/tenants/use-tenant-users.ts` | useTenantUsers — query GET /users?tenantId= |
| `src/features/tenants/use-add-membership.ts` | useAddMembership — mutation POST /tenants/:id/memberships |
| `src/features/tenants/use-remove-membership.ts` | useRemoveMembership — mutation DELETE /tenants/memberships/:id |
| `src/features/users/use-users.ts` | useUsers — query GET /users |
| `src/features/users/use-create-user.ts` | useCreateUser — mutation POST /users |
| `src/features/users/use-update-user.ts` | useUpdateUser — mutation PUT /users/:id |
| `src/features/users/use-change-password.ts` | useChangePassword — mutation PATCH /users/me/password |
| `src/features/users/use-profile.ts` | useProfile — query GET /users/me |

### `@repo/ui` (new)

| File | Responsibility |
|---|---|
| `src/components/features/tenants/tenant-status-badge.tsx` | Badge activo/inactivo |
| `src/components/features/tenants/tenant-form.tsx` | RHF form crear/editar tenant |
| `src/components/features/tenants/tenants-page.tsx` | PageHeader + grid cards + Dialog crear |
| `src/components/features/tenants/add-membership-modal.tsx` | Dialog email+rol |
| `src/components/features/tenants/tenant-users-table.tsx` | DataTable usuarios del tenant |
| `src/components/features/tenants/index.ts` | Barrel |
| `src/components/features/users/user-status-badge.tsx` | Badge activo/inactivo |
| `src/components/features/users/user-form.tsx` | RHF form crear/editar usuario |
| `src/components/features/users/users-table.tsx` | Table usuarios con acciones |
| `src/components/features/users/users-page.tsx` | PageHeader + filtros + tabla + Dialog crear |
| `src/components/features/users/index.ts` | Barrel |
| `src/components/features/profile/password-form.tsx` | RHF form cambio contraseña |
| `src/components/features/profile/profile-page.tsx` | Card datos + PasswordForm |
| `src/components/features/profile/index.ts` | Barrel |

### `apps/client` (new/modified)

| File | Responsibility |
|---|---|
| `src/app/(dashboard)/tenants/page.tsx` | SUPERADMIN guard → TenantsPage |
| `src/app/(dashboard)/tenants/[id]/page.tsx` | SUPERADMIN guard → TenantDetail |
| `src/app/(dashboard)/settings/users/page.tsx` | ADMIN guard → UsersPage |
| `src/app/(dashboard)/settings/profile/page.tsx` | ALL roles → ProfilePage |

---

## Task 1: Common — Tipos de Tenant

**Files:**
- Create: `packages/common/src/types/tenants/create-tenant-payload.type.ts`
- Create: `packages/common/src/types/tenants/update-tenant-payload.type.ts`
- Create: `packages/common/src/types/tenants/membership-response.type.ts`
- Create: `packages/common/src/types/tenants/add-membership-payload.type.ts`
- Modify: `packages/common/src/types/index.ts`

**Interfaces:**
- Produces: `CreateTenantPayload`, `UpdateTenantPayload`, `Membership`, `AddMembershipPayload`

- [ ] **Step 1: Create CreateTenantPayload**

```ts
// packages/common/src/types/tenants/create-tenant-payload.type.ts
export type CreateTenantPayload = {
	name: string;
	subdomain: string;
	contactEmail: string;
};
```

- [ ] **Step 2: Create UpdateTenantPayload**

```ts
// packages/common/src/types/tenants/update-tenant-payload.type.ts
export type UpdateTenantPayload = {
	name: string;
	contactEmail: string;
};
```

- [ ] **Step 3: Create Membership response type**

```ts
// packages/common/src/types/tenants/membership-response.type.ts
export type Membership = {
	id: string;
	userId: string;
	tenantId: string;
	role: string;
	userName: string;
	isActive: boolean;
};
```

- [ ] **Step 4: Create AddMembershipPayload**

```ts
// packages/common/src/types/tenants/add-membership-payload.type.ts
export type AddMembershipPayload = {
	email: string;
	role: string;
};
```

- [ ] **Step 5: Update types barrel**

Add to `packages/common/src/types/index.ts`:
```ts
export * from './tenants/create-tenant-payload.type';
export * from './tenants/update-tenant-payload.type';
export * from './tenants/membership-response.type';
export * from './tenants/add-membership-payload.type';
```

- [ ] **Step 6: Verify types compile**

Run: `pnpm --filter @repo/common ts:check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/common/src/types/tenants/ packages/common/src/types/index.ts
git commit -m "feat(common): add tenant and membership payload/response types"
```

---

## Task 2: Common — Tipos de User

**Files:**
- Create: `packages/common/src/types/users/create-user-payload.type.ts`
- Create: `packages/common/src/types/users/update-user-payload.type.ts`
- Create: `packages/common/src/types/users/change-password-payload.type.ts`
- Modify: `packages/common/src/types/users/user-with-membership.response.type.ts`
- Modify: `packages/common/src/types/index.ts`

**Interfaces:**
- Consumes: `CurrentUser` from `auth/user.response.type.ts`
- Produces: `CreateUserPayload`, `UpdateUserPayload`, `ChangePasswordPayload`, `IUserWithMembershipResponse` (updated)

- [ ] **Step 1: Create CreateUserPayload**

```ts
// packages/common/src/types/users/create-user-payload.type.ts
export type CreateUserPayload = {
	email: string;
	firstName: string;
	lastName: string;
	role?: string;
};
```

- [ ] **Step 2: Create UpdateUserPayload**

```ts
// packages/common/src/types/users/update-user-payload.type.ts
export type UpdateUserPayload = {
	firstName: string;
	lastName: string;
};
```

- [ ] **Step 3: Create ChangePasswordPayload**

```ts
// packages/common/src/types/users/change-password-payload.type.ts
export type ChangePasswordPayload = {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
};
```

- [ ] **Step 4: Add mustChangePassword to IUserWithMembershipResponse**

Read `packages/common/src/types/users/user-with-membership.response.type.ts`, add `mustChangePassword: boolean` to the interface.

- [ ] **Step 5: Update types barrel**

Add to `packages/common/src/types/index.ts`:
```ts
export * from './users/create-user-payload.type';
export * from './users/update-user-payload.type';
export * from './users/change-password-payload.type';
```

- [ ] **Step 6: Verify types compile**

Run: `pnpm --filter @repo/common ts:check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/common/src/types/users/ packages/common/src/types/index.ts
git commit -m "feat(common): add user payload types and update membership response"
```

---

## Task 3: Common — Schemas Zod

**Files:**
- Create: `packages/common/src/schemas/user.schema.ts`
- Create: `packages/common/src/schemas/membership.schema.ts`
- Modify: `packages/common/src/schemas/index.ts`

**Interfaces:**
- Consumes: `CreateUserPayload`, `UpdateUserPayload`, `ChangePasswordPayload`, `AddMembershipPayload`
- Produces: `createUserSchema`, `updateUserSchema`, `changePasswordSchema`, `addMembershipSchema`

- [ ] **Step 1: Create user schemas**

```ts
// packages/common/src/schemas/user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
	email: z.string().email('Email inválido'),
	firstName: z.string().min(1, 'El nombre es obligatorio'),
	lastName: z.string().min(1, 'El apellido es obligatorio'),
	role: z.string().optional(),
});

export const updateUserSchema = z.object({
	firstName: z.string().min(1, 'El nombre es obligatorio'),
	lastName: z.string().min(1, 'El apellido es obligatorio'),
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
		newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
		confirmPassword: z.string().min(8, 'Mínimo 8 caracteres'),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: 'Las contraseñas no coinciden',
		path: ['confirmPassword'],
	});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
```

- [ ] **Step 2: Create membership schema**

```ts
// packages/common/src/schemas/membership.schema.ts
import { z } from 'zod';

export const addMembershipSchema = z.object({
	email: z.string().email('Email inválido'),
	role: z.string().min(1, 'El rol es obligatorio'),
});

export type AddMembershipInput = z.infer<typeof addMembershipSchema>;
```

- [ ] **Step 3: Update schemas barrel**

Add to `packages/common/src/schemas/index.ts`:
```ts
export * from './user.schema';
export * from './membership.schema';
```

- [ ] **Step 4: Verify types compile**

Run: `pnpm --filter @repo/common ts:check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/common/src/schemas/user.schema.ts packages/common/src/schemas/membership.schema.ts packages/common/src/schemas/index.ts
git commit -m "feat(common): add Zod schemas for user and membership operations"
```

---

## Task 4: Common — Actualizar rutas

**Files:**
- Modify: `packages/common/src/routes/tenant.routes.ts`
- Modify: `packages/common/src/routes/user.routes.ts`

**Interfaces:**
- Produces: `TENANT_ROUTES.memberships`, `TENANT_ROUTES.membership`, `USER_ROUTES.user`, `USER_ROUTES.changePassword`

- [ ] **Step 1: Update tenant routes**

Read `packages/common/src/routes/tenant.routes.ts` and add:
```ts
memberships: (id: string) => `/tenants/${id}/memberships`,
membership: (id: string) => `/tenants/memberships/${id}`,
```

- [ ] **Step 2: Update user routes**

Read `packages/common/src/routes/user.routes.ts` and add:
```ts
user: (id: string) => `/users/${id}`,
changePassword: '/users/me/password',
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter @repo/common ts:check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/common/src/routes/tenant.routes.ts packages/common/src/routes/user.routes.ts
git commit -m "feat(common): add membership and user detail route constants"
```

---

## Task 5: Hooks — Tenants (query + mutations)

**Files:**
- Create: `packages/hooks/src/features/tenants/use-tenants.ts`
- Create: `packages/hooks/src/features/tenants/use-tenant.ts`
- Create: `packages/hooks/src/features/tenants/use-create-tenant.ts`
- Create: `packages/hooks/src/features/tenants/use-update-tenant.ts`
- Create: `packages/hooks/src/features/tenants/use-toggle-tenant-status.ts`
- Create: `packages/hooks/src/features/tenants/use-tenant-users.ts`
- Create: `packages/hooks/src/features/tenants/use-add-membership.ts`
- Create: `packages/hooks/src/features/tenants/use-remove-membership.ts`
- Modify: `packages/hooks/src/index.ts`

**Interfaces:**
- Consumes: `TENANT_ROUTES`, `USER_ROUTES`, `Tenant`, `Membership`, `CreateTenantPayload`, `UpdateTenantPayload`, `AddMembershipPayload`, `ApiResponse`, `queryKeys`
- Produces: `useTenants`, `useTenant`, `useCreateTenant`, `useUpdateTenant`, `useToggleTenantStatus`, `useTenantUsers`, `useAddMembership`, `useRemoveMembership`

- [ ] **Step 1: Create useTenants**

```ts
// packages/hooks/src/features/tenants/use-tenants.ts
import { TENANT_ROUTES, type ApiResponse, type Tenant } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useTenants() {
	return useQuery<Tenant[]>({
		queryKey: queryKeys.tenants.all(),
		queryFn: async () => {
			const res =
				await apiClient.get<ApiResponse<Tenant[]>>(
					TENANT_ROUTES.tenants,
				);
			return res.data.data;
		},
	});
}
```

- [ ] **Step 2: Create useTenant**

```ts
// packages/hooks/src/features/tenants/use-tenant.ts
import { TENANT_ROUTES, type ApiResponse, type Tenant } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useTenant(id: string) {
	return useQuery<Tenant>({
		queryKey: queryKeys.tenants.detail(id),
		queryFn: async () => {
			const res =
				await apiClient.get<ApiResponse<Tenant>>(
					TENANT_ROUTES.tenant(id),
				);
			return res.data.data;
		},
		enabled: Boolean(id),
	});
}
```

- [ ] **Step 3: Create useCreateTenant**

```ts
// packages/hooks/src/features/tenants/use-create-tenant.ts
import {
	TENANT_ROUTES,
	type ApiResponse,
	type CreateTenantPayload,
	type Tenant,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateTenant() {
	const qc = useQueryClient();
	return useMutation<Tenant, Error, CreateTenantPayload>({
		mutationFn: async (payload) => {
			const res = await apiClient.post<ApiResponse<Tenant>>(
				TENANT_ROUTES.tenants,
				payload,
			);
			return res.data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.all(),
			});
		},
	});
}
```

- [ ] **Step 4: Create useUpdateTenant**

```ts
// packages/hooks/src/features/tenants/use-update-tenant.ts
import {
	TENANT_ROUTES,
	type ApiResponse,
	type UpdateTenantPayload,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useUpdateTenant() {
	const qc = useQueryClient();
	return useMutation<void, Error, { id: string; data: UpdateTenantPayload }>({
		mutationFn: async ({ id, data }) => {
			await apiClient.put<ApiResponse<void>>(
				TENANT_ROUTES.tenant(id),
				data,
			);
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.all(),
			});
		},
	});
}
```

- [ ] **Step 5: Create useToggleTenantStatus**

```ts
// packages/hooks/src/features/tenants/use-toggle-tenant-status.ts
import { TENANT_ROUTES, type ApiResponse } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useToggleTenantStatus() {
	const qc = useQueryClient();
	return useMutation<
		void,
		Error,
		{ id: string; isActive: boolean }
	>({
		mutationFn: async ({ id, isActive }) => {
			await apiClient.patch<ApiResponse<void>>(
				TENANT_ROUTES.status(id),
				{ isActive },
			);
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.all(),
			});
		},
	});
}
```

- [ ] **Step 6: Create useTenantUsers**

```ts
// packages/hooks/src/features/tenants/use-tenant-users.ts
import {
	USER_ROUTES,
	type ApiResponse,
	type IUserWithMembershipResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useTenantUsers(tenantId: string) {
	return useQuery<IUserWithMembershipResponse[]>({
		queryKey: queryKeys.tenants.users(tenantId),
		queryFn: async () => {
			const res = await apiClient.get<
				ApiResponse<IUserWithMembershipResponse[]>
			>(USER_ROUTES.users, {
				params: { tenantId },
			});
			return res.data.data;
		},
		enabled: Boolean(tenantId),
	});
}
```

- [ ] **Step 7: Create useAddMembership**

```ts
// packages/hooks/src/features/tenants/use-add-membership.ts
import {
	TENANT_ROUTES,
	type AddMembershipPayload,
	type ApiResponse,
	type Membership,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useAddMembership() {
	const qc = useQueryClient();
	return useMutation<
		Membership,
		Error,
		{ tenantId: string; data: AddMembershipPayload }
	>({
		mutationFn: async ({ tenantId, data }) => {
			const res = await apiClient.post<ApiResponse<Membership>>(
				TENANT_ROUTES.memberships(tenantId),
				data,
			);
			return res.data.data;
		},
		onSuccess: (_, { tenantId }) => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.users(tenantId),
			});
		},
	});
}
```

- [ ] **Step 8: Create useRemoveMembership**

```ts
// packages/hooks/src/features/tenants/use-remove-membership.ts
import {
	TENANT_ROUTES,
	type ApiResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useRemoveMembership() {
	const qc = useQueryClient();
	return useMutation<
		void,
		Error,
		{ membershipId: string; tenantId: string }
	>({
		mutationFn: async ({ membershipId }) => {
			await apiClient.delete<ApiResponse<void>>(
				TENANT_ROUTES.membership(membershipId),
			);
		},
		onSuccess: (_, { tenantId }) => {
			qc.invalidateQueries({
				queryKey: queryKeys.tenants.users(tenantId),
			});
		},
	});
}
```

- [ ] **Step 9: Add tenant queryKeys**

Read `packages/hooks/src/lib/keys.ts` and add `users: (tenantId: string) => ['tenants', 'users', tenantId]` to the tenants section.

- [ ] **Step 10: Update hooks barrel**

Add to `packages/hooks/src/index.ts`:
```ts
// Tenant hooks
export { useTenants } from './features/tenants/use-tenants';
export { useTenant } from './features/tenants/use-tenant';
export { useCreateTenant } from './features/tenants/use-create-tenant';
export { useUpdateTenant } from './features/tenants/use-update-tenant';
export { useToggleTenantStatus } from './features/tenants/use-toggle-tenant-status';
export { useTenantUsers } from './features/tenants/use-tenant-users';
export { useAddMembership } from './features/tenants/use-add-membership';
export { useRemoveMembership } from './features/tenants/use-remove-membership';
```

- [ ] **Step 11: Verify types compile**

Run: `pnpm --filter @repo/hooks ts:check`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add packages/hooks/src/features/tenants/ packages/hooks/src/lib/keys.ts packages/hooks/src/index.ts
git commit -m "feat(hooks): add tenant and membership hooks with query keys"
```

---

## Task 6: Hooks — Users (query + mutations)

**Files:**
- Create: `packages/hooks/src/features/users/use-users.ts`
- Create: `packages/hooks/src/features/users/use-create-user.ts`
- Create: `packages/hooks/src/features/users/use-update-user.ts`
- Create: `packages/hooks/src/features/users/use-change-password.ts`
- Create: `packages/hooks/src/features/users/use-profile.ts`
- Modify: `packages/hooks/src/index.ts`

**Interfaces:**
- Consumes: `USER_ROUTES`, `CreateUserPayload`, `UpdateUserPayload`, `ChangePasswordPayload`, `PaginatedResponse`, `CurrentUser`, `ApiResponse`
- Produces: `useUsers`, `useCreateUser`, `useUpdateUser`, `useChangePassword`, `useProfile`

- [ ] **Step 1: Create useUsers**

```ts
// packages/hooks/src/features/users/use-users.ts
import {
	USER_ROUTES,
	type ApiResponse,
	type IUserWithMembershipResponse,
	type PaginatedResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseUsersFilters {
	role?: string;
	page?: number;
	limit?: number;
}

export function useUsers(filters: UseUsersFilters = {}) {
	return useQuery<PaginatedResponse<IUserWithMembershipResponse>>({
		queryKey: queryKeys.users.list(filters),
		queryFn: async () => {
			const res = await apiClient.get<
				ApiResponse<PaginatedResponse<IUserWithMembershipResponse>>
			>(USER_ROUTES.users, { params: filters });
			return res.data.data;
		},
	});
}
```

- [ ] **Step 2: Create useCreateUser**

```ts
// packages/hooks/src/features/users/use-create-user.ts
import {
	USER_ROUTES,
	type ApiResponse,
	type CreateUserPayload,
	type IUserWithMembershipResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateUser() {
	const qc = useQueryClient();
	return useMutation<
		IUserWithMembershipResponse,
		Error,
		CreateUserPayload
	>({
		mutationFn: async (payload) => {
			const res = await apiClient.post<
				ApiResponse<IUserWithMembershipResponse>
			>(USER_ROUTES.users, payload);
			return res.data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.users.list(),
			});
		},
	});
}
```

- [ ] **Step 3: Create useUpdateUser**

```ts
// packages/hooks/src/features/users/use-update-user.ts
import {
	USER_ROUTES,
	type ApiResponse,
	type UpdateUserPayload,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useUpdateUser() {
	const qc = useQueryClient();
	return useMutation<
		void,
		Error,
		{ id: string; data: UpdateUserPayload }
	>({
		mutationFn: async ({ id, data }) => {
			await apiClient.put<ApiResponse<void>>(
				USER_ROUTES.user(id),
				data,
			);
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: queryKeys.users.list(),
			});
		},
	});
}
```

- [ ] **Step 4: Create useChangePassword**

```ts
// packages/hooks/src/features/users/use-change-password.ts
import {
	USER_ROUTES,
	type ApiResponse,
	type ChangePasswordPayload,
} from '@repo/common';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useChangePassword() {
	return useMutation<void, Error, ChangePasswordPayload>({
		mutationFn: async (payload) => {
			await apiClient.patch<ApiResponse<void>>(
				USER_ROUTES.changePassword,
				payload,
			);
		},
	});
}
```

- [ ] **Step 5: Create useProfile**

```ts
// packages/hooks/src/features/users/use-profile.ts
import {
	USER_ROUTES,
	type ApiResponse,
	type CurrentUser,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useProfile() {
	return useQuery<CurrentUser>({
		queryKey: queryKeys.users.profile(),
		queryFn: async () => {
			const res =
				await apiClient.get<ApiResponse<CurrentUser>>(
					USER_ROUTES.me,
				);
			return res.data.data;
		},
	});
}
```

- [ ] **Step 6: Add users queryKeys**

Read `packages/hooks/src/lib/keys.ts` and add:
```ts
users: {
	list: (filters?: Record<string, unknown>) =>
		['users', 'list', filters ?? {}] as const,
	profile: () => ['users', 'profile'] as const,
},
```

- [ ] **Step 7: Update hooks barrel**

Add to `packages/hooks/src/index.ts`:
```ts
// User hooks
export { useUsers, type UseUsersFilters } from './features/users/use-users';
export { useCreateUser } from './features/users/use-create-user';
export { useUpdateUser } from './features/users/use-update-user';
export { useChangePassword } from './features/users/use-change-password';
export { useProfile } from './features/users/use-profile';
```

- [ ] **Step 8: Verify types compile**

Run: `pnpm --filter @repo/hooks ts:check`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add packages/hooks/src/features/users/ packages/hooks/src/lib/keys.ts packages/hooks/src/index.ts
git commit -m "feat(hooks): add user management and profile hooks"
```

---

## Task 7: UI — Tenant Status Badge + Tenant Form

**Files:**
- Create: `packages/ui/src/components/features/tenants/tenant-status-badge.tsx`
- Create: `packages/ui/src/components/features/tenants/tenant-form.tsx`

**Interfaces:**
- Consumes: `Tenant`, `CreateTenantPayload`, `UpdateTenantPayload`, `createTenantSchema` (from Zod form), `Badge`, `Input`, `Button`, `Form*` from shadcn
- Produces: `TenantStatusBadge`, `TenantForm`

- [ ] **Step 1: Create tenant-status-badge**

```tsx
// packages/ui/src/components/features/tenants/tenant-status-badge.tsx
import { Badge } from '../../../ui/badge';

export interface TenantStatusBadgeProps {
	isActive: boolean;
}

export function TenantStatusBadge({
	isActive,
}: Readonly<TenantStatusBadgeProps>) {
	return (
		<Badge variant={isActive ? 'default' : 'destructive'}>
			{isActive ? 'Activo' : 'Inactivo'}
		</Badge>
	);
}
```

- [ ] **Step 2: Create tenant-form**

Read `packages/ui/src/components/features/announcements/announcement-form.tsx` for pattern reference, then create:

```tsx
// packages/ui/src/components/features/tenants/tenant-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type {
	CreateTenantPayload,
	UpdateTenantPayload,
} from '@repo/common';
import { Button } from '../../../ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import { Input } from '../../../ui/input';

export interface TenantFormProps {
	mode: 'create' | 'edit';
	initial?: { name: string; contactEmail: string; subdomain?: string };
	onSubmit: (data: CreateTenantPayload | UpdateTenantPayload) => void;
	isLoading?: boolean;
}

export function TenantForm({
	mode,
	initial,
	onSubmit,
	isLoading,
}: Readonly<TenantFormProps>) {
	const form = useForm<CreateTenantPayload>({
		defaultValues: {
			name: initial?.name ?? '',
			contactEmail: initial?.contactEmail ?? '',
			subdomain: initial?.subdomain ?? '',
		},
	});

	useEffect(() => {
		if (initial) {
			form.reset(initial);
		}
	}, [initial, form]);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="name"
					rules={{ required: 'El nombre es obligatorio' }}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre *</FormLabel>
							<FormControl>
								<Input
									placeholder="Ej. Instituto San Martín"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{mode === 'create' && (
					<FormField
						control={form.control}
						name="subdomain"
						rules={{
							required: 'El subdominio es obligatorio',
						}}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Subdominio *</FormLabel>
								<FormControl>
									<Input
										placeholder="ej. san-martin"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
				<FormField
					control={form.control}
					name="contactEmail"
					rules={{
						required: 'El email de contacto es obligatorio',
					}}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email de contacto *</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder="admin@instituto.edu.ar"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-end">
					<Button type="submit" disabled={isLoading}>
						{isLoading
							? 'Guardando...'
							: mode === 'create'
								? 'Crear Institución'
								: 'Guardar cambios'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter @repo/ui ts:check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/features/tenants/tenant-status-badge.tsx packages/ui/src/components/features/tenants/tenant-form.tsx
git commit -m "feat(ui): add tenant status badge and tenant form components"
```

---

## Task 8: UI — Tenants Page + Add Membership Modal

**Files:**
- Create: `packages/ui/src/components/features/tenants/add-membership-modal.tsx`
- Create: `packages/ui/src/components/features/tenants/tenant-users-table.tsx`
- Create: `packages/ui/src/components/features/tenants/tenants-page.tsx`
- Create: `packages/ui/src/components/features/tenants/index.ts`

**Interfaces:**
- Consumes: `useTenants`, `useCreateTenant`, `useTenantUsers`, `useAddMembership`, `useRemoveMembership`, `useToggleTenantStatus`, `Tenant`, `TenantForm`, `TenantStatusBadge`, `PageHeader`, `ErrorState`, `LoadingSpinner`, `EmptyState`, shadcn Dialog/Table
- Produces: `TenantsPage`, `TenantUsersTable`, `AddMembershipModal`, barrel exports

- [ ] **Step 1: Create add-membership-modal**

```tsx
// packages/ui/src/components/features/tenants/add-membership-modal.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addMembershipSchema } from '@repo/common';
import type { AddMembershipInput } from '@repo/common';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../../../ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import { Input } from '../../../ui/input';

export interface AddMembershipModalProps {
	tenantId: string;
	onSubmit: (data: { tenantId: string; email: string; role: string }) => void;
	isLoading?: boolean;
}

export function AddMembershipModal({
	tenantId,
	onSubmit,
	isLoading,
}: Readonly<AddMembershipModalProps>) {
	const [open, setOpen] = useState(false);
	const form = useForm<AddMembershipInput>({
		resolver: zodResolver(addMembershipSchema),
		defaultValues: { email: '', role: 'admin' },
	});

	const handleSubmit = (data: AddMembershipInput) => {
		onSubmit({ tenantId, ...data });
		setOpen(false);
		form.reset();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">Agregar Membresía</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Agregar Membresía</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="usuario@email.com"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Rol</FormLabel>
									<FormControl>
										<select
											className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
											{...field}
										>
											<option value="admin">Admin</option>
											<option value="preceptor">Preceptor</option>
											<option value="teacher">Teacher</option>
										</select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end">
							<Button type="submit" disabled={isLoading}>
								{isLoading ? 'Agregando...' : 'Agregar'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
```

- [ ] **Step 2: Create tenant-users-table**

```tsx
// packages/ui/src/components/features/tenants/tenant-users-table.tsx
'use client';

import type { IUserWithMembershipResponse } from '@repo/common';
import { Button } from '../../../ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../../ui/table';
import { UserStatusBadge } from '../users/user-status-badge';

export interface TenantUsersTableProps {
	users: IUserWithMembershipResponse[];
	onRemove?: (membershipId: string) => void;
}

export function TenantUsersTable({
	users,
	onRemove,
}: Readonly<TenantUsersTableProps>) {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nombre</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Rol</TableHead>
						<TableHead>Estado</TableHead>
						<TableHead className="text-right">
							Acciones
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => (
						<TableRow key={user.id}>
							<TableCell>
								{user.firstName} {user.lastName}
							</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell className="capitalize">
								{user.role}
							</TableCell>
							<TableCell>
								<UserStatusBadge
									isActive={user.isActive}
								/>
							</TableCell>
							<TableCell className="text-right">
								{onRemove && (
									<Button
										variant="destructive"
										size="sm"
										onClick={() =>
											onRemove(user.id)
										}
									>
										Eliminar
									</Button>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
```

- [ ] **Step 3: Create tenants-page**

This is a client component that uses hooks. Follow the pattern from `settings/academic/page.tsx`:

```tsx
// packages/ui/src/components/features/tenants/tenants-page.tsx
'use client';

import { useState } from 'react';
import { useCreateTenant, useTenants, useToggleTenantStatus } from '@repo/hooks';
import type { Tenant } from '@repo/common';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSpinner } from '../../shared/loading-spinner';
import { PageHeader } from '../../shared/page-header';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import { TenantForm } from './tenant-form';
import { TenantStatusBadge } from './tenant-status-badge';
import { AddMembershipModal } from './add-membership-modal';

export interface TenantsPageProps {
	onTenantClick?: (tenant: Tenant) => void;
}

export function TenantsPage({
	onTenantClick,
}: Readonly<TenantsPageProps>) {
	const { data: tenants, isLoading, error } = useTenants();
	const createTenant = useCreateTenant();
	const toggleStatus = useToggleTenantStatus();
	const [createOpen, setCreateOpen] = useState(false);

	if (isLoading) return <LoadingSpinner />;
	if (error) return <ErrorState message={error.message} />;
	if (!tenants) return null;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Instituciones"
				description="Gestión de instituciones del sistema"
				actions={
					<Button onClick={() => setCreateOpen(true)}>
						Crear Institución
					</Button>
				}
			/>

			{tenants.length === 0 ? (
				<EmptyState
					icon="Building2"
					title="Sin instituciones"
					description="Creá la primera institución para comenzar"
				/>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{tenants.map((tenant) => (
						<div
							key={tenant.id}
							className="rounded-lg border p-4 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
							onClick={() => onTenantClick?.(tenant)}
						>
							<div className="flex items-center justify-between">
								<h3 className="font-medium">
									{tenant.name}
								</h3>
								<TenantStatusBadge
									isActive={tenant.isActive}
								/>
							</div>
							<p className="text-sm text-muted-foreground">
								{tenant.subdomain}
							</p>
							<p className="text-sm text-muted-foreground">
								{tenant.contactEmail}
							</p>
							<div className="flex gap-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									onClick={(e) => {
										e.stopPropagation();
										toggleStatus.mutate({
											id: tenant.id,
											isActive: !tenant.isActive,
										});
									}}
								>
									{tenant.isActive
										? 'Desactivar'
										: 'Activar'}
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Crear Institución
						</DialogTitle>
					</DialogHeader>
					<TenantForm
						mode="create"
						onSubmit={(data) => {
							createTenant.mutate(data as any, {
								onSuccess: () => setCreateOpen(false),
							});
						}}
						isLoading={createTenant.isPending}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
```

- [ ] **Step 4: Create tenants barrel**

```ts
// packages/ui/src/components/features/tenants/index.ts
export type { TenantStatusBadgeProps } from './tenant-status-badge';
export { TenantStatusBadge } from './tenant-status-badge';
export type { TenantFormProps } from './tenant-form';
export { TenantForm } from './tenant-form';
export type { AddMembershipModalProps } from './add-membership-modal';
export { AddMembershipModal } from './add-membership-modal';
export type { TenantUsersTableProps } from './tenant-users-table';
export { TenantUsersTable } from './tenant-users-table';
export type { TenantsPageProps } from './tenants-page';
export { TenantsPage } from './tenants-page';
```

- [ ] **Step 5: Update UI barrel**

Add tenants section to `packages/ui/src/index.tsx` exports:
```ts
// Tenants
export {
	TenantStatusBadge,
	TenantForm,
	AddMembershipModal,
	TenantUsersTable,
	TenantsPage,
} from './components/features/tenants';
```

- [ ] **Step 6: Verify types compile**

Run: `pnpm --filter @repo/ui ts:check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/features/tenants/ packages/ui/src/index.tsx
git commit -m "feat(ui): add tenants page, membership modal, and users table components"
```

---

## Task 9: UI — User Status Badge + User Form + Users Table

**Files:**
- Create: `packages/ui/src/components/features/users/user-status-badge.tsx`
- Create: `packages/ui/src/components/features/users/user-form.tsx`
- Create: `packages/ui/src/components/features/users/users-table.tsx`
- Create: `packages/ui/src/components/features/users/users-page.tsx`
- Create: `packages/ui/src/components/features/users/index.ts`

**Interfaces:**
- Consumes: `useUsers`, `useCreateUser`, `useUpdateUser`, `IUserWithMembershipResponse`, `createUserSchema`, `updateUserSchema`, `PageHeader`, shadcn Table/Form
- Produces: `UserStatusBadge`, `UserForm`, `UsersTable`, `UsersPage`, barrel

- [ ] **Step 1: Create user-status-badge**

```tsx
// packages/ui/src/components/features/users/user-status-badge.tsx
import { Badge } from '../../../ui/badge';

export interface UserStatusBadgeProps {
	isActive: boolean;
}

export function UserStatusBadge({
	isActive,
}: Readonly<UserStatusBadgeProps>) {
	return (
		<Badge variant={isActive ? 'default' : 'destructive'}>
			{isActive ? 'Activo' : 'Inactivo'}
		</Badge>
	);
}
```

- [ ] **Step 2: Create user-form**

```tsx
// packages/ui/src/components/features/users/user-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createUserSchema, updateUserSchema } from '@repo/common';
import type { CreateUserInput, UpdateUserInput } from '@repo/common';
import { Button } from '../../../ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import { Input } from '../../../ui/input';

export interface UserFormProps {
	mode: 'create' | 'edit';
	initial?: {
		firstName: string;
		lastName: string;
		email?: string;
		role?: string;
	};
	onSubmit: (data: CreateUserInput | UpdateUserInput) => void;
	isLoading?: boolean;
}

export function UserForm({
	mode,
	initial,
	onSubmit,
	isLoading,
}: Readonly<UserFormProps>) {
	const isCreate = mode === 'create';
	const schema = isCreate ? createUserSchema : updateUserSchema;

	const form = useForm<CreateUserInput | UpdateUserInput>({
		resolver: zodResolver(schema),
		defaultValues: isCreate
			? {
					email: '',
					firstName: '',
					lastName: '',
					role: 'preceptor',
				}
			: {
					firstName: initial?.firstName ?? '',
					lastName: initial?.lastName ?? '',
				},
	});

	useEffect(() => {
		if (initial) {
			form.reset(
				isCreate
					? {
							email: initial.email ?? '',
							firstName: initial.firstName,
							lastName: initial.lastName,
							role: initial.role ?? 'preceptor',
						}
					: {
							firstName: initial.firstName,
							lastName: initial.lastName,
						},
			);
		}
	}, [initial, form, isCreate]);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="firstName"
					rules={{ required: 'El nombre es obligatorio' }}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre *</FormLabel>
							<FormControl>
								<Input placeholder="Nombre" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="lastName"
					rules={{ required: 'El apellido es obligatorio' }}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Apellido *</FormLabel>
							<FormControl>
								<Input placeholder="Apellido" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{isCreate && (
					<>
						<FormField
							control={form.control}
							name="email"
							rules={{
								required: 'El email es obligatorio',
							}}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email *</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="usuario@email.com"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Rol</FormLabel>
									<FormControl>
										<select
											className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
											{...field}
										>
											<option value="admin">
												Admin
											</option>
											<option value="preceptor">
												Preceptor
											</option>
											<option value="teacher">
												Teacher
											</option>
										</select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}
				<div className="flex justify-end">
					<Button type="submit" disabled={isLoading}>
						{isLoading
							? 'Guardando...'
							: isCreate
								? 'Crear Usuario'
								: 'Guardar cambios'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
```

- [ ] **Step 3: Create users-table**

```tsx
// packages/ui/src/components/features/users/users-table.tsx
'use client';

import type { IUserWithMembershipResponse } from '@repo/common';
import { Button } from '../../../ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../../ui/table';
import { UserStatusBadge } from './user-status-badge';

export interface UsersTableProps {
	users: IUserWithMembershipResponse[];
	onEdit?: (user: IUserWithMembershipResponse) => void;
	onDeactivate?: (userId: string) => void;
	onChangeRole?: (userId: string, newRole: string) => void;
}

export function UsersTable({
	users,
	onEdit,
	onDeactivate,
	onChangeRole,
}: Readonly<UsersTableProps>) {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nombre</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Rol</TableHead>
						<TableHead>Estado</TableHead>
						<TableHead className="text-right">
							Acciones
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => (
						<TableRow key={user.id}>
							<TableCell>
								{user.firstName} {user.lastName}
							</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell>
								<select
									className="h-8 rounded border border-input bg-background px-2 text-sm"
									value={user.role}
									onChange={(e) =>
										onChangeRole?.(
											user.id,
											e.target.value,
										)
									}
								>
									<option value="admin">Admin</option>
									<option value="preceptor">
										Preceptor
									</option>
									<option value="teacher">
										Teacher
									</option>
								</select>
							</TableCell>
							<TableCell>
								<UserStatusBadge
									isActive={user.isActive}
								/>
							</TableCell>
							<TableCell className="flex justify-end gap-2">
								{onEdit && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => onEdit(user)}
									>
										Editar
									</Button>
								)}
								{onDeactivate && user.isActive && (
									<Button
										variant="destructive"
										size="sm"
										onClick={() =>
											onDeactivate(user.id)
										}
									>
										Desactivar
									</Button>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
```

- [ ] **Step 4: Create users-page**

```tsx
// packages/ui/src/components/features/users/users-page.tsx
'use client';

import { useState } from 'react';
import { useCreateUser, useUsers } from '@repo/hooks';
import type { IUserWithMembershipResponse } from '@repo/common';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSpinner } from '../../shared/loading-spinner';
import { PageHeader } from '../../shared/page-header';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import { UsersTable } from './users-table';
import { UserForm } from './user-form';

export function UsersPage() {
	const { data, isLoading, error } = useUsers();
	const createUser = useCreateUser();
	const [createOpen, setCreateOpen] = useState(false);

	if (isLoading) return <LoadingSpinner />;
	if (error) return <ErrorState message={error.message} />;

	const users = data?.items ?? [];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Usuarios"
				description="Gestión de usuarios del tenant"
				actions={
					<Button onClick={() => setCreateOpen(true)}>
						Crear Usuario
					</Button>
				}
			/>

			{users.length === 0 ? (
				<EmptyState
					icon="Users"
					title="Sin usuarios"
					description="Creá el primer usuario para comenzar"
				/>
			) : (
				<UsersTable users={users} />
			)}

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Crear Usuario</DialogTitle>
					</DialogHeader>
					<UserForm
						mode="create"
						onSubmit={(data) => {
							createUser.mutate(data as any, {
								onSuccess: () => setCreateOpen(false),
							});
						}}
						isLoading={createUser.isPending}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
```

- [ ] **Step 5: Create users barrel**

```ts
// packages/ui/src/components/features/users/index.ts
export type { UserStatusBadgeProps } from './user-status-badge';
export { UserStatusBadge } from './user-status-badge';
export type { UserFormProps } from './user-form';
export { UserForm } from './user-form';
export type { UsersTableProps } from './users-table';
export { UsersTable } from './users-table';
export { UsersPage } from './users-page';
```

- [ ] **Step 6: Update UI barrel**

Add users section to `packages/ui/src/index.tsx`:
```ts
// Users
export {
	UserStatusBadge,
	UserForm,
	UsersTable,
	UsersPage,
} from './components/features/users';
```

- [ ] **Step 7: Verify types compile**

Run: `pnpm --filter @repo/ui ts:check`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/features/users/ packages/ui/src/index.tsx
git commit -m "feat(ui): add users page, table, form, and status badge components"
```

---

## Task 10: UI — Profile Page + Password Form

**Files:**
- Create: `packages/ui/src/components/features/profile/password-form.tsx`
- Create: `packages/ui/src/components/features/profile/profile-page.tsx`
- Create: `packages/ui/src/components/features/profile/index.ts`

**Interfaces:**
- Consumes: `useProfile`, `useChangePassword`, `CurrentUser`, `changePasswordSchema`, `Card`, `PageHeader`, shadcn Form
- Produces: `PasswordForm`, `ProfilePage`, barrel

- [ ] **Step 1: Create password-form**

```tsx
// packages/ui/src/components/features/profile/password-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema } from '@repo/common';
import type { ChangePasswordInput } from '@repo/common';
import { useForm } from 'react-hook-form';
import { Button } from '../../../ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import { Input } from '../../../ui/input';

export interface PasswordFormProps {
	onSubmit: (data: ChangePasswordInput) => void;
	isLoading?: boolean;
}

export function PasswordForm({
	onSubmit,
	isLoading,
}: Readonly<PasswordFormProps>) {
	const form = useForm<ChangePasswordInput>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="currentPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Contraseña actual</FormLabel>
							<FormControl>
								<Input
									type="password"
									placeholder="••••••••"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="newPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nueva contraseña</FormLabel>
							<FormControl>
								<Input
									type="password"
									placeholder="••••••••"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="confirmPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Confirmar contraseña</FormLabel>
							<FormControl>
								<Input
									type="password"
									placeholder="••••••••"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-end">
					<Button type="submit" disabled={isLoading}>
						{isLoading
							? 'Actualizando...'
							: 'Cambiar contraseña'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
```

- [ ] **Step 2: Create profile-page**

```tsx
// packages/ui/src/components/features/profile/profile-page.tsx
'use client';

import { useProfile, useChangePassword } from '@repo/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { ErrorState } from '../../shared/error-state';
import { LoadingSpinner } from '../../shared/loading-spinner';
import { PageHeader } from '../../shared/page-header';
import { PasswordForm } from './password-form';

export function ProfilePage() {
	const { data: user, isLoading, error } = useProfile();
	const changePassword = useChangePassword();

	if (isLoading) return <LoadingSpinner />;
	if (error) return <ErrorState message={error.message} />;
	if (!user) return null;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Mi Perfil"
				description="Información de tu cuenta"
			/>

			<div className="mx-auto max-w-2xl space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Datos personales</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">
								Nombre
							</span>
							<span className="text-sm font-medium">
								{user.firstName} {user.lastName}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">
								Email
							</span>
							<span className="text-sm font-medium">
								{user.email}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-muted-foreground">
								Rol
							</span>
							<span className="text-sm font-medium capitalize">
								{user.role}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Cambiar contraseña</CardTitle>
					</CardHeader>
					<CardContent>
						<PasswordForm
							onSubmit={(data) =>
								changePassword.mutate(data)
							}
							isLoading={changePassword.isPending}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Create profile barrel**

```ts
// packages/ui/src/components/features/profile/index.ts
export type { PasswordFormProps } from './password-form';
export { PasswordForm } from './password-form';
export { ProfilePage } from './profile-page';
```

- [ ] **Step 4: Update UI barrel**

Add profile section to `packages/ui/src/index.tsx`:
```ts
// Profile
export { PasswordForm, ProfilePage } from './components/features/profile';
```

- [ ] **Step 5: Verify types compile**

Run: `pnpm --filter @repo/ui ts:check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/features/profile/ packages/ui/src/index.tsx
git commit -m "feat(ui): add profile page and password form components"
```

---

## Task 11: Client Pages + Navigation

**Files:**
- Modify: `apps/client/src/app/(dashboard)/tenants/page.tsx`
- Create: `apps/client/src/app/(dashboard)/tenants/[id]/page.tsx`
- Modify: `apps/client/src/app/(dashboard)/settings/users/page.tsx`
- Modify: `apps/client/src/app/(dashboard)/settings/profile/page.tsx`
- Modify: `packages/common/src/constants/nav.ts`
- Modify: `packages/common/src/constants/nav.test.ts`

**Interfaces:**
- Consumes: `TenantsPage`, `UsersPage`, `ProfilePage`, `useAuth`, `useSelectTenant`, `useTenantUsers`, `useTenant`, `ROLES`, `APP_ROUTES`
- Produces: 4 client pages, updated nav config

- [ ] **Step 1: Update tenants page**

Replace `apps/client/src/app/(dashboard)/tenants/page.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { TenantsPage } from '@repo/ui';
import { APP_ROUTES } from '@repo/common';

export default function TenantsRoute() {
	const router = useRouter();
	return (
		<TenantsPage
			onTenantClick={(tenant) =>
				router.push(`${APP_ROUTES.tenants}/${tenant.id}`)
			}
		/>
	);
}
```

- [ ] **Step 2: Create tenant detail page**

```tsx
// apps/client/src/app/(dashboard)/tenants/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useTenant, useTenantUsers, useRemoveMembership } from '@repo/hooks';
import { useSelectTenant } from '@repo/hooks';
import { PageHeader, LoadingSpinner, ErrorState } from '@repo/ui';
import { TenantUsersTable, AddMembershipModal } from '@repo/ui';
import { Button } from '@repo/ui';
import { useAuth } from '@/lib/auth/provider';

export default function TenantDetailRoute() {
	const params = useParams();
	const id = params.id as string;
	const { data: tenant, isLoading: tenantLoading, error: tenantError } = useTenant(id);
	const { data: users, isLoading: usersLoading } = useTenantUsers(id);
	const selectTenant = useSelectTenant();
	const removeMembership = useRemoveMembership();

	if (tenantLoading || usersLoading) return <LoadingSpinner />;
	if (tenantError) return <ErrorState message={tenantError.message} />;
	if (!tenant) return null;

	return (
		<div className="space-y-6">
			<PageHeader
				title={tenant.name}
				description={tenant.subdomain}
				actions={
					<Button
						onClick={() =>
							selectTenant.mutate({
								tenantId: tenant.id,
							})
						}
						disabled={selectTenant.isPending}
					>
						Cambiar a este tenant
					</Button>
				}
			/>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">
						Usuarios
					</h2>
					<AddMembershipModal
						tenantId={id}
						onSubmit={(data) => {
							// TODO: hook useAddMembership
							console.log('add membership', data);
						}}
					/>
				</div>

				{users && users.length > 0 ? (
					<TenantUsersTable
						users={users}
						onRemove={(membershipId) =>
							removeMembership.mutate({
								membershipId,
								tenantId: id,
							})
						}
					/>
				) : (
					<p className="text-sm text-muted-foreground">
						No hay usuarios en esta institución
					</p>
				)}
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Update settings/users page**

Replace `apps/client/src/app/(dashboard)/settings/users/page.tsx`:
```tsx
'use client';

import { UsersPage } from '@repo/ui';

export default function SettingsUsersRoute() {
	return <UsersPage />;
}
```

- [ ] **Step 4: Update settings/profile page**

Replace `apps/client/src/app/(dashboard)/settings/profile/page.tsx`:
```tsx
'use client';

import { ProfilePage } from '@repo/ui';

export default function SettingsProfileRoute() {
	return <ProfilePage />;
}
```

- [ ] **Step 5: Update nav.ts**

Read `packages/common/src/constants/nav.ts` and add `settings` route to APP_ROUTES if missing. Update the `ALL_NAV_ITEMS` array — the "Usuarios" item already exists with roles `[ROLES.SUPERADMIN, ROLES.ADMIN]`. Verify the profile item exists with roles `[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER]`.

If the `settings` route doesn't exist in `APP_ROUTES`, add it:
```ts
settings: '/settings',
```

- [ ] **Step 6: Run nav tests**

Run: `pnpm --filter @repo/common test -- src/constants/nav.test.ts`
Expected: PASS (existing tests should still pass with the routes)

- [ ] **Step 7: Verify all types compile**

Run: `pnpm run ts:check`
Expected: 5/5 successful

- [ ] **Step 8: Run full test suite**

Run: `pnpm run test`
Expected: All tests pass

- [ ] **Step 9: Run biome check**

Run: `pnpm exec biome check --write .`
Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add apps/client/src/app/\(dashboard\)/tenants/ apps/client/src/app/\(dashboard\)/settings/ packages/common/src/constants/nav.ts packages/common/src/constants/nav.test.ts
git commit -m "feat(client): add admin settings pages and navigation integration"
```

---

## Task 12: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Full typecheck**

Run: `pnpm run ts:check`
Expected: 5/5 successful

- [ ] **Step 2: Full lint**

Run: `pnpm exec biome check --write . && pnpm lint:check`
Expected: No errors

- [ ] **Step 3: Full test suite**

Run: `pnpm run test`
Expected: All tests pass (common + hooks + ui)

- [ ] **Step 4: Rebuild shared dists**

Run: `pnpm --filter @repo/common build && pnpm --filter @repo/hooks build`
Expected: Build succeeds

- [ ] **Step 5: Final commit if needed**

If any files were modified during verification, commit them:
```bash
git add -A && git commit -m "chore: normalize CRLF and rebuild dists"
```
