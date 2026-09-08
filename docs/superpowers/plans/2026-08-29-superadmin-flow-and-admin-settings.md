# Sprint 10 — Superadmin flow + Admin Settings (API fixes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar el flujo del superadmin (login → selector → impersonación de tenant → gestión del admin del tenant) y completar/fijar los endpoints de admin-settings en el API. Activar el control de roles real (`RolesGuard`) en todos los controllers.

**Branch:** `chore/admin-settings` (estado actual: working copy con cambios parciales de indentación 2-espacios y un intento roto de token en login).

**Spec:** `docs/superpowers/specs/2026-08-23-admin-settings-design.md`

## Contexto y decisiones de diseño (ya acordadas)

- **"Superadmin"** = usuario con **0 membresías** (`login.handler.ts`). No existe flag `isSuperAdmin` en `User` ni la vamos a agregar.
- El **JWT se acuña SOLO en `select-tenant`**, con `tenantId` REAL y `role` según membership (usuario normal) o `SUPERADMIN` (usuario sin membresías que eligió un tenant válido). **Nunca se acuña token en login** y **nunca hay `tenantId` vacío/nullable** en el token (decisión explícita del usuario: rechazó el nullable).
- Para administrar a los admins de un tenant, el superadmin **impersona** ese tenant: picker → `select-tenant` → token con `role: SUPERADMIN` + `tenantId` del tenant elegido. Desde ahí todos los endpoints de users/memberships funcionan igual que para un ADMIN (además puede `POST /users` con rol ADMIN, cosa que un ADMIN no puede).
- `LoginResult.tenants` debe incluir `tenantName` (hoy el API devuelve `{ tenantId, role }` sin nombre, pero `ITenantOption` y `TenantSelector` requieren `tenantName` → el picker mostraría indefinido). Se enrriquece con `ITenantRepository`.
- **Fix de seguridad confirmado por el usuario:** activar el `RolesGuard` real (Reflector-based) y quitar el bypass `if (!user.tenantId) return true` del `TenantGuard`. Ambos guards reales ya existen en `apps/api/src/modules/identity/infrastructure/auth/guards/`.

## Global Constraints

- Biome: tabs, single quotes, width 80, LF
- Nunca `git add .` — solo archivos intencionales
- Conventional commits ≤72 chars
- Husky pre-commit: `pnpm run ts:check && pnpm lint:check && pnpm run test`
- Antes de commit: `pnpm exec biome check --write .` (normaliza CRLF e indentación 2-espacios rota en files del working copy)
- Rebuild dists si cambia `@repo/common`: `pnpm --filter @repo/common build` (o `pnpm rebuild`)
- Tests unitarios de identity: `pnpm --filter @repo/api test -- --runInBand apps/api/test/unit/identity`
- Archivos del working copy ya tienen indentación mezclada (login.handler, users.controller, tenants.controller, identity.module, user.entity, DTOs nuevos, handlers new): **biome check --write los normaliza**; no mezclar manualmente.

---

## Task 1: LoginHandler — devolver todos los tenants para superadmin (sin token)

**Files:**
- Modify: `apps/api/src/modules/identity/application/commands/login/login.handler.ts`
- Modify: `apps/api/test/unit/identity/login.handler.spec.ts`

**Fixes:**
- **Revertir el intento roto de token en login** (borrar `TokenService` import/constructor y el bloque `generateAccessToken({ user })`). El login NUNCA acuña token (snapshot sucio actual: `const token = await this.tokenService.generateAccessToken({ user, ... })`).
- Inyectar `ITenantRepository` (4to param del constructor).
- Cambiar `LoginResult`:
  ```ts
  export interface LoginResult {
    isSuperAdmin: boolean;
    userId: string;
    tenants: { tenantId: string; tenantName: string; role: Roles }[];
  }
  ```
- Rama superadmin (`memberships.length === 0`): listar todos los tenants y devolver `role: ROLES.SUPERADMIN` en cada uno:
  ```ts
  const all = await this.tenantRepository.list({ page: 1, limit: 10000 });
  return {
    isSuperAdmin: true,
    userId: user.id,
    tenants: all.map((t) => ({ tenantId: t.id, tenantName: t.name, role: ROLES.SUPERADMIN })),
  };
  ```
- Rama normal: enriquecer `tenantName` por membership (`Promise.all` + `tenantRepo.findById(m.tenantId)`).
- **Spec:** agregar `tenantRepo = mock<ITenantRepository>()`; constructor con 4 args; test de superadmin espera los tenants de `tenantRepo.list` con `role: ROLES.SUPERADMIN` y `tenantName`; test normal espera `tenantName`.

- [ ] **Step 1:** Editar `login.handler.ts` según arriba.
- [ ] **Step 2:** Editar `login.handler.spec.ts`.
- [ ] **Step 3:** `pnpm --filter @repo/api test -- --runInBand apps/api/test/unit/identity/login.handler.spec.ts`
- [ ] **Step 4:** `pnpm exec biome check --write apps/api/src/modules/identity/application/commands/login/ apps/api/test/unit/identity/login.handler.spec.ts`
- [ ] **Step 5:** Commit: `git add apps/api/src/modules/identity/application/commands/login/ apps/api/test/unit/identity/login.handler.spec.ts && git commit -m "fix(identity): return all tenants on superadmin login"`

---

## Task 2: SelectTenantHandler — rama superadmin (impersonación)

**Files:**
- Modify: `apps/api/src/modules/identity/application/commands/select-tenant/select-tenant.handler.ts`
- Modify: `apps/api/test/unit/identity/select-tenant.handler.spec.ts`

**Fixes:**
- Inyectar `ITenantRepository` (6to param).
- Reemplazar `if (!membership?.isActive) throw new Error('Invalid tenant selection')` por:
  ```ts
  let role: Roles;
  if (membership?.isActive) {
    role = membership.role;
  } else {
    const memberships = await this.memberRepo.findByUserId(userId);
    if (memberships.length > 0) throw new Error('Invalid tenant selection');
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new Error('Invalid tenant selection');
    role = ROLES.SUPERADMIN;
  }
  ```
- Usar `role` en `generateAccessToken` y en `UserResponseDto`.
- El `tenantId` del token y del refresh token es siempre el elegido en el command (no nullable).

- [ ] **Step 1:** Editar `select-tenant.handler.ts`.
- [ ] **Step 2:** Editar spec: agregar `tenantRepo`; casos nuevos: (a) superadmin sin membresías + tenant existe → token con `role: SUPERADMIN`; (b) usuario con membresías intentando tenant ajeno → sigue `'Invalid tenant selection'` (mockear `findByUserId` con array no vacío, porque jest-mock incident `undefined` y `undefined.length` revienta); (c) superadmin + tenant inexistente → throw.
- [ ] **Step 3:** Correr spec.
- [ ] **Step 4:** `pnpm exec biome check --write ...`
- [ ] **Step 5:** Commit: `git commit -m "feat(identity): allow superadmin tenant impersonation"`

---

## Task 3: GetCurrentUserHandler — soportar superadmin impersonando

**Files:**
- Modify: `apps/api/src/modules/identity/application/queries/get-current-user/get-current-user.handler.ts`
- Modify: `apps/api/test/unit/identity/get-current-user.handler.spec.ts`

**Fixes:**
- Reemplazar el throw por rama:
  ```ts
  let role: Roles;
  if (membership?.isActive) {
    role = membership.role;
  } else {
    const memberships = await this.membersRepo.findByUserId(userId);
    if (memberships.length > 0)
      throw new Error("User doesn't belongs to this tenant");
    role = ROLES.SUPERADMIN;
  }
  ```
- `dto.role = role;` (mantener `dto.tenantId = tenantId` del token).

- [ ] **Step 1:** Editar handler y spec (agregar caso superadmin: `findByUserAndTenant → null`, `findByUserId → []` → `result.role === ROLES.SUPERADMIN`).
- [ ] **Step 2:** Correr spec.
- [ ] **Step 3:** Commit: `git commit -m "fix(identity): return superadmin profile when impersonating"`

---

## Task 4: Login page — superadmin → selector de tenant

**Files:**
- Modify: `apps/client/src/app/(auth)/login/page.tsx`

**Razón:** hoy la rama superadmin hace `refetchUser()` (401 porque no hay access_token) + `replace(redirectUrl)` → pantalla rota. Con Task 1 el login devuelve todos los tenants; el front debe poblar `authPendingStore` y navegar al selector (ruta pública en `middleware.ts`, sin cookie → no redirige).

**Fixes:**
```ts
if (data.isSuperAdmin) {
  authPendingStore.set({
    userId: data.userId,
    tenants: data.tenants,
    isSuperAdmin: data.isSuperAdmin,
  });
  router.push('/select-tenant');
  return;
}
```
(Reemplaza el bloque actual `refetchUser(); replace(redirectUrl)` de la línea 24-28.)

- [ ] **Step 1:** Editar `login/page.tsx`.
- [ ] **Step 2:** Verificar a mano el flujo (o `pnpm --filter @repo/client build`).
- [ ] **Step 3:** Commit: `git commit -m "fix(client): route superadmin login to tenant selector"`

---

## Task 5: Security — activar RolesGuard real y azar TenantGuard

**Razón:** `apps/api/src/common/guard/roles.guard.ts` es un no-op (`return true`); todos los controllers lo importan. El guard real (Reflector + metadata 'roles') ya existe en `infrastructure/auth/guards/roles.guard.ts` pero nadie lo usa.

**Files:**
- Modify: `apps/api/src/common/guard/roles.guard.ts` (sobrescribir implementación con el real)
- Delete: `apps/api/src/modules/identity/infrastructure/auth/guards/roles.guard.ts` (código muerto)
- Modify: `apps/api/src/modules/identity/infrastructure/auth/guards/tenant.guard.ts`

**Fixes:**
- `common/guard/roles.guard.ts` → contenido real:
  ```ts
  import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { Roles } from '@repo/common';

  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<Roles[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
      if (!requiredRoles || requiredRoles.length === 0) return true;
      const { user } = context.switchToHttp().getRequest();
      return requiredRoles.includes(user.role);
    }
  }
  ```
- Como TODOS los controllers ya importan `roles.guard` desde ese path, con esta sobrescritura quedan activados automáticamente (identity, academic, attendance, reporting...). No hace falta tocar imports ni registros en módulos (`Reflector` es global).
- `tenant.guard.ts`: quitar el bypass `if (!user.tenantId) return true;` y permitir solo superadmin global:
  ```ts
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    if (user.role === ROLES.SUPERADMIN) return true; // superadmin es global
    const tenantId = request.params.tenantId ?? request.params.id;
    if (!tenantId || !user.tenantId) return false;
    return user.tenantId === tenantId;
  }
  ```
- **Advertencia de riesgo:** activar RolesGuard en TODOS los controllers puede romper endpoints que hoy dependen del no-op (si `user.role` no viene en el request en algún modulo). Verificar con la suite de tests + smoke manual tras el cambio; si un endpoint rompe, es un bug de seguridad real preexistente que se debe reportar/fijar, no revertir el guard.
- Revisar casos edge: `users.controller` `@Get('me')`, `@Patch('me/password')` NO tienen `@RolesDecorator` → `requiredRoles` vacío → `return true` → OK (cualquier autenticado).

- [ ] **Step 1:** Sobrescribir `common/guard/roles.guard.ts`; borrar el archivo muerto (usar `Remove-Item`/`git rm`); editar `tenant.guard.ts`.
- [ ] **Step 2:** `pnpm --filter @repo/api ts:check` y correr tests.
- [ ] **Step 3:** Commit: `git commit -m "fix(api): activate real RolesGuard and harden TenantGuard"`

---

## Task 6: DeactivateMembership por email (flujo tenants) + DTO

**Files:**
- Modify: `apps/api/src/modules/identity/application/dto/deactivate.membership.request.dto.ts`
- Modify: `apps/api/src/modules/identity/application/commands/deactivate-membership/deactivate-membership.command.ts`
- Modify: `apps/api/src/modules/identity/application/commands/deactivate-membership/deactivate-membership.handler.ts`
- Modify: `apps/api/src/modules/identity/presentation/controllers/tenants.controller.ts`
- Modify: `apps/api/test/unit/identity/deactivate-membership.handler.spec.ts`

**Fixes:**
- DTO: reemplazar `userId @IsUUID` por `email @IsEmail @IsNotEmpty`.
- Command: agregar `email?: string` (mantener `userId` para el flujo `DELETE /users/:userId/membership`):
  ```ts
  constructor(readonly userId: string, readonly tenantId: string, readonly actorRole: Roles, readonly email?: string) {}
  ```
- Handler: inyectar `IUserRepository`; resolver:
  ```ts
  let userId = command.userId;
  if (command.email) {
    const user = await this.userRepo.findByEmail(command.email);
    if (!user) throw new NotFoundException(...);
    userId = user.id;
  }
  ```
  y seguir con el `findByUserAndTenant(userId, tenantId)` actual.
- `tenants.controller.ts`: **borrar el stub roto `@Delete('/memberships/:id')`** y agregar la ruta correcta con el tenant en el path:
  ```ts
  @RolesDecorator(ROLES.SUPERADMIN, ROLES.ADMIN)
  @UseGuards(TenantGuard)
  @Delete(':id/memberships')
  async deleteMembership(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DeactivateMembershipRequestDto,
  ) {
    return this.deactivateMembershipHandler.execute(
      new DeactivateMembershipCommand('', user.tenantId, user.role, dto.email),
    );
  }
  ```
  (dejar `userId` vacío; el handler resuelve por email). También agregar `@UseGuards(TenantGuard)` al `@Post(':id/memberships')` existente (hoy sin guard → cualquier admin quitaría/agregaría en tenant ajeno).
- Spec: mock `IUserRepository`; caso email válido → resuelve y desactiva; caso email inexistente → NotFound.

- [ ] **Step 1:** DTO + command + handler.
- [ ] **Step 2:** Controller (rutas delete/create + guards).
- [ ] **Step 3:** Spec.
- [ ] **Step 4:** Correr spec de deactivate-membership.
- [ ] **Step 5:** Commit: `git commit -m "fix(identity): deactivate membership by email in tenants flow"`

---

## Task 6.5: Commit the verified create-membership + change-password handlers (with specs)

**Razón (hallazgo del reviewer de Task 6):** `tenants.controller` (commiteado en Task 6) y `users.controller` (Task 7) ya importan estas commands/DTOs, pero sus archivos quedaron sin commitear (untracked del working copy) → un checkout limpio de la rama NO compila. El `identity.module` dirty también los registra. Commitearlos verificados, normalizados y con unit specs.

**Files:**
- Add: `apps/api/src/modules/identity/application/commands/create-membership/create-membership.command.ts`
- Add: `apps/api/src/modules/identity/application/commands/create-membership/create-membership.handler.ts`
- Add: `apps/api/src/modules/identity/application/commands/change-password/change-password.command.ts`
- Add: `apps/api/src/modules/identity/application/commands/change-password/change-password.handler.ts`
- Add: `apps/api/src/modules/identity/application/dto/create-membership.request.dto.ts`
- Add: `apps/api/src/modules/identity/application/dto/change-password.request.dto.ts`
- Add: `apps/api/test/unit/identity/create-membership.handler.spec.ts`
- Add: `apps/api/test/unit/identity/change-password.handler.spec.ts`

**Fixes:**
- Biome-normalizar los 6 archivos fuente (hoy con indent 2/4 espacios y LF mixto → tabs/80/1q/LF).
- `create-membership.handler.ts`: corregir el mensaje defectuoso del BadRequest (`User already joined in tenant with ${tenantId}` → `User with email ${command.userEmail} is already a member of this tenant`). Lógica intacta (findByEmail → findById tenant → findByUserAndTenant → save).
- `change-password.handler.ts`: contenido intacto salvo formato (comparar oldPassword, hashear nueva, `user.changePassword`, save; el TODO informativo se mantiene).
- Specs unit nuevos:
  - `create-membership.handler.spec.ts` (4 casos): user no existe → NotFoundException; tenant no existe → NotFoundException; ya-miembro → BadRequestException; ok → `memberRepo.save` llamado con ids+role correctos.
  - `change-password.handler.spec.ts` (3 casos): ok → hasheada + save; oldPassword incorrecto → BadRequestException; user no existe → NotFoundException.

- [ ] **Step 1:** Normalizar + fix de mensaje (biome `--write` solo sobre esos 6 archivos).
- [ ] **Step 2:** Escribir los 2 specs (jest-mock; `PasswordService.compare`/`hashPassword` mockeados).
- [ ] **Step 3:** Correr ambos specs (jest real) + `pnpm --filter api ts:check`.
- [ ] **Step 4:** Commit: `git commit -m "feat(identity): add create-membership and change-password commands"`

---

## Task 7: Users controller — rutas correctas y payloads

**Files:**
- Modify: `apps/api/src/modules/identity/presentation/controllers/users.controller.ts`
- Modify: `apps/api/src/modules/identity/application/dto/create-user.request.dto.ts`
- Modify: `apps/api/src/modules/identity/application/commands/update-user/update-user.command.ts`
- Modify: `apps/api/src/modules/identity/application/commands/update-user/update-user.handler.ts`
- Modify: `apps/api/src/modules/identity/identity.module.ts` (registrar `UpdateUserHandler` en providers)

**Fixes:**
- `users.controller.ts`:
  - **Agregar `RolesGuard` al `@UseGuards` de clase** (`@UseGuards(JwtAuthGuard, RolesGuard)`; hoy solo `JwtAuthGuard`, línea 49) — sin esto los `@RolesDecorator` de users no tienen efecto aunque T5 active el guard real.
  - `@Patch('/users/:id')` malformado (mapea a `/users/users/:id`) → **`@Put(':id')`**.
  - En `updateUser`: construir props solo con lo presente (hoy manda `email: null`, incompatible con `UpdateUserCommand.props`):
    ```ts
    const props: UpdateUserCommand['props'] = {};
    if (dto.firstName) props.firstName = dto.firstName;
    if (dto.lastName) props.lastName = dto.lastName;
    if (dto.email) props.email = new Email(dto.email);
    return this.updateUserHandler.execute(new UpdateUserCommand(id, props));
    ```
  - `@Post()` (create): sin `tenantId` del body (el front no lo manda) → `user.tenantId` del JWT:
    ```ts
    return this.createUserHandler.execute(
      new CreateUserCommand(dto.email, dto.firstName, dto.lastName, dto.role, user.role, user.tenantId),
    );
    ```
  - GET list: aceptar `@Query('tenantId')` para que el superadmin pueda listar de cualquier tenant:
    ```ts
    const effectiveTenant = user.role === ROLES.SUPERADMIN ? tenantId === undefined ? user.tenantId : tenantId : user.tenantId;
    new ListUsersByTenantQuery(effectiveTenant, +page, +limit, role)
    ```
- `create-user.request.dto.ts`: `tenantId` → `@IsOptional() @IsUUID()`.
- `update-user.handler.ts`: **fix del if invertido** (línea 17): hoy `if (!takenEmail) throw BadRequest` → no valida nada. Debe ser:
  ```ts
  if (takenEmail && takenEmail.id !== command.userId)
    throw new BadRequestException('Email already in use');
  ```
  Además, para evitar editar usuarios de OTRO tenant (admin solo puede editar dentro de su tenant), agregar `tenantId` al command y validar membresía:
  ```ts
  // en UpdateUserHandler, inyectar IUserTenantMembershipRepository
  const membership = await this.memberRepo.findByUserAndTenant(command.userId, command.tenantId);
  if (!membership) throw new NotFoundException('User not found in this tenant');
  ```
- `identity.module.ts`: registrar `UpdateUserHandler` en providers (hoy solo están `ChangePasswordHandler` y `CreateMembershipHandler` de los nuevos).

- [ ] **Step 1:** `create-user.request.dto.ts` (tenantId opcional).
- [ ] **Step 2:** `update-user.command.ts` (agregar `tenantId: string`) + `update-user.handler.ts` (if + tenant check) + nueva spec `update-user.handler.spec.ts`.
- [ ] **Step 3:** `users.controller.ts` (rutas, props, get list, no tenantId del body).
- [ ] **Step 4:** `identity.module.ts` (registrar handler).
- [ ] **Step 5:** Correr specs de create-user y la nueva spec de update-user; `pnpm --filter @repo/api ts:check`.
- [ ] **Step 6:** Commit: `git commit -m "fix(identity): correct user update/create routes and validation"`

---

## Task 8: Frontend — payloads alineados con el API

**Files:**
- Modify: `packages/common/src/types/users/change-password-payload.type.ts`
- Modify: `packages/common/src/schemas/user.schema.ts`
- Modify: `packages/ui/src/components/features/profile/password-form.tsx`
- Modify: `packages/ui/src/components/features/tenants/tenant-users-table.tsx`
- Modify: `packages/hooks/src/features/tenants/use-remove-membership.ts`
- Modify: `apps/client/src/app/(dashboard)/tenants/[id]/page.tsx`

**Fixes:**
- `ChangePasswordPayload` → `{ oldPassword: string; newPassword: string; confirmNewPassword: string }` (hoy `currentPassword`/`confirmPassword`, vs DTO backend `oldPassword`/`confirmNewPassword`).
- `changePasswordSchema` → mismos nombres (`oldPassword`, `confirmNewPassword`) + refine con `path: ['confirmNewPassword']`.
- `password-form.tsx` → defaultValues y `FormField name` acordes.
- `use-remove-membership.ts` → `DELETE TENANT_ROUTES.memberships(tenantId)` con body `{ email }`:
  ```ts
  useMutation<void, Error, { email: string; tenantId: string }>({
    mutationFn: async ({ email, tenantId }) => {
      await apiClient.delete<ApiResponse<void>>(TENANT_ROUTES.memberships(tenantId), {
        data: { email },
      });
    },
    onSuccess: (_, { tenantId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tenants.users(tenantId) });
    },
  });
  ```
  (hoy usa `TENANT_ROUTES.membership(membershipId)` = `/tenants/memberships/:id`, stub roto).
- `tenant-users-table.tsx` → `onRemove?: (user: IUserWithMembershipResponse) => void`; click pasa el user completo (para tener `email` y `id`).
- `tenants/[id]/page.tsx` → `onRemove={(user) => removeMembership.mutate({ email: user.email, tenantId: id })}` y cablear `useAddMembership` (hoy el modal hace `console.log`):
  ```ts
  const addMembership = useAddMembership();
  <AddMembershipModal tenantId={id} onSubmit={(data) => addMembership.mutate({ tenantId: id, data })} />
  ```

- [ ] **Step 1:** `@repo/common` (types + schema) → rebuild dist: `pnpm --filter @repo/common build`.
- [ ] **Step 2:** `@repo/ui` (password-form + tenant-users-table).
- [ ] **Step 3:** `@repo/hooks` (use-remove-membership).
- [ ] **Step 4:** `apps/client` (tenants/[id]/page).
- [ ] **Step 5:** `pnpm run ts:check` a nivel raíz.
- [ ] **Step 6:** Commit: `git commit -m "fix(client): align admin payloads with member endpoints"`

---

## Task 9: Normalización + verificación global

**Files:** todos los tocados (el working copy tiene indentación 2-espacios en los files nuevos de identity).

- [ ] **Step 1:** `pnpm exec biome check --write` SOLO sobre los archivos que tocan las Tasks 1-8 (no todo el repo — hay archivos dirty ajenos de announcements/cursos que no deben reformatearse). Comando sugerido:
  ```powershell
  pnpm exec biome check --write apps/api/src/modules/identity apps/api/src/common/guard apps/api/src/modules/identity/infrastructure/auth/guards apps/api/test/unit/identity packages/common/src/types/users/change-password-payload.type.ts packages/common/src/schemas/user.schema.ts packages/ui/src/components/features/profile/password-form.tsx packages/ui/src/components/features/tenants/tenant-users-table.tsx packages/hooks/src/features/tenants/use-remove-membership.ts "apps/client/src/app/(auth)/login/page.tsx" "apps/client/src/app/(dashboard)/tenants/[id]/page.tsx"
  ```
- [ ] **Step 2:** `pnpm run ts:check`
- [ ] **Step 3:** `pnpm lint:check` — si falla, verificar que TODOS los errores restantes estén en archivos ajenos al sprint (announcements, cursos, `.bru`); los de identity/client/hooks/ui/common del sprint deben quedar en cero. Reportar.
- [ ] **Step 4:** Tests: correr la suite unit completa del API con el jest-cli REAL (ver facts) y `pnpm run test` raíz si es sano (reportar si announce tests ajenos fallan).
- [ ] **Step 5:** `git status` → confirmar que los únicos M/?? que quedan fuera de TODAS las tasks son ajenos al sprint (announcements, cursos, vir-ttend/*.bru, docs/superpowers). **NO commitearlos** (son trabajo de otra feature en curso).
- [ ] **Step 6:** Commit final: `apps/api/src/modules/identity/domain/entities/user.entity.ts` (único archivo del sprint que quedó sin commitear; aporta el método `update()` que usa `update-user.handler`) + los reformateados que quedaran de Step 1. Mensaje: `feat(api): add update method to user entity` si solo es el entity, o `style(api): normalize formatting in identity module` si el paso 1 dejó diffs de estilo.

---

## Verificación funcional (manual, opcional)

1. Login superadmin (email sin membresías) → devuelve todos los tenants → front lo manda a `/select-tenant` (sin cookie, ruta pública).
2. Seleccionar tenant → `POST /auth/select-tenant` acuña token `{ role: SUPERADMIN, tenantId: <elegido> }`; cookies seteadas; `GET /users/me` responde con ese rol/tenant.
3. `GET /users?tenantId=X`, `POST /users` (rol admin ok), `PUT /users/:id` (edita al admin del tenant), `DELETE /tenants/:id/memberships` con `{ email }` (remueve al admin), `PATCH /users/me/password`, `POST /tenants/:id/memberships` con `{ email, role }`.
4. Un ADMIN login normal sigue igual (tenants propios, token con su rol real, no puede impersonar).

## Notas finales

- Nunca commitear `git add .`. Revisar `git status` en cada commit.
- Los specs existentes a tocar: `login`, `select-tenant`, `get-current-user`, `deactivate-membership` (todos en `apps/api/test/unit/identity/`). Crear `update-user.handler.spec.ts`.
- Si al activar RolesGuard algún endpoint de otros módulos falla por falta de `user.role`, es un bug de seguridad preexistente: reportarlo y arreglarlo (no revertir).