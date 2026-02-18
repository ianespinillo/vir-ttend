# Sprint 01: Autenticación Base

**Objetivo:** Sistema de autenticación JWT funcional  
**Duración:** 1 semana  
**Estimación:** 35 horas  
**Depende de:** Sprint 00 (Foundation)

---

## Objetivo

Implementar el sistema de autenticación JWT con registro, login, logout y manejo de tokens.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 6 |
| Application Layer | 8 |
| Infrastructure Layer | 8 |
| Presentation Layer | 5 |
| Frontend | 8 |
| **Total** | **35** |

---

## Backend

### Domain Layer

**Módulo:** `modules/identity`

**Archivos a crear:**

```
modules/identity/
├── domain/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── refresh-token.entity.ts
│   ├── value-objects/
│   │   ├── user-id.value-object.ts
│   │   ├── email.value-object.ts
│   │   ├── password.value-object.ts
│   │   └── token.value-object.ts
│   ├── services/
│   │   ├── password.service.ts      # Hashing de passwords
│   │   └── token.service.ts        # Generación de tokens
│   ├── events/
│   │   ├── user-registered.event.ts
│   │   └── user-logged-in.event.ts
│   └── repositories/
│       ├── user.repository.interface.ts
│       └── refresh-token.repository.interface.ts
```

**Detalles de entidades:**

| Entidad | Campos |
|---------|--------|
| User | id, tenant_id (nullable), email, password_hash, name, role, status, created_at |
| RefreshToken | id, user_id, token_hash, expires_at, revoked_at |

### Application Layer

**Módulo:** `modules/identity/application`

**Archivos a crear:**

```
modules/identity/
├── application/
│   ├── commands/
│   │   ├── login/
│   │   │   ├── login.command.ts
│   │   │   └── login.handler.ts
│   │   ├── register/
│   │   │   ├── register.command.ts
│   │   │   └── register.handler.ts
│   │   └── logout/
│   │       ├── logout.command.ts
│   │       └── logout.handler.ts
│   ├── queries/
│   │   ├── get-current-user/
│   │   │   ├── get-current-user.query.ts
│   │   │   └── get-current-user.handler.ts
│   │   └── validate-token/
│   │       ├── validate-token.query.ts
│   │       └── validate-token.handler.ts
│   ├── dtos/
│   │   ├── login.request.dto.ts
│   │   ├── login.response.dto.ts
│   │   ├── register.request.dto.ts
│   │   ├── register.response.dto.ts
│   │   └── user.response.dto.ts
│   └── identity.module.ts
```

### Infrastructure Layer

**Módulo:** `modules/identity/infrastructure`

**Archivos a crear:**

```
modules/identity/
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   └── refresh-token.repository.ts
│   │   ├── mappers/
│   │   │   └── user.mapper.ts
│   │   └── identity.persistence.module.ts
│   ├── auth/
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── identity.auth.module.ts
│   └── events/
│       └── identity.events.module.ts
```

**JWT Config:**

```typescript
// jwt.config.ts
export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  },
};
```

### Presentation Layer

**Módulo:** `modules/identity/presentation`

**Archivos a crear:**

```
modules/identity/
└── presentation/
    ├── controllers/
    │   ├── auth.controller.ts      # POST /auth/login, /auth/register, /auth/logout
    │   └── users.controller.ts    # GET /users/me
    ├── routes/
    │   ├── auth.routes.ts
    │   └── users.routes.ts
    └── identity.presentation.module.ts
```

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /auth/register | Registrar usuario |
| POST | /auth/login | Iniciar sesión |
| POST | /auth/logout | Cerrar sesión |
| POST | /auth/refresh | Renovar access token |
| GET | /users/me | Obtener usuario actual |

### Common/Shared

**Actualizar:**

```
src/common/
├── decorators/
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts        # Basic role decorator
├── guards/
│   └── auth.guard.ts             # JWT auth guard
└── constants/
    └── roles.ts                  # Enum roles: admin, director, preceptor, teacher
```

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── (auth)/
│   ├── layout.tsx               # Minimal auth layout
│   ├── login/
│   │   └── page.tsx            # /login
│   └── register/
│       └── page.tsx            # /register
```

### Components

**Archivos a crear:**

```
src/components/
├── features/
│   └── auth/
│       ├── login-form.tsx
│       └── register-form.tsx
```

### Hooks

**Archivos a crear:**

```
packages/hooks/
├── src/
│   ├── auth/
│   │   ├── use-login.ts
│   │   ├── use-register.ts
│   │   ├── use-logout.ts
│   │   ├── use-current-user.ts
│   │   └── use-refresh-token.ts
│   └── index.ts
```

### Lib

**Actualizar:**

```
src/lib/
├── api/
│   ├── client.ts               # Agregar interceptor de token
│   └── endpoints.ts            # Agregar endpoints de auth
├── auth/
│   ├── provider.tsx            # AuthProvider con contexto
│   └── utils.ts                # Funciones: getToken, setToken, etc.
```

---

## Testing

**Archivos a crear:**

```
apps/api/
├── test/
│   └── unit/
│       └── identity/
│           ├── auth.service.spec.ts
│           ├── password.service.spec.ts
│           └── token.service.spec.ts
```

---

## Tareas por Día

### Día 1: Domain Layer

- [ ] Crear entidades User, RefreshToken
- [ ] Crear Value Objects
- [ ] Crear PasswordService (bcrypt)
- [ ] Crear TokenService

### Día 2: Application Layer

- [ ] Crear LoginCommand + Handler
- [ ] Crear RegisterCommand + Handler
- [ ] Crear DTOs de request/response
- [ ] Crear GetCurrentUserQuery

### Día 3: Infrastructure Layer

- [ ] Implementar UserRepository
- [ ] Implementar RefreshTokenRepository
- [ ] Configurar JwtStrategy
- [ ] Configurar LocalStrategy

### Día 4: Presentation Layer

- [ ] Crear AuthController
- [ ] Crear UsersController
- [ ] Configurar cookies HttpOnly
- [ ] Probar con Postman

### Día 5-6: Frontend

- [ ] Crear páginas login/register
- [ ] Crear LoginForm, RegisterForm
- [ ] Implementar AuthProvider
- [ ] Implementar hooks de auth
- [ ] Conectar con API

### Día 7: Integración

- [ ] Test end-to-end del flujo auth
- [ ] Manejo de errores
- [ ] Edge cases

---

## Criterios de Aceptación

- [ ] Usuario puede registrarse con email/password
- [ ] Usuario puede iniciar sesión y recibe tokens en cookies HttpOnly
- [ ] Access token expira en 15 min
- [ ] Refresh token expira en 7 días
- [ ] Frontend muestra página de login y redirige tras login exitoso
- [ ] /users/me retorna datos del usuario actual

---

## Siguiente Sprint

- Sprint 02: Gestión de Usuarios y Tenants (Roles, Multi-tenancy, Schools)
