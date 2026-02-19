# Sprint 01 — Autenticación JWT

> **Objetivo:** Implementar autenticación JWT completa: registro, login, logout, refresh de tokens y protección de rutas.
> **Duración:** 1 semana · **Estimación:** 40 h · **Dependencias:** Sprint 00

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 8 |
| Application Layer | 8 |
| Infrastructure Layer | 8 |
| Presentation Layer | 6 |
| Frontend (UI + hooks + páginas) | 10 |
| **Total** | **40** |

---

## 1. Domain Layer — `modules/identity/domain`

> El dominio de identidad define qué significa un usuario y un token en el sistema. No depende de NestJS ni de la base de datos.

```
apps/api/src/modules/identity/domain/
├── entities/
│   ├── user.entity.ts                      # Entidad User con campos de dominio
│   └── refresh-token.entity.ts             # Entidad RefreshToken con fecha de expiración
├── value-objects/
│   ├── email.value-object.ts               # Valida formato, normaliza a lowercase
│   ├── password.value-object.ts            # Encapsula hash — nunca expone el raw password
│   └── token.value-object.ts              # Encapsula el JWT string
├── services/
│   ├── password.service.ts                 # hash(plain) y compare(plain, hash) con bcrypt
│   └── token.service.ts                    # generateAccessToken, generateRefreshToken, verify
├── events/
│   ├── user-registered.event.ts            # Se emite cuando un usuario se registra exitosamente
│   └── user-logged-in.event.ts             # Se emite en cada login exitoso
└── repositories/
    ├── user.repository.interface.ts        # IUserRepository: findByEmail, findById, save, exists
    └── refresh-token.repository.interface.ts # IRefreshTokenRepository: save, findByHash, revoke
```

### Esquema de entidades

| Entidad | Campos |
|---|---|
| `User` | `id`, `tenantId` (nullable — superadmin no tiene tenant), `email`, `passwordHash`, `name`, `role`, `status`, `createdAt` |
| `RefreshToken` | `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt` (nullable) |

### `email.value-object.ts` — comportamiento

```ts
// constructor valida con regex RFC 5322
// getter .value devuelve el email en lowercase
// lanza InvalidEmailException si el formato es inválido
```

### `password.service.ts` — comportamiento

```ts
// hash(plain: string): Promise<string>  → bcrypt con cost 12
// compare(plain: string, hash: string): Promise<boolean>
// Nunca loguea el password en ninguna circunstancia
```

---

## 2. Application Layer — `modules/identity/application`

> Los command/query handlers orquestan el flujo: reciben un input, llaman al dominio y persisten a través de interfaces de repositorio.

```
apps/api/src/modules/identity/application/
├── commands/
│   ├── register/
│   │   ├── register.command.ts             # { name, email, password }
│   │   └── register.handler.ts             # valida unicidad de email, hashea password, guarda User, emite UserRegistered
│   ├── login/
│   │   ├── login.command.ts                # { email, password }
│   │   └── login.handler.ts                # verifica credenciales, genera access+refresh token, guarda RefreshToken, emite UserLoggedIn
│   ├── logout/
│   │   ├── logout.command.ts               # { refreshTokenHash }
│   │   └── logout.handler.ts               # marca el RefreshToken como revocado
│   └── refresh-token/
│       ├── refresh-token.command.ts        # { refreshTokenHash }
│       └── refresh-token.handler.ts        # verifica token no revocado ni expirado, genera nuevo access token
├── queries/
│   └── get-current-user/
│       ├── get-current-user.query.ts       # { userId }
│       └── get-current-user.handler.ts     # retorna UserResponseDto sin datos sensibles
├── dtos/
│   ├── register.request.dto.ts             # name, email, password (con validaciones class-validator)
│   ├── login.request.dto.ts                # email, password
│   ├── auth.response.dto.ts                # accessToken (solo en la cookie, no en body), user: UserResponseDto
│   └── user.response.dto.ts               # id, name, email, role, tenantId
└── identity.module.ts                      # registra commands, queries, repositorios y servicios
```

### Flujo de login

```
LoginCommand
  → verificar email existe (IUserRepository.findByEmail)
  → comparar password (PasswordService.compare)
  → generar accessToken (TokenService.generateAccessToken)
  → generar refreshToken (TokenService.generateRefreshToken)
  → guardar hash del refreshToken (IRefreshTokenRepository.save)
  → emitir UserLoggedIn event
  → retornar AuthResponseDto
```

---

## 3. Infrastructure Layer — `modules/identity/infrastructure`

```
apps/api/src/modules/identity/infrastructure/
├── persistence/
│   ├── entities/
│   │   ├── user.orm-entity.ts              # @Entity() User con decoradores MikroORM
│   │   └── refresh-token.orm-entity.ts     # @Entity() RefreshToken
│   ├── repositories/
│   │   ├── user.repository.ts              # implementa IUserRepository usando EntityManager
│   │   └── refresh-token.repository.ts     # implementa IRefreshTokenRepository
│   ├── mappers/
│   │   └── user.mapper.ts                  # convierte entre UserOrmEntity ↔ User (dominio)
│   └── identity.persistence.module.ts     # registra ORM entities y repositorios
├── auth/
│   ├── strategies/
│   │   ├── jwt.strategy.ts                 # PassportStrategy(Strategy) — valida access token de la cookie
│   │   └── local.strategy.ts               # PassportStrategy(Strategy) — valida email/password en login
│   └── identity.auth.module.ts            # registra JwtModule, PassportModule y estrategias
└── events/
    ├── user-registered.listener.ts         # @OnEvent('user.registered') → loguea, (futuro: enviar email)
    └── identity.events.module.ts          # registra listeners
```

### Migración a generar

```bash
# Ejecutar tras crear las ORM entities:
pnpm mikro-orm migration:create --name=create_users_and_refresh_tokens
```

Tablas que genera:
- `users` (id, tenant_id, email, password_hash, name, role, status, created_at, updated_at)
- `refresh_tokens` (id, user_id, token_hash, expires_at, revoked_at, created_at)

---

## 4. Presentation Layer — `modules/identity/presentation`

```
apps/api/src/modules/identity/presentation/
├── controllers/
│   ├── auth.controller.ts                  # POST /auth/register, /auth/login, /auth/logout, /auth/refresh
│   └── users.controller.ts                 # GET /users/me (protegido con JwtAuthGuard)
└── identity.presentation.module.ts        # registra controllers
```

### Endpoints

| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| `POST` | `/auth/register` | público | Crea usuario, devuelve tokens en cookies HttpOnly |
| `POST` | `/auth/login` | público | Autentica, devuelve tokens en cookies HttpOnly |
| `POST` | `/auth/logout` | `JwtAuthGuard` | Revoca refresh token, limpia cookies |
| `POST` | `/auth/refresh` | público | Renueva access token usando refresh token de la cookie |
| `GET` | `/users/me` | `JwtAuthGuard` | Retorna datos del usuario autenticado |

### Configuración de cookies

```ts
// access_token
{ httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000, path: '/' }

// refresh_token
{ httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/auth/refresh' }
```

### `common/guards/auth.guard.ts` — actualizar

```ts
// Implementar JwtAuthGuard real usando JwtStrategy de Passport
// Reemplaza el guard placeholder del Sprint 00
```

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

> Toda la lógica visual de auth vive en `packages/ui`. El cliente solo importa y presenta.

```
packages/ui/src/components/features/auth/
├── login-form.tsx                          # Formulario con email, password y submit
│                                           # Usa react-hook-form + zod schema
│                                           # Muestra errores inline por campo
│                                           # Props: onSubmit(data), isLoading, error
├── register-form.tsx                       # Formulario con name, email, password, confirmPassword
│                                           # Mismas props que LoginForm
├── password-input.tsx                      # Input de password con toggle show/hide
│                                           # Reutilizable en login y register
└── auth-layout.tsx                         # Layout centrado con logo, card y footer
                                            # Envuelve login y register pages
```

### 5.2 `packages/hooks` — hooks nuevos

```
packages/hooks/src/
├── lib/
│   └── axios-client.ts                     # ya creado en Sprint 00 — no modificar
├── auth/
│   ├── use-login.ts                        # useMutation → apiClient.post(AUTH_ROUTES.login)
│   │                                       # onSuccess: llama AuthContext.setUser(user)
│   ├── use-register.ts                     # useMutation → apiClient.post(AUTH_ROUTES.register)
│   ├── use-logout.ts                       # useMutation → apiClient.post(AUTH_ROUTES.logout)
│   │                                       # onSuccess: llama AuthContext.clearUser()
│   ├── use-refresh-token.ts                # useMutation → apiClient.post(AUTH_ROUTES.refresh)
│   │                                       # el interceptor de axios-client lo llama automáticamente en 401
│   └── use-current-user.ts                 # useQuery → apiClient.get(AUTH_ROUTES.me)
│                                           # usado por AuthProvider al montar para restaurar sesión
└── index.ts                                # re-exporta todos los hooks de auth
```

### 5.3 `apps/client` — páginas

```
apps/client/src/app/
├── (auth)/
│   ├── layout.tsx                          # Importa AuthLayout de @vir-ttend/ui
│   ├── login/
│   │   └── page.tsx                        # Importa LoginForm de @vir-ttend/ui
│   │                                       # Usa useLogin de @vir-ttend/hooks
│   │                                       # En éxito: redirige a /dashboard
│   └── register/
│       └── page.tsx                        # Importa RegisterForm de @vir-ttend/ui
│                                           # Usa useRegister de @vir-ttend/hooks
```

### 5.4 `apps/client/src/lib/auth/provider.tsx` — implementar

```ts
// AuthContext real — solo estado React, sin fetching:
// - estado: user: UserResponseDto | null, isAuthenticated: boolean, isLoading: boolean
// - al montar: llama useCurrentUser() (del hook) para restaurar sesión desde la cookie
// - setUser(user): llamado por useLogin y useRegister tras éxito
// - clearUser(): llamado por useLogout tras éxito
// No importa axios ni endpoints — eso vive en @vir-ttend/hooks
```

### 5.5 `packages/hooks/src/auth/` — patrón de uso de rutas

```ts
// Todos los hooks importan rutas desde @vir-ttend/common, no las hardcodean:
import { AUTH_ROUTES } from '@vir-ttend/common';
import { apiClient } from '../lib/axios-client';

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequestDto) =>
      apiClient.post(AUTH_ROUTES.login, data).then(r => r.data),
  });
}
```

---

## 6. Testing

```
apps/api/test/unit/identity/
├── register.handler.spec.ts                # mock IUserRepository, PasswordService — verifica que hashea y guarda
├── login.handler.spec.ts                   # mock credenciales correctas e incorrectas
├── password.service.spec.ts               # hash + compare
└── token.service.spec.ts                  # generate + verify (expirado, inválido)
```

---

## 7. Tareas por día

### Día 1: Domain Layer
- [ ] Crear `User` entity y `RefreshToken` entity
- [ ] Crear Value Objects: `EmailVO`, `PasswordVO`, `TokenVO`
- [ ] Implementar `PasswordService` con bcrypt
- [ ] Implementar `TokenService` con jsonwebtoken
- [ ] Definir interfaces `IUserRepository` y `IRefreshTokenRepository`

### Día 2: Application Layer
- [ ] Crear `RegisterCommand` + `RegisterHandler`
- [ ] Crear `LoginCommand` + `LoginHandler`
- [ ] Crear `LogoutCommand` + `LogoutHandler`
- [ ] Crear `RefreshTokenCommand` + `RefreshTokenHandler`
- [ ] Crear `GetCurrentUserQuery` + Handler
- [ ] Crear todos los DTOs con validaciones

### Día 3: Infrastructure Layer
- [ ] Crear ORM entities con decoradores MikroORM
- [ ] Implementar `UserRepository` y `RefreshTokenRepository`
- [ ] Crear `UserMapper`
- [ ] Generar y ejecutar migración
- [ ] Implementar `JwtStrategy` y `LocalStrategy`

### Día 4: Presentation Layer
- [ ] Crear `AuthController` con los 4 endpoints
- [ ] Crear `UsersController` con `GET /users/me`
- [ ] Implementar `JwtAuthGuard` real (reemplaza placeholder)
- [ ] Probar flujo completo con Postman/curl

### Día 5–6: Frontend
- [ ] Crear `LoginForm`, `RegisterForm`, `PasswordInput`, `AuthLayout` en `packages/ui`
- [ ] Crear hooks en `packages/hooks`
- [ ] Implementar `AuthContext` real en `apps/client`
- [ ] Crear páginas `/login` y `/register` en `apps/client`
- [ ] Conectar formularios con API

### Día 7: Integración y tests
- [ ] Tests unitarios de handlers y servicios
- [ ] Test end-to-end del flujo completo (register → login → /users/me → logout)
- [ ] Verificar cookies HttpOnly en navegador

---

## 8. Criterios de aceptación

- [ ] Usuario puede registrarse con nombre, email y password
- [ ] Usuario puede iniciar sesión y recibe tokens en cookies HttpOnly
- [ ] `GET /users/me` retorna datos correctos con token válido
- [ ] `GET /users/me` retorna 401 sin token
- [ ] Access token expira en 15 minutos; refresh token en 7 días
- [ ] Logout revoca el refresh token en base de datos
- [ ] El interceptor de `axios-client.ts` renueva el token automáticamente ante un 401
- [ ] `apps/client` no importa axios ni tiene lógica de fetching — solo usa hooks de `@vir-ttend/hooks`
- [ ] `AuthContext` en `apps/client` solo maneja estado React — no fetchea directamente
- [ ] Frontend redirige a `/dashboard` tras login exitoso
- [ ] Frontend redirige a `/login` si `/dashboard` se accede sin autenticar

---

**Siguiente sprint →** Sprint 02: Gestión de Usuarios y Tenants
