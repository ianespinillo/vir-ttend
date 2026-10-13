# Feature: mobile-build-variants

## Objective
Ship two mobile apps from the same codebase. The general multi-tenant app targets the shared server. A dedicated app for "Escuela de Educación Secundaria Técnica Nº3 \"Eva Perón\"" targets its own server at `https://eest3-virttend.duckdns.org/api`. The tenancy mode comes from the server deployment config, never from a user setting.

## Problem
- The mobile Settings screen lets the user pick single vs multi tenancy and edit the app name, stored in SecureStore (`app-config.ts`). It overrides deployment config.
- The server already enforces the mode: `TENANCY_MODE` in the VM `.env` is checked by the login handler, the tenant middleware and the guard. It also exposes `GET /config/public` (`{tenancyMode, tenantName, tenantSlug, tenantId, allowSuperadmin}`), which the web already consumes through `usePublicConfig`.
- There is no mobile build/distribution config: `app.json` is static, with no `eas.json` and no `app.config.*`. The API URL falls back to localhost.

## Decisions (user)
- At first there is a single general app. Schools that want their own server get their own app, so two builds from one codebase.
- EEST3 server domain: `eest3-virttend.duckdns.org`, so the API is `https://eest3-virttend.duckdns.org/api`. Caddy serves the API on the same origin under `/api`.

## Scope
- Mobile build variants (`app.config.ts` + `eas.json`): name, icon, bundle/package id, API URL per variant.
- Mobile tenancy and school name come from `GET /config/public`, cached for offline use, with a fallback to the membership-based auto-select.
- Settings becomes informational: school, server, mode, version, logout. The tenancy selector and app-name editing are removed.

## Out of scope / pending
- Shared multi-tenant server deployment (compose + CD environment): its domain is unknown, so the general variant's API URL is a pending value.
- EEST3 icon and splash assets: they reuse the default assets until the school provides a logo.
- Store accounts, signing and publishing.

## Constraints
- Same codebase. No secrets in `EXPO_PUBLIC_*` or the public config.
- Production URLs are https. Dev keeps `EXPO_PUBLIC_API_URL` and the `adb reverse` flow working.
- Artifacts in English; Spanish UI copy.

## TDD
- Mode: off (no project/session TDD config). Mobile has no test runner, so the checks are `ts:check` and biome.

## Delivery
- Branch `feat/mobile-build-variants` (from `feat/mobile-app`). Forecast ~500 authored lines. Strategy `ask-on-risk`; PR target `dev` after the mobile-app chain.

## Tasks
- [x] **V1 — Build variants.** (commit `4aad206`)
  - Convert `app.json` to `app.config.ts`, driven by `APP_VARIANT` (`general` | `eest3`, default `general`), with per-variant name, slug, scheme, `ios.bundleIdentifier` / `android.package`, icon and `extra.apiUrl`.
  - Add `eas.json` with development, preview and production profiles per variant, setting `APP_VARIANT` and `EXPO_PUBLIC_API_URL`.
  - Resolve the API URL in this order: `EXPO_PUBLIC_API_URL`, then the variant `extra.apiUrl`, then the localhost dev fallback.
  - Docs in `apps/mobile/README.md`.
- [x] **V2 — Server-driven tenancy.** (commit `f96f056`)
  - Fetch and cache `GET /config/public` (AsyncStorage, per server URL) on startup and before login.
  - The auth flow uses the server `tenancyMode`/`tenantId`, falling back to the cached value, then to membership auto-select.
  - Remove `saveTenancyMode` and app-name editing.
  - Settings becomes informational.
  - Login shows the school name from the config.

## Route log
| Task | Route | Trigger evidence |
|------|-------|------------------|
| V1+V2 | delegated direct (one writer, two commits) | app config, eas, config service, auth context, settings, login: 2+ non-trivial files |

## Progress / evidence
- Exploration done: `GET /config/public` exists (`public-config.controller.ts`); the web uses it; the deploy is one VM per school with `TENANCY_MODE: single` in `compose.prod.yml`.

- **Checks:** ts:check, biome and turbo ts:check pass; `expo config` verified for both variants; expo-doctor shows no new failures.
- **Review:** high, 1041 lines → granted → approved and acknowledged, lineage `review-bf2ba29dbba6ddd5`, boundary `f96f056`.
- **Advisory fixes in `2cc23e7`:**
  - (R4-001) Release EAS profiles without an API URL now fail at config time instead of shipping a localhost build. Verified: `production-general` throws and `production-eest3` resolves its URL.
  - (R3-003) The date-param fallback picks the closest selectable day up to today.
- **Follow-ups:**
  - (R2-001) The variant union is duplicated in `app.config.ts` and `app-config.ts`.
  - (R3-001) No tests for tenant selection.
  - (R3-002) Without a fresh or cached config, login falls back to membership selection; the server still enforces the mode.
  - `.env.example` / `.env.local` may still list obsolete `EXPO_PUBLIC_TENANCY_MODE`, `EXPO_PUBLIC_APP_NAME` and `EXPO_PUBLIC_DEFAULT_TENANT_*` (now ignored).
  - EAS projectId missing (`eas init`).
  - The general server domain is pending.
  - The EEST3 logo is missing.

## Next step
- Deploy the shared multi-tenant server when its domain is decided; then set the `*-general` profile URL.
- `eas init` plus first preview APK of the eest3 variant.
