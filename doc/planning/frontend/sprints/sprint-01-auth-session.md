# Sprint 01 — Autenticación y Sesión

> **Objetivo:** Implementar el flujo de login en dos pasos (credenciales → selector de tenant), restauración de sesión desde cookie, logout y protección de rutas por autenticación y rol.
> **Duración:** 1 semana · **Estimación:** 30 h · **Dependencias:** Sprint 00

---

## Decisiones de diseño

**Login en dos pasos:** el backend (`POST /auth/login`) valida credenciales y responde con la lista de tenants del usuario. El frontend guarda esa respuesta en memoria (y en una store ligera) y muestra el `TenantSelector`. Al elegir tenant → `POST /auth/select-tenant` → el backend setea las cookies httpOnly y responde con el usuario. `SUPERADMIN` hace login directo (sin selector).

**Sesión = cookie httpOnly, estado = AuthContext.** El frontend nunca ve los tokens. `GET /users/me` restaura la sesión al recargar.

**Middleware de Next.js protege las rutas en el server; el layout `(auth)`/`(dashboard)` refuerza en el client.** El middleware solo puede leer cookies — como el rol viaja en el JWT (cookie), el middleware valida presencia de sesión; el guard de rol fino ocurre en el layout con `useCurrentUser`.

**AuthContext (estado React puro):** no fetchea. Los hooks de `@repo/hooks` llaman a `setUser`/`clearUser` tras éxito.

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — schemas y tipos de auth | 3 |
| `@repo/hooks` — hooks de auth | 8 |
| `@repo/ui` — componentes de auth | 8 |
| `apps/client` — páginas, middleware, guards | 11 |
| **Total** | **30** |

---

## 1. `@repo/common`

### 1.1 Ya existe (Sprint 00): `auth.schema.ts`, tipos `auth/*`, `AUTH_ROUTES` corregido.

---

## 2. `@repo/hooks` — hooks de autenticación

```
packages/hooks/src/features/auth/
├── use-login.ts               # useMutation → POST /auth/login
│                              # onSuccess: guarda LoginResponse en store (tenants) para mostrar selector
├── use-select-tenant.ts       # useMutation → POST /auth/select-tenant
│                              # onSuccess: AuthContext.setUser(user) + invalida queryKeys.auth.me
├── use-logout.ts              # useMutation → POST /auth/logout
│                              # onSuccess: AuthContext.clearUser()
├── use-current-user.ts        # useQuery → GET /users/me (enabled: solo cuando hay sesión)
└── index.ts
```

```ts
// use-login.ts
export function useLogin() {
  const { setTenants } = useAuthStore();
  return useMutation({
    mutationFn: (data: LoginInput) =>
      apiClient.post<LoginResponse>(AUTH_ROUTES.login, data).then((r) => r.data),
    onSuccess: (res) => setTenants(res.tenants),
  });
}
```

---

## 3. `@repo/ui` — componentes de autenticación

```
packages/ui/src/components/features/auth/
├── auth-layout.tsx            # Layout centrado: logo + card + footer
├── login-form.tsx             # Form RHF + zod: email, password
│                              # Props: onSubmit(data), isLoading, error
├── password-input.tsx         # Input con toggle show/hide
├── tenant-selector.tsx        # Lista de tenants con badge del rol
│                              # Props: tenants: TenantOption[], onSelect, isLoading
└── index.ts
```

**Flujo del login (login-form):**

```
submit → useLogin.mutate
  ├─ isSuperAdmin → redirigir a /dashboard
  └─ tenants.length === 1 → useSelectTenant de una
  └─ tenants.length > 1  → navegar a /select-tenant (muestra TenantSelector)
```

---

## 4. `apps/client` — páginas, middleware y guards

### 4.1 Rutas

```
apps/client/src/app/
├── (auth)/
│   ├── layout.tsx                 # AuthLayout de @repo/ui
│   ├── login/page.tsx             # LoginForm + useLogin
│   └── select-tenant/page.tsx     # TenantSelector + useSelectTenant
├── (dashboard)/                   # creado en Sprint 02; aquí solo el guard
│   └── layout.tsx
├── middleware.ts
└── lib/auth/
    ├── provider.tsx               # AuthContext real
    └── guards.ts                  # requireRole(), isRouteAllowed()
```

### 4.2 `lib/auth/provider.tsx`

```tsx
// Estado: user: CurrentUser | null, isAuthenticated, isLoading, tenant
// setUser(user), clearUser(), setTenant(tenantId)
// Al montar: useCurrentUser() restaura la sesión si hay cookie válida
// En caso de 401 → clearUser() → redirigir a /login
```

### 4.3 `middleware.ts` — protección server-side

```ts
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/select-tenant'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get('access_token');

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (hasSession) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

> El rol fino se valida en el layout `(dashboard)` con el `AppShell` (Sprint 02) y con guards por segmento (ej: `/tenants` solo superadmin).

### 4.4 `lib/auth/guards.ts`

```ts
import { ROLES, type Roles } from '@repo/common';

export const requireRole = (userRole: Roles | undefined, allowed: Roles[]): boolean =>
  !!userRole && allowed.includes(userRole);

export const isRouteAllowed = (userRole: Roles, pathname: string): boolean => {
  // tabla de permisos (misma que la matriz del README)
};
```

---

## 5. Tareas por día

### Día 1: Contrato + hooks base
- [ ] Verificar `auth.schema.ts` y tipos `auth/*` de `@repo/common`
- [ ] `use-login.ts`, `use-select-tenant.ts`, `use-logout.ts`
- [ ] `use-current-user.ts`

### Día 2–3: UI de autenticación
- [ ] `AuthLayout`, `LoginForm` (RHF + zod), `PasswordInput`
- [ ] `TenantSelector` con badge de rol
- [ ] Estilos de error/invalidación en el form

### Día 4: AuthContext y restauración de sesión
- [ ] Implementar `AuthProvider` real (estado + restauración vía `useCurrentUser`)
- [ ] Manejar 401 en restauración (cookie expirada → `/login`)
- [ ] Store ligera para `tenants` (post-login)

### Día 5: Páginas
- [ ] `/login` y `/select-tenant` bajo `(auth)/`
- [ ] Redirect inteligente: `?redirect=` de vuelta tras login

### Día 6: Middleware y guards
- [ ] `middleware.ts` (rutas públicas vs protegidas)
- [ ] `guards.ts` con la tabla de permisos del README
- [ ] Guard del layout `(dashboard)` (bloquea rol no permitido)

### Día 7: Verificación
- [ ] Flujo completo: login → selector (2 tenants) → dashboard → recarga → sesión restaurada → logout
- [ ] Flujo superadmin: login directo sin selector
- [ ] Test del middleware (rutas públicas/protegidas)
- [ ] `biome check` + `tsc --noEmit` en verde

---

## 6. Criterios de aceptación

- [ ] Login de 2 pasos funciona con tenant selector cuando hay >1 tenant
- [ ] `SUPERADMIN` entra directo al dashboard sin selector
- [ ] La sesión se restaura al recargar usando `GET /users/me`
- [ ] Logout limpia estado y cookies, y redirige a `/login`
- [ ] Rutas protegidas redirigen a `/login?redirect=...` sin sesión
- [ ] Usuario autenticado que entra a `/login` es redirigido a `/dashboard`
- [ ] El layout `(dashboard)` rechaza roles no permitidos con 403
- [ ] `apps/client` no importa axios ni react-query

---

**Siguiente sprint →** [Sprint 02: App Shell y Navegación por Rol](./sprint-02-app-shell-navigation.md)
