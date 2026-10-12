# Feature: site-landing

## Objective
Split marketing from the product demo. A new `apps/site` (Next.js) holds the public landing and is deployed on Vercel. `apps/demo` keeps only the interactive demo (local data, no backend): its landing is removed and its root becomes the demo entry (role picker).

## Problem
- `apps/demo` mixes a full landing (`src/app/page.tsx`, ~730 lines: hero, features, comparison, how it works, role picker `#demo-roles`) with the demo app (`(dashboard)/*`, local store in `src/lib/store`).
- It is not deployed anywhere (no CD, compose or Caddy references; `next.config` `output: 'standalone'`).
- The landing content predates the current business model (shared multi vs dedicated single with school branding), the mobile app, and the Vir-ttend brand (logo 01, navy `#14213D` + lime `#C6F432`).

## Decisions (user)
- Landings go to Vercel. No own domain yet, so it uses `*.vercel.app` for now; a domain (e.g. `vir-ttend.app`) comes later with the domain map: landing at the root, `app.` for the shared instance, per-school domains for single instances.
- Remove the landing from the demo and build it in the site. Do it optimally and commit.

## Scope
- `apps/site`: landing (hero, features, how it works, plans: shared vs dedicated, mobile app with offline support, FAQ, contact, privacy policy), Vir-ttend branding via `@repo/branding`, SEO metadata, Vercel-ready config (pnpm monorepo build) and README with deploy steps. The demo link comes from env (`NEXT_PUBLIC_DEMO_URL`), with a sensible default.
- `apps/demo`: delete the landing; root = role picker (reuse the existing `#demo-roles` logic) plus a link back to the site (`NEXT_PUBLIC_SITE_URL`); keep FAQ in the site, not in the demo; make sure the demo builds and still works.

## Out of scope
- Buying or configuring a domain; Vercel account/project creation (done by the user).
- Contact form backend (mailto or an env-configurable external endpoint only).
- Updating the demo seed data to the latest product features.

## Constraints
- Branch `feat/site-landing` from `feat/instance-branding`, because the site uses `@repo/branding`.
- Spanish UI copy (neutral/professional for marketing); code in English.
- Privacy policy text is a draft and must be reviewed by a lawyer (Ley 25.326, minors' data).

## TDD
- Mode: off (no project/session TDD config). Checks are `ts:check`, `build` and biome for site and demo; existing demo vitest tests must keep passing.

## Delivery
- Commit only (no push requested).

## Tasks
- [ ] **S1 — `apps/site` landing**, Vercel-ready.
- [ ] **S2 — `apps/demo` without landing** (root = role picker, links to the site).

## Route log
| Task | Route | Trigger evidence |
|------|-------|------------------|
| S1+S2 | delegated direct (one writer, two commits) | new app (10+ files) + demo pages/config |

## Next step
- S1 + S2 (delegated writer).
