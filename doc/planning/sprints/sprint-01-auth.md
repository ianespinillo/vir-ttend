# Sprint 01 — Autenticación JWT

> **Objetivo:** Implementar autenticación JWT completa con login en dos pasos, gestión de sesión por tenant y protección de rutas.
> **Duración:** 1 semana · **Estimación:** 40 h · **Dependencias:** Sprint 00

---

## Decisiones de diseño

**Login en dos pasos:** el usuario primero valida credenciales y recibe la lista de tenants a los que pertenece. Luego elige un tenant y recibe el JWT con el rol correspondiente a ese tenant. El `superadmin` es la excepción — hace login directo sin elegir tenant.

**`UserTenantMembership`:** el rol no vive en `User` sino en una entidad separada que relaciona usuario + tenant + rol. Un usuario puede ser `admin` en un tenant y `preceptor` en otro.

**`User` sin `role` ni `tenantId`:** la entidad `User` solo tiene datos personales. El rol y el tenant vienen del membership activo de la sesión.

**JWT payload:**
```ts
{
  sub:      userId,
  tenantId: tenantId,  // null para superadmin
  role:     role,      // el rol en ese tenant
  email:    email,
}
```

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 10 |
| Application Layer | 10 |
| Infrastructure Layer | 8 |
| Presentation Layer | 6 |
| Frontend (UI + hooks + páginas) | 6 |
| **Total** | **40** |

---

## 1. Domain Layer — `modules/identity/domain`

```
apps/api/src/modules/identity/domain/
├── entities/
│   ├── user.entity.ts                      # Datos personales del usuario — sin role ni tenantId
│   ├── user-tenant-membership.entity.ts    # Relación usuario + tenant + rol
│   └── refresh-token.entity.ts             # Token de refresh con hash, expiración y revocación
├── value-objects/
│   ├── email.vo.ts                         # Valida formato RFC 5322, normaliza a lowercase
│   ├── password.vo.ts                      # Valida reglas (8+ chars, mayúscula, número, especial)
│   │                                       # getRawValue(): string — evita toString() accidental
│   │                                       # static generateRandomPassword(): Password
│   └── password-hashed.vo.ts              # Wrapper del hash — static fromHash(hash): PasswordHashed
│                                           # getRaw(): string
├── services/
│   ├── password.service.ts                 # hashPassword(password: Password): Promise<PasswordHashed>
│   │                                       # compare(password: Password, hashed: PasswordHashed): Promise<boolean>
│   │                                       # Usa bcryptjs con cost 10
│   └── token.service.ts                    # generateAccessToken(payload: JwtPayload): string
│                                           # generateRefreshToken(): string — string aleatorio opaco, no JWT
│                                           # verifyAccessToken(token: string): JwtPayload
│                                           # hashToken(token: string): string — SHA-256
├── events/
│   ├── user-created.event.ts               # { userId, email, rawPassword, occurredAt }
│   │                                       # rawPassword incluido para que el listener envíe el email SMTP
│   ├── user-tenant-linked.event.ts         # { userId, email, tenantId, role, occurredAt }
│   │                                       # se emite cuando un usuario existente es vinculado a un nuevo tenant
│   └── user-logged-in.event.ts             # { userId, tenantId, ipAddress?, userAgent?, occurredAt }
└── repositories/
    ├── user.repository.interface.ts        # findById, findByEmail, save, exists(email)
    ├── user-tenant-membership.repository.interface.ts # findByUserId, findByUserAndTenant, save
    └── refresh-token.repository.interface.ts          # save, findByHash, revokeAllByUserId
```

### Esquema de entidades

| Entidad | Campos |
|---|---|
| `User` | `id`, `email` (EmailVO), `password` (PasswordHashed), `firstName`, `lastName`, `isActive`, `mustChangePassword`, `createdAt`, `updatedAt` |
| `UserTenantMembership` | `id`, `userId`, `tenantId`, `role` (Roles), `isActive`, `createdAt` |
| `RefreshToken` | `id`, `userId`, `token` (hash SHA-256), `expiresAt`, `createdAt`, `revokedAt?` |

### `user.entity.ts` — comportamiento

```ts
// constructor privado — solo accesible via create() y reconstitute()
// static create(props: CreateUserProps): User
//   → genera id con randomUUID()
//   → isActive = true, mustChangePassword = true
// static reconstitute(props): User
//   → hidrata sin aplicar lógica de negocio
// changePassword(newPassword: PasswordHashed): void → actualiza _updatedAt
// deactivate(): void → isActive = false, actualiza _updatedAt
// get password(): string → delega en PasswordHashed.getRaw()
```

### `user-tenant-membership.entity.ts` — comportamiento

```ts
// static create(userId, tenantId, role): UserTenantMembership
// static reconstitute(props): UserTenantMembership
// deactivate(): void → isActive = false
// changeRole(newRole: Roles): void
```

### `refresh-token.entity.ts` — comportamiento

```ts
// static create(userId, tokenHash, expiresAt): RefreshToken
// static reconstitute(props): RefreshToken
// revoke(): void → _revokedAt = new Date()
// isExpired(): boolean → new Date() > _expiresAt
// isRevoked(): boolean → _revokedAt !== undefined
// isValid(): boolean → !isExpired() && !isRevoked()
```

---

## 2. Application Layer — `modules/identity/application`

```
apps/api/src/modules/identity/application/
├── commands/
│   ├── create-user/
│   │   ├── create-user.command.ts          # { email, firstName, lastName, role, tenantId?, createdByRole }
│   │   └── create-user.handler.ts          # ver flujo detallado abajo
│   ├── login/
│   │   ├── login.command.ts                # { email, password, ipAddress?, userAgent? }
│   │   └── login.handler.ts                # paso 1 — valida credenciales, retorna tenants disponibles
│   ├── select-tenant/
│   │   ├── select-tenant.command.ts        # { userId, tenantId }
│   │   └── select-tenant.handler.ts        # paso 2 — genera JWT con rol del membership, guarda RefreshToken
│   ├── logout/
│   │   ├── logout.command.ts               # { refreshToken }
│   │   └── logout.handler.ts               # hashea token, busca y revoca el RefreshToken
│   └── refresh-token/
│       ├── refresh-token.command.ts        # { refreshToken }
│       └── refresh-token.handler.ts        # verifica validez, genera nuevo accessToken
├── queries/
│   └── get-current-user/
│       ├── get-current-user.query.ts       # { userId, tenantId }
│       └── get-current-user.handler.ts     # retorna UserResponseDto con datos del membership activo
├── dtos/
│   ├── create-user.request.dto.ts          # email, firstName, lastName, role, tenantId?
│   ├── login.request.dto.ts                # email, password
│   ├── login.response.dto.ts              # tenants: TenantOptionDto[] — para mostrar el selector
│   ├── tenant-option.dto.ts               # tenantId, tenantName, role — para el selector de tenant
│   ├── select-tenant.request.dto.ts       # userId, tenantId
│   ├── auth.response.dto.ts               # user: UserResponseDto — tokens van en cookies, no en body
│   └── user.response.dto.ts              # id, email, firstName, lastName, role, tenantId, mustChangePassword
└── identity.module.ts
```

### Flujo `CreateUserHandler`

```ts
// 1. Validar jerarquía de roles
const canCreate: Record<Roles, Roles[]> = {
  [ROLES.SUPERADMIN]: [ROLES.ADMIN],
  [ROLES.ADMIN]:      [ROLES.PRECEPTOR, ROLES.TEACHER],
  [ROLES.PRECEPTOR]:  [],
  [ROLES.TEACHER]:    [],
};
if (!canCreate[command.createdByRole]?.includes(command.role)) throw new Error(...)

// 2. Buscar si el usuario ya existe
let user = await userRepository.findByEmail(command.email);
let isNewUser = false;

if (!user) {
  // caso 1 — usuario nuevo: crear User + generar password temporal
  const rawPassword = Password.generateRandomPassword();
  const hashed = await passwordService.hashPassword(rawPassword);
  user = User.create({ email, firstName, lastName, password: hashed });
  await userRepository.save(user);
  isNewUser = true;
}

// 3. Verificar que no esté ya vinculado a este tenant (superadmin no tiene tenant)
if (command.tenantId) {
  const existing = await membershipRepository.findByUserAndTenant(user.id, command.tenantId);
  if (existing) throw new Error('User already belongs to this tenant');

  const membership = UserTenantMembership.create(user.id, command.tenantId, command.role);
  await membershipRepository.save(membership);
}

// 4. Emitir evento según el caso
if (isNewUser) {
  eventEmitter.emit('user.created', new UserCreatedEvent(user.id, user.email, rawPassword.getRawValue()));
} else {
  eventEmitter.emit('user.tenant.linked', new UserTenantLinkedEvent(user.id, user.email, command.tenantId, command.role));
}
```

### Flujo `LoginHandler` (paso 1)

```ts
// 1. Buscar usuario por email (sin filtrar por tenant — aún no sabe a cuál va)
const user = await userRepository.findByEmail(command.email);
if (!user) throw new Error('Invalid credentials');
if (!user.isActive) throw new Error('Invalid credentials');

// 2. Verificar password
const valid = await passwordService.compare(new Password(command.password), user.password);
if (!valid) throw new Error('Invalid credentials');

// 3. Obtener memberships activos
const memberships = await membershipRepository.findByUserId(user.id);

// 4. Si es superadmin (sin memberships) → ir directo a generar token
// Si tiene memberships → retornar lista para que el cliente muestre el selector
if (memberships.length === 0) {
  // superadmin — retornar flag especial
  return { isSuperAdmin: true, userId: user.id, tenants: [] };
}

return {
  isSuperAdmin: false,
  userId: user.id,
  tenants: memberships.map(m => ({ tenantId: m.tenantId, role: m.role }))
};
```

### Flujo `SelectTenantHandler` (paso 2)

```ts
// 1. Verificar que el membership existe y está activo
const membership = await membershipRepository.findByUserAndTenant(command.userId, command.tenantId);
if (!membership || !membership.isActive) throw new Error('Invalid tenant selection');

const user = await userRepository.findById(command.userId);

// 2. Generar tokens
const accessToken = tokenService.generateAccessToken({
  sub: user.id, tenantId: membership.tenantId,
  role: membership.role, email: user.email,
});
const refreshToken = tokenService.generateRefreshToken();
const refreshTokenHash = tokenService.hashToken(refreshToken);

// 3. Guardar refresh token
await refreshTokenRepository.save(RefreshToken.create(
  user.id, refreshTokenHash,
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
));

// 4. Emitir evento
eventEmitter.emit('user.logged-in', new UserLoggedInEvent(user.id, membership.tenantId));

// 5. Retornar tokens — el controller los mete en cookies
return { accessToken, refreshToken, user };
```

---

## 3. Infrastructure Layer — `modules/identity/infrastructure`

```
apps/api/src/modules/identity/infrastructure/
├── persistence/
│   ├── entities/
│   │   ├── user.orm-entity.ts                      # @Entity('users') — solo datos personales
│   │   ├── user-tenant-membership.orm-entity.ts    # @Entity('user_tenant_memberships')
│   │   └── refresh-token.orm-entity.ts             # @Entity('refresh_tokens')
│   ├── repositories/
│   │   ├── user.repository.ts                      # implementa IUserRepository con MikroORM
│   │   ├── user-tenant-membership.repository.ts    # implementa IUserTenantMembershipRepository
│   │   └── refresh-token.repository.ts             # implementa IRefreshTokenRepository
│   ├── mappers/
│   │   ├── user.mapper.ts                          # UserOrmEntity ↔ User (dominio)
│   │   │                                           # toDomain() usa User.reconstitute()
│   │   │                                           # toOrm() mapea cada campo sin lógica
│   │   ├── user-tenant-membership.mapper.ts        # UserTenantMembershipOrmEntity ↔ UserTenantMembership
│   │   └── refresh-token.mapper.ts                 # RefreshTokenOrmEntity ↔ RefreshToken
│   └── identity.persistence.module.ts
├── auth/
│   └── strategies/
│       └── jwt.strategy.ts                         # PassportStrategy — lee JWT de la cookie access_token
│                                                   # valida firma y expiry, popula request.user con JwtPayload
└── events/
    ├── user-created.listener.ts                    # @OnEvent('user.created') → loguea (SMTP en sprint futuro)
    ├── user-tenant-linked.listener.ts              # @OnEvent('user.tenant.linked') → loguea
    └── identity.events.module.ts
```

### Migración a generar

```bash
pnpm mikro-orm migration:create --name=create_identity_tables
```

Tablas:
- `users` (id, email, password_hash, first_name, last_name, is_active, must_change_password, created_at, updated_at)
- `user_tenant_memberships` (id, user_id FK, tenant_id, role, is_active, created_at)
- `refresh_tokens` (id, user_id FK, token, expires_at, revoked_at, created_at)
- Índice único: `(email)` en `users`
- Índice único: `(user_id, tenant_id)` en `user_tenant_memberships`
- Índice: `(token)` en `refresh_tokens`

---

## 4. Presentation Layer — `modules/identity/presentation`

```
apps/api/src/modules/identity/presentation/
├── controllers/
│   ├── auth.controller.ts                  # endpoints de autenticación
│   └── users.controller.ts                 # GET /users/me
└── identity.presentation.module.ts
```

### Endpoints

| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| `POST` | `/auth/login` | público | Paso 1: valida credenciales, retorna lista de tenants |
| `POST` | `/auth/select-tenant` | público | Paso 2: elige tenant, recibe JWT en cookies |
| `POST` | `/auth/logout` | `JwtAuthGuard` | Revoca refresh token, limpia cookies |
| `POST` | `/auth/refresh` | público | Renueva access token con refresh token de la cookie |
| `GET` | `/users/me` | `JwtAuthGuard` | Retorna datos del usuario + rol del tenant activo |

### Configuración de cookies

```ts
// access_token — duración: 15 minutos
{ httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000, path: '/' }

// refresh_token — duración: 7 días, solo accesible en /auth/refresh
{ httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/auth/refresh' }
```

### `JwtAuthGuard` — implementar (reemplaza placeholder del Sprint 00)

```ts
// Extiende AuthGuard('jwt') de @nestjs/passport
// Lee el token de la cookie access_token (no del header Authorization)
// Si el token es válido, popula request.user con JwtPayload
// Si es inválido o expirado, retorna 401
```

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/auth/
├── login-form.tsx                          # Formulario: email + password
│                                           # Props: onSubmit(data), isLoading, error
├── tenant-selector.tsx                     # Lista de tenants para elegir tras el login
│                                           # Props: tenants: TenantOptionDto[], onSelect, isLoading
│                                           # Muestra: nombre del tenant + badge del rol
├── password-input.tsx                      # Input de password con toggle show/hide
│                                           # Reutilizable en login y change-password
└── auth-layout.tsx                         # Layout centrado con logo, card y footer
```

### 5.2 `packages/hooks` — hooks nuevos

```
packages/hooks/src/
├── lib/
│   └── axios-client.ts                     # ya creado en Sprint 00 — no modificar
├── auth/
│   ├── use-login.ts                        # useMutation → apiClient.post(AUTH_ROUTES.login)
│   │                                       # onSuccess: guarda tenants en estado local para mostrar selector
│   ├── use-select-tenant.ts               # useMutation → apiClient.post(AUTH_ROUTES.selectTenant)
│   │                                       # onSuccess: llama AuthContext.setUser(user)
│   ├── use-logout.ts                       # useMutation → apiClient.post(AUTH_ROUTES.logout)
│   │                                       # onSuccess: llama AuthContext.clearUser()
│   └── use-current-user.ts                # useQuery → apiClient.get(AUTH_ROUTES.me)
│                                           # usado por AuthProvider al montar para restaurar sesión
└── index.ts
```

### 5.3 `packages/common/routes` — actualizar

```ts
// auth.routes.ts — agregar:
export const AUTH_ROUTES = {
  login:        '/auth/login',
  selectTenant: '/auth/select-tenant',   // nuevo
  logout:       '/auth/logout',
  refresh:      '/auth/refresh',
  me:           '/users/me',
} as const;
```

### 5.4 `apps/client` — páginas

```
apps/client/src/app/(auth)/
├── layout.tsx                              # Importa AuthLayout de @vir-ttend/ui
├── login/
│   └── page.tsx                            # Importa LoginForm de @vir-ttend/ui
│                                           # Usa useLogin — en éxito: muestra TenantSelector o redirige
└── login/
    └── select-tenant/
        └── page.tsx                        # Importa TenantSelector de @vir-ttend/ui
                                            # Usa useSelectTenant — en éxito: redirige a /dashboard
```

### 5.5 `apps/client/src/lib/auth/provider.tsx`

```ts
// AuthContext — solo estado React, sin fetching
// estado: user: UserResponseDto | null, isAuthenticated, isLoading
// setUser(user): llamado por useSelectTenant tras éxito
// clearUser(): llamado por useLogout tras éxito
// Al montar: llama useCurrentUser() para restaurar sesión desde la cookie
```

---

## 6. Testing

```
apps/api/test/unit/identity/
├── create-user.handler.spec.ts             # los 3 casos: nuevo, existente+nuevo tenant, ya vinculado
├── login.handler.spec.ts                   # credenciales correctas, incorrectas, usuario inactivo
├── select-tenant.handler.spec.ts           # membership válido, inválido, inactivo
├── logout.handler.spec.ts                  # token válido, token ya revocado
├── refresh-token.handler.spec.ts           # token válido, expirado, revocado
├── password.service.spec.ts               # hash + compare
└── token.service.spec.ts                  # generateAccessToken, verifyAccessToken, hashToken
```

---

## 7. Tareas por día

### Día 1: Domain Layer — entidades y VOs
- [ ] `User` entity sin role ni tenantId
- [ ] `UserTenantMembership` entity
- [ ] `RefreshToken` entity con `isValid()`
- [ ] `EmailVO`, `Password`, `PasswordHashed`
- [ ] Interfaces de repositorios

### Día 2: Domain Layer — servicios
- [ ] `PasswordService` con bcryptjs
- [ ] `TokenService` con jsonwebtoken + hashToken con crypto
- [ ] Eventos: `UserCreatedEvent`, `UserTenantLinkedEvent`, `UserLoggedInEvent`

### Día 3: Application Layer
- [ ] `CreateUserCommand` + handler (3 casos)
- [ ] `LoginCommand` + handler (paso 1)
- [ ] `SelectTenantCommand` + handler (paso 2)
- [ ] `LogoutCommand` + handler
- [ ] `RefreshTokenCommand` + handler
- [ ] `GetCurrentUserQuery` + handler
- [ ] Todos los DTOs

### Día 4: Infrastructure Layer
- [ ] ORM entities para User, UserTenantMembership, RefreshToken
- [ ] Repositorios con MikroORM
- [ ] Mappers (con `reconstitute()`)
- [ ] `JwtStrategy` que lee de cookie
- [ ] Generar y ejecutar migración

### Día 5: Presentation Layer
- [ ] `AuthController` con los 5 endpoints
- [ ] `UsersController` con `GET /users/me`
- [ ] `JwtAuthGuard` real
- [ ] Probar flujo completo con Postman: login → select-tenant → /users/me → logout

### Día 6–7: Frontend
- [ ] `LoginForm`, `TenantSelector`, `PasswordInput`, `AuthLayout` en `packages/ui`
- [ ] Hooks en `packages/hooks`
- [ ] Páginas en `apps/client`
- [ ] Actualizar `AUTH_ROUTES` en `packages/common`

---

## 8. Criterios de aceptación

- [ ] Login paso 1 retorna lista de tenants del usuario
- [ ] `superadmin` hace login directo sin selector de tenant
- [ ] Login paso 2 genera JWT con el rol correcto del membership elegido
- [ ] Tokens se entregan en cookies HttpOnly
- [ ] `GET /users/me` retorna datos con el rol del tenant activo
- [ ] Logout revoca el refresh token en base de datos
- [ ] Interceptor de axios renueva el access token automáticamente ante un 401
- [ ] Un usuario puede pertenecer a múltiples tenants con distintos roles
- [ ] `CreateUserHandler` crea membership sin duplicar el `User` si el email ya existe
- [ ] `apps/client` no importa axios directamente

---

**Siguiente sprint →** Sprint 02: Gestión de Tenants y Usuarios
