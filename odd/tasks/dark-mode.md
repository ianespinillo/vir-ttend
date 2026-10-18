# Dark mode (web + mobile)
Objective: add a dark theme to the web client and the mobile app without changing the brand palette.
Branch: `feat/dark-mode` · Delivery: ask-on-risk · Test runner: vitest (`@repo/branding`, `@repo/ui`), `tsc --noEmit` for apps.

## Specs
- S1. "sin modificar la paleta (colores principales) implementa el modo oscuro tanto web como mobile": brand `primary` and `accent` keep their exact values in both themes; only neutrals (background, card, text, muted, border) switch.
- S2. User choice (option 2): "Primary intacto en superficies, tinte de la misma escala para texto/íconos". Solid brand surfaces (buttons, badges with `bg-primary`) stay on the brand primary; text, icons, borders and rings that use the primary switch in dark mode to a lighter step of the same brand scale (`primary-200` for ink, `primary-300` for rings). Works with any instance branding.
- S3. Web (`apps/client` + `@repo/ui`): dark theme via the `.dark` class with shadcn tokens; light mode renders exactly as today.
- S4. Mobile (`apps/mobile`): dark theme driven by the color scheme; light mode renders exactly as today.
- S5. Assumption (conventional default, not requested): theme preference "Claro / Oscuro / Sistema", default "Sistema", persisted per device (web `localStorage`, mobile `AsyncStorage`), toggle reachable from the app shell (web header, mobile settings).

## Tasks
- T1 [S1,S2] Branding package: `--primary-ink` light var, dark shadcn vars, native ink var per scheme + tests. Route: inline. Status: done (RED 10 failing → GREEN branding 37/37, ui 181/181).
- T2 [S1-S3,S5] Web: `.dark` tokens rewrite, Tailwind ink mapping, theme provider + no-flash script + toggle, fix hardcoded colors. Route: delegated (parallel unit with T3). Status: done d9aa277 (ui 194/194, ts:check, biome).
- T3 [S1,S2,S4,S5] Mobile: scheme-aware neutral + brand vars, theme colors hook for imperative colors, replace hardcoded colors, settings toggle, `userInterfaceStyle: automatic`. Route: delegated (parallel unit with T2). Status: done 987a31b (+ advisory fix). No mobile test runner: structural + ts:check.

## Log
- L1 (2026-10-18) "vas a branchear y sin modificar la paleta (colores principales) implementa el modo oscuro tanto web como mobile"
- L2 (2026-10-18) User chose option 2 for primary-as-text in dark mode: "la 2".
- L3 Route evidence: T2/T3 have disjoint edit surfaces (apps/client+packages/ui vs apps/mobile) and are each heavy (web ~35 files with tint classes, mobile ~112 hex literals) → Writer trigger (a) parallelism. T1 is the shared foundation, done inline first.
- L4 NativeWind finding: class-qualified `:root` selectors are unsupported on native; manual scheme selection goes through `Appearance.setColorScheme()` ('unspecified' = system). Mobile already injects `--brand-*` with `vars()` in `BrandProvider`, so neutrals go through the same mechanism.
- L5 (2026-10-18) Independent verifier: S1-S5 PASS, no blockers. Light-mode Tailwind diff vs cdebaad = only primary→primary-ink swap (equal values in light). branding 37/37, ui 194/194, ts:check 9/9, biome clean, client build ok. Advisories fixed: mobile login focus border and home card pressed tint. Open: mobile may briefly show the system scheme before AsyncStorage loads; not tested on device/browser. `gentle-ai` CLI unavailable → assessed as high, verifier ran.
- L6 (2026-10-18) User chose single PR with size:exception ("la 2"). Pushed feat/dark-mode; PR #83 to dev: https://github.com/ianespinillo/vir-ttend/pull/83
