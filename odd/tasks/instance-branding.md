# Feature: instance-branding

## Objective
Make branding instance data rather than code. Multi instances always show Vir-ttend (logo "monograma check", navy `#14213D` + lime `#C6F432`). Single instances show the school identity (name, crest, colors) plus a fixed "con vir-ttend" seal. All branding logic lives in a new `@repo/branding` package.

## Source of truth
- Spec: `docs/superpowers/specs/2026-10-12-instance-branding-design.md` (facts F1–F14, decisions D1–D11, acceptance criteria 1–8).
- Plan: `docs/superpowers/plans/2026-10-12-instance-branding.md` (Tasks 1–12, with verification commands and commit messages). This document tracks progress and does not duplicate the plan steps.

## Deviations from the plan
- **Branch base:** `feat/instance-branding` is created from `feat/mobile-build-variants`, not from `main`. The spec relies on mobile code (F3, F4: `/config/public` cache, `app.config.ts` variants) that only exists on that chain (PRs #36–#45 → `dev`).
- **Commit hooks:** they run normally. `--no-verify` (allowed by the plan) is used only if the hook fails for unrelated CRLF/biome reasons, and that is recorded here.

## TDD
- Mode: off (no project/session TDD config). The plan's tests are written as ordinary checks.
- Runners: `@repo/branding` vitest; `@repo/ui` vitest; api jest. Mobile has no runner, so its checks are `ts:check` and expo-doctor.

## Delivery
- Forecast is well above 400 lines (12 tasks). Strategy `ask-on-risk`; chain strategy to be decided at PR time (target `dev`, after #45).

## Tasks (plan numbering)
- [ ] Task 1 — `@repo/branding` core
- [ ] Task 2 — adapters `web`, `native`, `marks`
- [ ] Task 3 — monorepo wiring (deps, Dockerfiles, Next, EAS)
- [ ] Task 4 — API `BrandingModule` + `branding` in `/config/public`
- [ ] Task 5 — production infra (Caddy, compose, docs)
- [ ] Task 6 — `@repo/ui` `tokens.css` single source + drift test
- [ ] Task 7 — `@repo/ui` / `@repo/hooks` brand components + logo replacement
- [ ] Task 8 — client mounts `BrandProvider`
- [ ] Task 9 — mobile theming plumbing + `vars()` spike (needs a manual device check by the user)
- [ ] Task 10 — mobile: migrate the 13 indigo files + logo + "con vir-ttend"
- [ ] Task 11 — mobile variants with assets + fallback branding
- [ ] Task 12 — end-to-end verification + docs close

## Route log
| Task | Route | Trigger evidence |
|------|-------|------------------|
| 1+2 | delegated direct (one writer, two commits) | new package, 15+ files |

## Progress / evidence
- Assets present in the working tree (uncommitted, added with the spec): `apps/mobile/assets/{brand,variants}/`, `deploy/branding/{eest3,virttend,_none}/`.

## Next step
- Tasks 1+2 (delegated writer).
