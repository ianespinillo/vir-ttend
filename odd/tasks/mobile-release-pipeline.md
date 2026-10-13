# Feature: Mobile release pipeline — APK automático a GitHub Releases

## Objetivo
Automatizar el build del APK de cada variante mobile con EAS y publicarlo en un GitHub Release con nombre de asset fijo, para que el site lo referencie con una URL estable (`releases/latest/download/virttend-<variant>.apk`) sin redeploy.

## Por qué
Pedido del usuario (2026-10-12): "se puede automatizar todo en un pipeline" → "si, sumale la main, y referencialos en el site". El CD existente (`cd.yaml`) solo despliega api/client a la VM; la mobile no tenía distribución.

## Alcance autorizado
- Rama `feat/mobile-release-pipeline` desde `dev`.
- Disparadores: tag `mobile-v*`, push a `main` (filtrado por paths de mobile/packages), `workflow_dispatch`.
- Solo APK (perfiles `preview-*`). Stores (Play/App Store) fuera de alcance.
- Variantes: solo `eest3` (la `general` no tiene API URL y su build release falla a propósito).
- Site: `apkUrl` de eest3 apunta al asset del último release.
- Commit local sí; push/PR = decisión del usuario.

## Diseño
- D1: `.github/workflows/mobile-release.yaml`: job `build` (matriz por variante) corre `eas build --non-interactive --wait --json` en la nube de EAS, descarga el APK y lo sube como artifact; job `release` crea el GitHub Release con todos los APK.
- D2: tag del release = el tag `mobile-v*` empujado, o `mobile-build-<run_number>` para push a main / dispatch.
- D3: `autoIncrement` en los perfiles `preview-*` para que cada APK tenga un `versionCode` mayor (fuente remota de versión ya configurada).
- D4: site: helper `latestApkUrl(variant)` en `mobile-apps.ts`.
- D5: docs: sección en `docs/ci-cd.md` + `apps/mobile/README.md` con el setup manual único (eas init, primer build interactivo para el keystore, secret `EXPO_TOKEN`).

## Checklist
- [x] T0: feature doc + mirror Engram
- [x] T1: workflow + eas.json + site + docs
- [x] T2: verificación (parse YAML, ts:check del site, lint) + commit (ver Entrega)
- [ ] T3: entrega — push/PR pendiente de aprobación; setup manual único pendiente del usuario (eas init + projectId, primer build interactivo, secret `EXPO_TOKEN`)

## Ruta
- Inline: un solo archivo no trivial (workflow); el resto son ediciones mecánicas.

## TDD
- Off (no hay configuración de TDD en el proyecto; el site no tiene tests). Checks funcionales: parse YAML, `pnpm --filter site ts:check`, `pnpm lint:check`.

## Checks
- Parse YAML (`js-yaml`): OK.
- `actionlint` v1.7.7: exit 0 (tras subir checkout/setup-node a v4; v3 marcado como runtime obsoleto).
- `eas.json` JSON.parse: OK.
- `pnpm --filter site ts:check`: OK.
- `biome check` sobre `mobile-apps.ts` y `eas.json`: sin issues.
- RDD on: `review assess` → risk **high** (`shell_source`). La review nativa rechazó la declaración de untracked (`invalid_request`), así que se aplicó el camino RDD-off tier high con un verificador independiente → **PASS** (0 blocker). 1 MAJOR: si se mergea a main antes del setup manual, el primer run falla. MINOR: concurrency puede descartar un run de tag pendiente, `eas-cli@latest` sin pin, falta `cache: pnpm`. Ninguno se aplicó; quedan a decisión del usuario.
- No verificable localmente: ejecución real del workflow (requiere `EXPO_TOKEN`, projectId y keystore).

## Riesgo conocido
- Hasta el primer release, el botón APK de `/descargar/eest3` da 404. No mergear a `main` antes de completar el setup manual.
