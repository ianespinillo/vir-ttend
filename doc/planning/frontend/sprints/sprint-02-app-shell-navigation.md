# Sprint 02 — App Shell y Navegación por Rol

> **Objetivo:** Construir el esqueleto de la app logueada: layout de dashboard con sidebar y topbar que se adaptan al rol del usuario, navegación por rol, home por rol y responsive.
> **Duración:** 1 semana · **Estimación:** 30 h · **Dependencias:** Sprint 01

---

## Decisiones de diseño

**El menú es la única fuente de verdad de lo que un rol puede ver.** Se define un `navConfig` por rol en `@repo/ui` que recibe el rol y devuelve los ítems de navegación. Si una ruta no está en el menú de un rol, no es accesible (reforzado por `middleware` + guards).

**Home por rol** (`(dashboard)/page.tsx`): redirige al primer módulo del rol.

**`Sidebar` ya existe como primitiva shadcn** (`src/ui/sidebar.tsx`, incluye `SidebarProvider`, mobile sheet, etc.). Se compone el `AppSidebar` con datos del rol, sin reimplementar la primitiva.

**Alert badge en el topbar:** placeholder en este sprint; el contador real llega en Sprint 07 (alerts). El slot queda definido.

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — constantes de navegación | 2 |
| `@repo/ui` — layout components | 12 |
| `@repo/hooks` — soporte (profile, tenant) | 3 |
| `apps/client` — layout dashboard, home por rol, guards | 13 |
| **Total** | **30** |

---

## 1. `@repo/common` — constantes de navegación

```
packages/common/src/
├── constants/
│   └── nav.ts        # NAV_CONFIG por rol: { label, href, icon, roles[] }[]
└── routes/
    └── app.routes.ts # APP_ROUTES (rutas del frontend, no de la API)
```

```ts
// app.routes.ts
export const APP_ROUTES = {
  login: '/login',
  selectTenant: '/select-tenant',
  dashboard: '/dashboard',
  students: '/students',
  courses: '/courses',
  attendanceDaily: '/attendance/daily',
  attendanceSubject: '/attendance/subject',
  alerts: '/alerts',
  reports: '/reports',
  announcements: '/announcements',
  tenants: '/tenants',
  users: '/users',
  settings: '/settings',
  profile: '/settings/profile',
} as const;
```

---

## 2. `@repo/ui` — layout components

```
packages/ui/src/components/layout/
├── app-sidebar.tsx            # Compone SidebarProvider + Sidebar primitivas con navConfig(role)
│                              # Props: role: Roles, currentPath, onNavigate
├── nav-group.tsx              # Agrupa items del navConfig por sección
├── nav-item.tsx               # Item con icono + active state (usePathname)
├── topbar.tsx                 # Header: breadcrumb/título + actions slot
│                              # Props: title, actions?: ReactNode (AlertBadge + UserMenu)
├── user-menu.tsx              # Dropdown: nombre, rol badge, perfil, logout
│                              # Props: user: CurrentUser, onLogout
├── dashboard-layout.tsx       # Composición: AppSidebar + Topbar + <main>
│                              # Props: role, user, children
└── index.ts
```

```ts
// app-sidebar.tsx (esquema)
export function AppSidebar({ role, currentPath }: Props) {
  const items = getNavConfig(role); // de @repo/common
  return (
    <Sidebar>
      <SidebarHeader>logo</SidebarHeader>
      <SidebarContent>
        {items.map((group) => <NavGroup key={group.label} group={group} active={currentPath} />)}
      </SidebarContent>
    </Sidebar>
  );
}
```

---

## 3. `@repo/hooks` — soporte

```
packages/hooks/src/features/
├── auth/
│   └── use-current-user.ts    # (Sprint 01) → user para UserMenu y navConfig
└── tenants/
    └── use-tenants.ts         # useQuery → GET /tenants (solo superadmin; sprint 10 lo completa)
```

El `UserMenu` necesita nombre, email y rol: llegan de `useCurrentUser` que consume el `AuthContext` en `apps/client`.

---

## 4. `apps/client` — layout del dashboard

### 4.1 Estructura

```
apps/client/src/app/(dashboard)/
├── layout.tsx              # 'use client'
│                           # user = useCurrentUser(); role = user.role
│                           # si !user → redirigir /login
│                           # si rol no permitido en esta ruta → <Forbidden/>
│                           # <DashboardLayout role user>{children}</DashboardLayout>
├── page.tsx                # home por rol (redirect)
├── loading.tsx
└── error.tsx
```

### 4.2 Home por rol

```tsx
// (dashboard)/page.tsx
const HOME_BY_ROLE = {
  [ROLES.SUPERADMIN]: APP_ROUTES.tenants,
  [ROLES.ADMIN]:      APP_ROUTES.dashboard,
  [ROLES.PRECEPTOR]:  APP_ROUTES.dashboard,
  [ROLES.TEACHER]:    APP_ROUTES.attendanceSubject,
} as const;

export default function DashboardHome() {
  const { user } = useAuth();
  return <Redirect to={HOME_BY_ROLE[user.role]} />;
}
```

### 4.3 Guard de ruta en el layout

```tsx
if (!requireRole(user.role, allowedRolesForPathname(pathname))) {
  return <Forbidden />; // componente shared en @repo/ui
}
```

### 4.4 Sidebar config por rol (referencia)

```
SUPERADMIN: Tenants, Usuarios, Comunicados, Perfil
ADMIN:      Dashboard, Cursos, Estudiantes, Asistencia, Alertas, Reportes, Comunicados, Usuarios, Perfil
PRECEPTOR:  Panel Preceptoría, Asistencia Diaria, Asistencia por Materia, Cursos (asignados), Estudiantes, Alertas, Reportes, Comunicados, Perfil
TEACHER:    Mis Materias, Asistencia por Materia, Comunicados, Perfil
```

---

## 5. Tareas por día

### Día 1: Contrato
- [ ] `nav.ts` + `app.routes.ts` en `@repo/common`
- [ ] `getNavConfig(role)` con los 4 roles

### Día 2–3: Layout components
- [ ] `NavGroup`, `NavItem` (active state)
- [ ] `AppSidebar` (usa primitiva shadcn Sidebar)
- [ ] `Topbar`, `UserMenu` (dropdown, logout)

### Día 4: DashboardLayout
- [ ] `DashboardLayout` (sidebar + topbar + main)
- [ ] Responsive: sidebar → sheet en mobile (ya soportado por la primitiva)

### Día 5–6: Página de dashboard y guards
- [ ] `(dashboard)/layout.tsx` con guards de rol
- [ ] `page.tsx` home por rol (redirect)
- [ ] `Forbidden`/`NotFound` en `@repo/ui` shared
- [ ] Conectar logout del `UserMenu` → `useLogout`

### Día 7: Verificación
- [ ] Login como cada rol → menú correcto, home correcto
- [ ] Ruta prohibida → 403 (Forbidden)
- [ ] Mobile: sidebar colapsable/sheet
- [ ] `biome check` + `tsc --noEmit` en verde

---

## 6. Criterios de aceptación

- [ ] El menú difiere por rol y no muestra items sin permiso
- [ ] El home redirige según rol
- [ ] El layout `(dashboard)` rechaza rutas no permitidas para el rol
- [ ] `UserMenu` muestra nombre, email y rol, y permite logout
- [ ] Responsive: sidebar usable en mobile
- [ ] `navConfig` y `APP_ROUTES` viven en `@repo/common`
- [ ] `apps/client` no contiene la definición del menú (solo lo consume)

---

**Siguiente sprint →** [Sprint 03: Estudiantes](./sprint-03-students.md)
