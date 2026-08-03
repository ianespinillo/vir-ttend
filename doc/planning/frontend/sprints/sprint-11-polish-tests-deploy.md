# Sprint 11 — Polish, Tests y Deploy

> **Objetivo:** Cerrar el frontend: estados de UI en todas las páginas, responsive, tests, performance, QA integral y build de producción.
> **Duración:** 1 semana · **Estimación:** 35 h · **Dependencias:** Sprints 03–10

---

## Decisiones de diseño

**Estados de UI como estándar:** toda feature usa los componentes `shared` de Sprint 00 (`LoadingState`, `ErrorState`, `EmptyState`) y los estados de `AsyncBoundary`. No se inventan skeletons ad-hoc por página.

**Tests con Vitest + React Testing Library** (tooling de Sprint 00). Cobertura priorizada: hooks de auth y interceptor de refresh, guards de rol, forms (zod), y los flujos críticos de asistencia.

**Accesibilidad:** focus visible, labels en todos los inputs, aria en el sidebar/topbar, contraste de los badges de estado. Se verifica con axe en las 5 páginas críticas.

**Performance:** `next/font` ya aplicado (Sprint 00); se audita con Lighthouse y se resuelven regresiones. TanStack Query ya evita fetching redundante.

**CI:** workflow que corre `biome check`, `tsc --noEmit`, tests y `pnpm build` en PR.

---

## Resumen de horas

| Área | Horas |
|---|---|
| Estados de UI y resposive | 10 |
| Tests | 12 |
| Accesibilidad y performance | 6 |
| QA integral + deploy | 7 |
| **Total** | **35** |

---

## 1. Estados de UI (por página)

- [ ] Auditoría página a página: todo fetch tiene `LoadingState`/skeleton y `ErrorState` con retry
- [ ] `EmptyState` en listados sin datos (estudiantes, alertas, comunicados, reportes)
- [ ] Unificación: si existe el componente shared, se usa; no skeletons ad-hoc

---

## 2. Tests

```
packages/hooks/src/lib/__tests__/
├── axios-client.test.ts     # interceptor 401 → refresh → retry; sin refresh → logout
packages/hooks/src/features/auth/__tests__/
├── use-login.test.tsx
├── use-current-user.test.tsx
apps/client/src/lib/auth/__tests__/
├── guards.test.ts           # matriz de permisos por rol/ruta
├── middleware.test.ts       # públicas vs protegidas
apps/client/src/app/(auth)/login/__tests__/
└── login-form.test.tsx      # validación zod + submit
packages/ui/src/components/features/attendance/__tests__/
└── attendance-grid.test.tsx # optimistic update + rollback
```

---

## 3. Responsive

- [ ] Sidebar colapsable (iconos) en <lg (Sprint 02 lo dejó listo; auditar breakpoints)
- [ ] Tablas con scroll horizontal en móvil (DataTable ya lo soporta)
- [ ] Grilla de asistencia usable en tablet

---

## 4. Accesibilidad y performance

- [ ] axe en: login, dashboard, asistencia diaria, reportes, perfil
- [ ] Contrastes de badges (P/A/L/J, semáforo, alertas)
- [ ] Lighthouse ≥ 90 en performance y accessibility (mobile)
- [ ] `next/image` para avatares/logos; sin imágenes no optimizadas

---

## 5. QA integral (checklist por rol)

- [ ] **Superadmin:** tenants, impersonación, usuarios por tenant
- [ ] **Admin:** configuración, cursos, estudiantes, reportes
- [ ] **Preceptor:** asistencia diaria, justificaciones, dashboard, alertas, comunicados
- [ ] **Teacher:** asistencia por materia, copiar clase, reporte de sus materias
- [ ] Flujo de error: API caída → ErrorState + retry en cada página
- [ ] Sesión expirada a mitad de uso → redirect a `/login?redirect=` con estado preservado

---

## 6. Deploy

- [ ] `next.config.mjs`: `output: 'standalone'` (si es Node) o imágenes a CDN (si es Vercel)
- [ ] Variables de entorno documentadas (`.env.example`)
- [ ] CI en verde en la rama main
- [ ] Build de producción verificado localmente: `pnpm build && pnpm start`

---

## 7. Criterios de aceptación

- [ ] Ninguna página muestra error crudo; todas tienen Loading/Error/Empty
- [ ] Todos los tests pasan (`pnpm test`)
- [ ] `biome check` y `tsc --noEmit` en verde en los 4 paquetes
- [ ] Lighthouse ≥ 90 (mobile) en las 5 páginas críticas
- [ ] Flujo completo de cada rol funciona de punta a punta contra la API
- [ ] Build standalone corre sin la carpeta `node_modules` del dev

---

**Fin del roadmap.** Volver al [plan maestro](../README.md).
