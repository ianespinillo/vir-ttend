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
- [x] Task 1 — `@repo/branding` core (`8e62070`)
- [x] Task 2 — adapters `web`, `native`, `marks` (`c0b61a6`; 31 vitest tests, build, ts:check and biome pass. Contrast-fallback test uses `#808080` because the plan's `#8A8A8A` reaches ~4.6:1 against ink.)
- [x] Task 3 — monorepo wiring (`8450a1c`; uses an EAS `postinstall` script instead of `eas-build-post-install`, because `app.config.ts` is evaluated at prebuild. Both Docker images build. Committed with `--no-verify` after an own-file format fix.)
- [x] Task 4 — API branding (`6fd1c65`; commits `deploy/branding/**`; lazy load so dev static assets register before `listen()`; api jest 79 suites / 445 tests pass. Gap: `apps/api/.env.example` is not editable by agents, so `BRANDING_DIR` still needs to be added there.)
- [x] Task 5 — infra (`844f548`; Caddy validate passes and serves `/branding/*` with immutable cache; compose mounts `deploy/branding/${BRANDING_SLUG:-_none}`. Gap: `.env.production.example` is not editable by agents, so `BRANDING_SLUG` still needs to be added there. Note: check `apps/demo` once `@repo/ui` imports `@repo/branding`.)
- [x] Task 6 — `tokens.css` (`0b535dc`; no `@layer base` wrapper so the client can import it standalone; drift test passes)
- [x] Task 7 — brand components (`250eaca`; ui vitest 83 pass)
- [x] Task 8 — client `BrandProvider` + `icon.svg` (`8f26418`; client and demo builds pass. Manual browser checks pending on the user.)
- [ ] Task 9 — mobile theming plumbing + `vars()` spike (needs a manual device check by the user)
- [ ] Task 10 — mobile: migrate the 13 indigo files + logo + "con vir-ttend"
- [ ] Task 11 — mobile variants with assets + fallback branding
- [ ] Task 12 — end-to-end verification + docs close

## Route log
| Task | Route | Trigger evidence |
|------|-------|------------------|
| 1+2 | delegated direct (one writer, two commits) | new package, 15+ files |
| 3–5 | delegated direct (one writer, three commits) | 5 package.json + Dockerfiles + API module/tests + infra/docs |
| 6–8 | delegated direct (one writer, three commits) | ui tokens/components/tests + hooks + client |

## Progress / evidence
- Assets present in the working tree (uncommitted, added with the spec): `apps/mobile/assets/{brand,variants}/`, `deploy/branding/{eest3,virttend,_none}/`.

- Review of the Tasks 1–2 slice (with the earlier build-variant fix and docs): medium, 1830 lines → granted → approved and acknowledged, lineage `review-93cdb1230947581f`, boundary `c0b61a6`. The first capture was refused (reviewer cited an out-of-repo path), then re-offered and approved. The untracked assets were stashed during review and restored.
- Deviation: `deploy/branding/**` is committed in Task 4, not Task 5, because the Task 1 schema test already reads `deploy/branding/eest3/branding.json` (R3-001).

- Tasks 3–5 review: approved (`review-568823cea640f8e1`). Advisory fixes in `de0bcb7`: Caddy caches only `?v=` assets as immutable; the API spec is isolated from the ambient `BRANDING_DIR`.
- Tasks 6–8 review: high → approved (`review-441aeb5f1354b88a`, boundary `8f26418`). Advisory fixes in the next commit:
  - The crest `onError` falls back to the seal.
  - `document.title` is only replaced when it is the default or the title the provider set last.
  - The spec env cleanup moved into try/finally.

## Next step
- Tasks 9–11 (mobile). Task 9 needs a manual device spike by the user.
