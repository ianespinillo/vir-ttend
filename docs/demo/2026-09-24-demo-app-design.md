# Design Doc — Aplicación Demo para Ventas (`apps/demo`)

**Versión:** 1.0
**Fecha:** 2026-09-24
**Estado:** Aprobado en brainstorming — pendiente de review del usuario y plan de implementación.
**Objetivo:** App autocontenida dentro del monorepo para demo de ventas: personas no técnicas (clientes prospecto) prueban los flujos y CRUDs del MVP con datos sembrados, **sin base de datos, sin red, sin infraestructura**.

---

## 1. Contexto y decisión de enfoque

Vir-ttend es un monorepo pnpm con:

- `apps/api` — backend NestJS + MikroORM + PostgreSQL + Redis (módulos: identity, academic, attendance, events, reporting, health, shared).
- `apps/client` — frontend Next.js App Router.
- `packages/ui` — **toda la UI del producto ya extraída como feature components reutilizables** (dashboard, students, users, tenants, academic, subjects, schedule, attendance, alerts, announcements, reports, profile, auth) + sistema de diseño shadcn + `DashboardLayout` + Toaster + iconos.
- `packages/hooks` — hooks react-query sobre `apiClient` (axios, `baseURL` desde `NEXT_PUBLIC_API_URL`).
- `packages/common` — contrato central: rutas, DTOs, tipos, `ROLES`, `isPathAllowedForRole`.

### Decisión de enfoque

- **No se administra ninguna base de datos en la demo** (ni Postgres, ni SQLite, ni Redis, ni seeder de DB).
- **No hay capa de red** en la demo: no axios, no route handlers de API, no servidor mock.
- La demo es **visual-first**: muestra la UI real del producto (los mismos componentes de `packages/ui`) alimentada por un **store local tipado** (memoria + localStorage).
- La app vive en `apps/demo` dentro del monorepo para reutilizar `packages/ui`, `packages/common` y la configuración del workspace.

Esta decisión descarta deliberadamente ejecutar el stack real local con el seeder de `demo-data-seeds-plan.md`: para una demo de ventas, el determinismo y la estabilidad pesan más que la fidelidad del backend. El producto demo **se siente y se ve idéntico** porque usa los mismos componentes; la lógica de negocio es una réplica delgada y controlada.

---

## 2. Arquitectura

```
apps/demo/
  package.json            # name: "demo", deps: next, react, @repo/ui, @repo/common
  next.config.mjs
  tsconfig.json
  tailwind.config.ts      # hereda la config de packages/ui
  src/
    app/
      layout.tsx          # raíz: DemoProvider (contexto global) + Toaster
      page.tsx            # landing "Entrar como..." — selector de rol demo
      (dashboard)/
        layout.tsx        # shell: DashboardLayout real alimentado por la sesión demo
        dashboard/page.tsx
        students/page.tsx
        students/create/page.tsx
        students/[id]/page.tsx
        courses/page.tsx
        subjects/page.tsx
        attendance/page.tsx
        alerts/page.tsx
        announcements/page.tsx
        reports/page.tsx
        users/page.tsx
        tenants/page.tsx
        me/page.tsx
    lib/
      demo-provider.tsx   # Contexto React: sesión + store con suscripción
      session.ts          # "Entrar como...", cambio/cierre de sesión demo
      store/
        types.ts          # tipos de dominio (re-export de @repo/common)
        seed-data.ts      # dataset determinista (origen: demo-data-seeds-plan.md)
        store.ts          # estado, mutaciones CRUD, persistencia, reset
        selectors.ts      # consultas tipadas por página
      constants.ts        # versionado de storage, claves
```

### Flujo de datos

```
Página demo → selecciona del store (useSyncExternalStore / context)
            → mutaciones CRUD → store → persistencia localStorage → re-render
```

No hay HTTP. Las páginas demo reemplazan los hooks de red de `@repo/hooks` por **selectores del store local con la misma forma de datos** (ej. `useStudents` → lectura síncrona del store; `isLoading` siempre `false`).

---

## 3. Reutilización (el núcleo del diseño)

| Pieza | Origen | Uso en la demo |
|---|---|---|
| Feature components (todas las pantallas) | `packages/ui/src/components/features/*` | Compuestos directamente por las páginas demo |
| `DashboardLayout` | `packages/ui/src/components/layout` | Shell del área autenticada, con sidebar y nav por rol |
| `isPathAllowedForRole` | `packages/common` | Guard de rutas por rol, idéntico al client real |
| `ROLES` / tipos / DTOs | `packages/common` | Tipado del store y de las props de los componentes |
| Sistema de diseño shadcn (`Button`, `Card`, `Table`, `Dialog`, `Form`, `Chart`…) | `packages/ui/src/ui/*` | Base visual idéntica al producto |
| `Toaster`, iconos lucide | `packages/ui` | Feedback y navegación |

### Adaptaciones puntuales

- Los pocos feature components que dependen de hooks de red internamente (ej. `login-form`) se reemplazan en la demo por su contraparte store-driven, o se omiten si la demo entra por "Entrar como...". Se resuelve componente a componente en implementación.
- Las páginas del client real sirven como **plantilla de wiring** 1:1 (`apps/client/src/app/(dashboard)/**`), cambiando hooks de red por selectores del store.

---

## 4. Sesión demo ("Entrar como...")

- **Landing principal** (`app/page.tsx`): cards por perfil con nombre, rol y tenant:
  - Superadmin — Carlos Ramos (plataforma)
  - Admin — Ana María Gómez (`san-martin`)
  - Preceptor — Roberto López (`san-martin`, primaria)
  - Preceptor — Laura Martínez (`san-martin`, secundaria)
  - Teacher — Javier Pérez (Matemática, `san-martin`)
  - Teacher — Elena Fernández (Historia, `san-martin`)
- Un click fija la sesión demo (usuario + rol + tenant) en el store.
- **Role switcher flotante**: cambiar de rol al instante durante la demo, sin volver a la landing.
- **Botón "Reset demo"**: restaura el estado canónico (limpia localStorage y re-sembra el seed). Es la garantía de estabilidad: nunca se acumula un estado roto de una prueba del prospecto.
- Credenciales del plan de seeds (`Demo1234!`) se muestran como referencia informativa, no es necesario tipearlas.

---

## 5. Capa de datos: seed determinista

Fuente única del dataset: **`docs/demo/demo-data-seeds-plan.md`**. El seed se expresa como módulo TypeScript con **IDs fijos** para que cualquier estado sea reproducible.

### Contenido sembrado

- **Tenants**: `san-martin` (activo, primaria + secundaria), `belgrano` (activo, solo secundaria), `sol-del-sur` (suspendido).
- **Usuarios y membresías**: los 6 perfiles demo con sus roles y tenant.
- **Año académico 2026**: 2026-03-02 → 2026-12-18, umbral de ausencias 15%, 3 tardanzas = 1 inasistencia.
- **Cursos**: `1º Grado A` (turno mañana, primaria, asistencia diaria) y `3º Año A` (turno mañana, secundaria).
- **Materias y horarios** de `3º Año A`: Matemática (Prof. Pérez), Historia (Prof. Fernández), Lengua y Literatura.
- **Estudiantes**: 12 por curso con perfiles intencionados para la demo:
  - Martín Benítez (100% presente), Sofía Rossi (12% → alerta WARNING no vista), Joaquín Díaz (18% → alerta CRITICAL no vista), Lucía Morales (tardanzas frecuentes), Mateo Giménez (justificadas con certificado), Valentina Fernández (primaria regular), Santiago Paz (primaria alerta crítica vista)…
- **Asistencias**: últimos 30 días hábiles sembrados → los gráficos de tendencia muestran curvas reales.
- **Justificaciones**: MEDICAL / FAMILY / SPORTS.
- **Alertas**: WARNING no vista (Sofía), CRITICAL no vista (Joaquín), WARNING vista (Santiago).
- **Comunicados**: 2 publicados (ALL, TEACHERS), 1 por curso, 1 borrador.

### Persistencia y versionado

- Store en memoria como singleton; se persiste a `localStorage` bajo clave versionada **`virttend-demo-state:v1`**.
- Al cargar: si la clave existe y es válida → hidratar; si no → sembrar seed.
- Un cambio de seed futuro incrementa la versión para no chocar con estado viejo.
- "Reset demo": elimina la clave y re-sembra.

---

## 6. Páginas por rol (matriz de cobertura)

Las páginas mapean 1:1 a las rutas del client real. Alcance = módulos con rutas públicas en `@repo/common`.

| Ruta demo | Rol(es) | Componente real reutilizado | CRUDs ejercitados |
|---|---|---|---|
| `/` (landing "Entrar como...") | todos | — (custom) | — |
| `/dashboard` | preceptor / admin / superadmin | `PreceptorDashboard` / `SuperAdminDashboard` (+ gráficos) | métricas, alertas |
| `/students` (+ `create`, `[id]`) | admin, preceptor | `StudentsPage`, `StudentForm`, `StudentDetail`, `StudentFilters` | crear, listar, filtrar, editar, transferir, activar/desactivar |
| `/courses` | admin | `CoursesList`, `CourseForm`, `CourseDetail` | crear, editar, asignar preceptor |
| `/subjects` | admin | `SubjectsList`, `SubjectForm` | crear, editar |
| `/attendance` | preceptor, teacher | `DailyAttendancePage`, `SubjectAttendancePage`, `AttendanceGrid`, `JustificationModal`, `CopyAttendanceModal` | carga diaria, por materia, justificar, copiar |
| `/alerts` | preceptor, admin | `AlertsList`, `AlertItem`, `AlertBadge` | marcar vista, navegar a detalle |
| `/announcements` | admin, teacher, preceptor | `AnnouncementsList`, `AnnouncementForm`, `AnnouncementDetail`, `ForMeList` | crear, publicar, editar, borrador |
| `/reports` | admin, preceptor | `MonthlyReport`, `MonthlyAttendanceTrendChart`, `ExportActions` | generar reporte, exportar |
| `/users` | admin | `UsersPage`, `UserForm`, `ChangeRoleDialog`, `DeactivateUserDialog` | crear usuario, cambiar rol, activar/desactivar |
| `/tenants` | superadmin | `TenantsPage`, `TenantForm`, `TenantUsersTable` | crear tenant, cambiar estado, membresías |
| `/me` | todos | `ProfilePage`, `PasswordForm` | perfil, cambio de contraseña (simulado) |

**Fuera de alcance:** módulo `events` (sin rutas públicas en `@repo/common` — interno/background), Redis, motor real de alertas, seguridad real (la demo simula RBAC visualmente vía `isPathAllowedForRole` y el menú por rol).

---

## 7. Manejo de errores

- Sin errores de red (no hay red).
- Validación de formularios: la proveen los feature components reales (react-hook-form + zod según convención existente).
- Estados vacíos y de error visuales: `EmptyState`, `ErrorState`, `Forbidden` de `@repo/ui` (el guard de rol muestra `Forbidden` si se navega a una ruta no permitida para el rol).

---

## 8. Testing y verificación

- **Unit tests del store** (jest, convención del repositorio): determinismo del seed (IDs fijos, conteos), mutaciones CRUD, persistencia/versionado, reset.
- **Smoke tests por página**: render de cada ruta con su rol, sin errores y con datos sembrados.
- **Verificación visual manual obligatoria al final**: abrir la app y recorrer cada rol mirando la UI — el entregable es visual.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Esfuerzo de wiring considerable (~15-20 páginas) | Trabajo mecánico: las páginas del client real son plantilla 1:1; se implementa por lotes |
| Drift visual vs. producto si `packages/ui` cambia | La demo se actualiza automáticamente al actualizar `packages/ui` (misma dependencia) |
| Algunos feature components usan hooks de red internos | Se adaptan puntualmente en implementación (lista corta, se resuelve una por una) |
| Seed rico = mucho código de datos | Se extrae directamente del plan de seeds existente; se valida con tests de determinismo |

---

## 10. Próximos pasos

1. Review del usuario sobre este doc.
2. Plan de implementación (writing-plans) con lotes por página/módulo.
3. Implementación en `apps/demo` con tests del store y smoke por página.
4. Verificación visual por rol + confirmación con el usuario.