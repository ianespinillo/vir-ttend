# ODD — Demo App de Ventas (`apps/demo`)

**Feature:** demo-app
**Branch:** `feat/demo-app`
**Fecha:** 2026-09-24
**Referencia de diseño:** `doc/planning/2026-09-24-demo-app-design.md`
**Referencia de datos:** `doc/planning/demo-data-seeds-plan.md`

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

Modo: **estándar** (no hay declaración de strict TDD en el proyecto; tests obligatorios por work unit con el runner del repo). Runner: jest para el store (se confirma en T1 según convención de frontend del repo); smoke por página en los batches.

## Delivery

- Forecast de líneas: **> 1200** (app completa) → aplica `chained-pr`.
- Estrategia: `ask-on-risk` — al momento de crear PRs se pregunta estrategia de cadena (`stacked-to-main` / `feature-branch-chain`). No bloquea la implementación; push/PR son decisión del usuario.
- RDD: **ON** (global) → tras cada work-unit commit: `gentle-ai review assess --cwd <repo> --agent opencode --base-ref <boundary> --committed-only --json` y seguir transiciones.

## Checklist

| ID | Tarea | Estado | Evidencia |
|----|-------|--------|-----------|
| T1 | Scaffold `apps/demo` (configs + layout raíz + build verde) | pendiente | |
| T2 | Store + seed determinista + persistencia + reset + tests | pendiente | |
| T3 | Sesión demo: landing "Entrar como..." + shell dashboard + role switcher + reset | pendiente | |
| T4 | Dashboard por rol | pendiente | |
| T5 | Students CRUD (list / create / [id] / edit) | pendiente | |
| T6 | Academic: courses + subjects | pendiente | |
| T7 | Attendance: daily + subject + justifications + copy | pendiente | |
| T8 | Alerts | pendiente | |
| T9 | Announcements | pendiente | |
| T10 | Reports (monthly + export) | pendiente | |
| T11 | Admin: users + tenants | pendiente | |
| T12 | Profile (`/me`) | pendiente | |
| T13 | Integración: smoke restantes, build/ts:check full, guía de corrida | pendiente | |

## Rutas por tarea (trigger de delegación)

| ID | Ruta | Trigger |
|----|------|---------|
| T1 | delegado (writer `general`) | 4+ archivos de config para entender + 6+ writes |
| T2 | delegado (writer `general`) | contrato de componentes + seed + varios writes |
| T3+ | delegado (writer `general`) por batch de página | lectura de contratos + 1-3 writes por página |

## Próximo paso

T1 — Scaffold de `apps/demo`.