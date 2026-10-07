# ODD — Demo App de Ventas (`apps/demo`)

**Feature:** demo-app
**Branch:** `feat/demo-app`
**Fecha:** 2026-09-24
**Referencia de diseño:** `docs/demo/2026-09-24-demo-app-design.md`
**Referencia de datos:** `docs/demo/demo-data-seeds-plan.md`

## Objetivo

App autocontenida dentro del monorepo (`apps/demo`) para demo de ventas: clientes prospecto prueban los flujos y CRUDs del MVP con datos sembrados, **sin DB, sin red, sin infraestructura**. Reutiliza la UI real (`packages/ui`), el contrato (`@repo/common`) y el shell (`DashboardLayout` + `isPathAllowedForRole`). Visual-first, store-driven.

## Problema

La demo actual requiere Postgres + Redis (compose) y no es "abrir y que funcione". Los clientes no pueden probar el producto de forma estable.

## Por qué

Vender mostrando el producto real con datos deterministas: "Entrar como...", role switcher, botón "Reset demo". La fidelidad del backend no es el objetivo; la experiencia visual sí.

## Scope

- ✅ Crear `apps/demo` (Next.js App Router, pnpm workspace, turbo).
- ✅ Capa de datos local: seed determinista + store en memoria + localStorage versionado + reset.
- ✅ Sesión demo ("Entrar como...", role switcher) + shell con `DashboardLayout`.
- ✅ Páginas por rol: dashboard, students, courses, subjects, attendance, alerts, announcements, reports, users, tenants, me.
- ✅ Tests: store (determinismo/mutaciones/reset) + smoke por página.
- ❌ Fuera de alcance: módulo `events` (sin rutas públicas en `@repo/common`), Redis, seeder de DB, capa de red, seguridad real.

## Constraints

- Sin `packages/hooks`, sin axios, sin route handlers de API.
- No modificar `apps/api`, `apps/client`, `packages/ui`, `packages/common`.
- IDs fijos en el seed → determinismo reproducible.
- Persistencia bajo clave `virttend-demo-state:v1`.
- Código en inglés; copy de UI en español (convención del producto).
- Commits Conventional Commit, uno por work unit, en `feat/demo-app`.

## TDD

Modo: **estándar** (no hay declaración de strict TDD en el proyecto; tests obligatorios por work unit con el runner del repo). Runner: **vitest ^2.1.9** (convención del repo: `packages/common`, `packages/ui`, `packages/hooks` usan `vitest run` con `vitest.config.ts`; el demo replica el patrón). Smoke por página en los batches.

## Delivery

- Forecast de líneas: **> 1200** (app completa) → aplica `chained-pr`.
- Estrategia: `ask-on-risk` — al momento de crear PRs se pregunta estrategia de cadena (`stacked-to-main` / `feature-branch-chain`). No bloquea la implementación; push/PR son decisión del usuario.
- RDD: **OFF** — desactivado por el usuario el 2026-09-24 (scope global; motivo: sin LLM premium, "omitir siempre este check"). NO correr assess/review; delivery bajo política ordinaria del repo.

## Checklist

| ID | Tarea | Estado | Evidencia |
|----|-------|--------|-----------|
| T1 | Scaffold `apps/demo` (configs + layout raíz + build verde) | ✅ done | `apps/demo` creado (configs + layout/page raíz); `pnpm --filter demo build` PASS (Next 16.1.6); `pnpm --filter demo ts:check` PASS (exit 0). Commits: `3752eda` (docs) + `83fd0f8` (scaffold). RDD (boundary main, 604 líneas, medium): **declined** por el usuario (candidate-scoped; RDD sigue ON) |
| T2 | Store + seed determinista + persistencia + reset + tests | ✅ done | 72/72 vitest (5 archivos; spot check del orquestador: 72/72); ts:check PASS; build PASS; lint:check limpio tras corrección de 147 `noNonNullAssertion` (sin biome-ignore). Commit: `66396ae`. RDD: usuario deshabilitó reviews global (sin LLM premium) — slice sin revisar, RDD OFF |
| T3 | Sesión demo: landing "Entrar como..." + shell dashboard + role switcher + reset | ✅ done | 82/82 vitest (6 archivos; spot check: 82/82); ts:check PASS; build PASS (fix Turbopack→`--webpack` + `extensionAlias`); lint:check limpio. Commit: `c461988`. Landing `/` con 6 profiles; shell `/dashboard` (guard → Forbidden); switcher + reset; `useDemo()` API estable |
| T4 | Dashboard por rol | ✅ done | 88/88 vitest (7 archivos; spot check: 88/88); ts:check PASS; build PASS (webpack); lint:check limpio. Commit: `ea1bd32`. Superadmin: plataforma; admin/preceptor: métricas (preceptor scopeado a sus cursos); teacher: sus cursos. Fix `getDashboardMetrics.weeklyTrend` respeta `courseIds` (+test). Excepción: teacher puede abrir `/dashboard` en el shell demo (producción intacta) |
| T5 | Students CRUD (list / create / [id] / edit) | ✅ done | 95/95 vitest (8 archivos; spot check: 95/95); ts:check PASS; build PASS (rutas en output); lint:check limpio. Commit: `143def8`. List URL-driven + pagination; create; detail (tab report + modal enroll); edit como ruta `[id]/edit` (dev: producto usa `?edit=true`); sin sort (seed order preserva edge cases); sin loading branches (store sync). Devs: `student-mappings.ts` + 7 tests |
| T6 | Academic: courses + subjects | ✅ done | Courses (list, detail, create) + Subjects (list, dialog create/edit). Scoping por rol en `academic-mappings.ts` (12 tests vitest). Commit: `d5675f9` |
| T7 | Attendance: daily + subject + justifications + copy | ✅ done | Asistencia diaria y por materia con justificaciones y copiado de fechas. Mappings y tests vitest dedicados (20 tests). Commit: `8ffac51` |
| T8 | Alerts | ✅ done | Bandeja de alertas con paginación, navegación a estudiantes y marca de lectura sobre el store. Commit: `66313b1` |
| T9 | Announcements | ✅ done | Módulo de comunicados: listado con filtros, creación con audiencia, detalle, edición y publicación. Commit: `10c517e` |
| T10 | Reports (monthly + export) | ✅ done | Reporte mensual con selección de período, métricas, tabla de alumnos, tendencias y exportación simulada. Commit: `fd34a10` |
| T11 | Admin: users + tenants | ✅ done | Gestión completa de usuarios (alta, roles, activación, reseteo) y gestión de instituciones para superadmin. Commit: `7b6d3df` |
| T12 | Profile (`/me`) | ✅ done | Vista de perfil con información personal, institución y cambio de contraseña interactivo. Commit: `fd643a2` |
| T13 | Integración: smoke restantes, build/ts:check full, guía de corrida | ✅ done | Suite de integración e2e (`smoke.test.ts`, 138/138 vitest PASS en 11 archivos), build verde con 21 rutas compiladas, `apps/demo/README.md` documentado |

## Rutas por tarea (trigger de delegación)

| ID | Ruta | Trigger |
|----|------|---------|
| T1 | delegado (writer `general`) | 4+ archivos de config para entender + 6+ writes |
| T2 | delegado (writer `general`) | contrato de componentes + seed + varios writes |
| T3+ | delegado (writer `general`) por batch de página | lectura de contratos + 1-3 writes por página |

## Notas del entorno (Windows / hooks)

- `core.autocrlf=true` y sin `.gitattributes` → el working tree de archivos de `packages/*` se chequea con CRLF y `biome check .` (hook pre-commit) los marca como error en **cualquier** commit. Solución validada: `pnpm lint:fix` (normaliza working tree a LF) antes de commitear; `lint:check` vuelve a pasar. Git no registra diff (blobs ya son LF); el status ` M` residual es ruido de stat-cache que `git add` resuelve como no-op.
- Ya se corrigió una vez; si el hook vuelve a fallar con `␍`, repetir `pnpm lint:fix`.

## Próximo paso

Todas las tareas de la demo app (T1 a T13) han sido completadas, probadas y verificadas con build de producción verde. Listo para demo o feedback del usuario.