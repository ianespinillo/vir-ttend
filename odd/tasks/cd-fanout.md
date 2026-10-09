# Feature: CD fan-out — merge a main despliega todos los environments

## Objetivo
Que cada push/merge a `main` despliegue **en paralelo** a TODOS los environments listados (hoy: `eest3`), con `fail-fast: false`; el `workflow_dispatch` manual sigue desplegando UNO. Dejar documentado en `docs/ci-cd.md` dónde y cómo agregar/quitar entornos.

## Por qué
Decisión del usuario (2026-10-07): "podemos configurar el merge para que intente a todos los entornos" → eligió **Paralelo** (no cadena promote). Lista actual de environments: solo `eest3` (no existe `prod`).

## Alcance autorizado
- Rama `feat/cd-fanout` en worktree aislado: `../vir-ttend-worktrees/cd-fanout` desde `origin/main`. **NO** tocar `feat/notifications-smtp` ni el working tree principal.
- **NO** tocar VMs (regla del usuario: modo guía, él opera).
- Archivos: `.github/workflows/cd.yaml` y `docs/ci-cd.md` únicamente.
- Commit local sí; **push/PR = decisión del usuario** (no empujar sin aprobación).

## Diseño (D)
- **D1**: pre-step `jobs.targets` produce JSON de environments → salida `environments`:
  - `push` → `["eest3"]` (lista fan-out, fuente de verdad para cada merge)
  - `workflow_dispatch` → `[inputs.target]` (construido con `jq -cn --arg` para no romper comillas)
- **D2**: `deploy` → `strategy.matrix.environment: ${{ fromJSON(needs.targets.outputs.environments) }}`, `fail-fast: false`, `environment: ${{ matrix.environment }}`. `needs: [targets, build, verify-images]` con `if: always() && targets success && (build success|skipped) && (verify success|skipped)`.
- **D3**: `concurrency` workflow-level pasa a grupo **constante `cd`** (push y dispatch comparten grupo → cero carreras de migración entre runs; matriz paralela dentro del run). Comentario del workflow actualizado.
- **D4**: default del input `target`: `prod` → `eest3` (hoy `prod` no existe como environment → footgun: dispatch con default fallaría buscando secretos de un environment inexistente).
- **D5**: docs en `docs/ci-cd.md` (español neutro, siguiendo el estilo del doc): sección "Agregar o quitar un entorno" = (1) crear environment en GitHub con los 5 secretos → referencia a `docs/vm-bootstrap.md` §8, (2) editar la lista en `jobs.targets` de `cd.yaml`, (3) nota sobre el default del input `target`, (4) cómo probar con `Run workflow target=<nombre>` antes de mergear, (5) quitar = sacar de la lista (el environment en GitHub puede quedarse). Comentarios del YAML en inglés (convención existente del archivo).

## Checklist
- [x] T0: feature doc + mirror Engram (antes del primer write)
- [x] T1: worktree `cd-fanout` desde `origin/main` con rama `feat/cd-fanout`
- [x] T2: DELEGADO (writer) — edits de `cd.yaml` + `ci-cd.md` → commit `d0aaf79`
- [x] T3: verificación — parse YAML exit 0 (writer + parent spot-check) + `review assess` RDD=off → risk **high** (process_boundary/shell_source) → tier high = writer self-verification + verificador independiente **PASS** (0 BLOCKER/CRITICAL; 3 event-path walkthroughs OK; actionlint sin errores de parse)
- [x] T3b: bounded-fix post-verificación → commit `2b52b8e` (guard de `target` vacío en `targets`; semántica de queue en el comment de `concurrency`; docs: `vm-bootstrap.md` `prod`→genérico en 6 refs + ancla `#8-environment-de-github` actualizada en `ci-cd.md`; link roto `../vm-bootstrap.md`→`./vm-bootstrap.md`; wording "crear environment ≠ fan-out")
- [ ] T4: entrega — diff + commits reportados; push/PR pendiente de aprobación

## Ruta (route declaration)
- T2 delegado — trigger writer: 2 archivos no triviales. T1/T3/T4 inline (bash/dif/estado).

## Checks
- Parse del workflow: `js-yaml` (shim cacheado `%LOCALAPPDATA%\npm-cache\_npx\d66c5096c7023bfb\node_modules\.bin\js-yaml.cmd`, fallback `npx js-yaml`) → exit 0
- `git diff --stat` exactamente sobre los 2 archivos
- Review estructural: matriz solo en `deploy`; `if` conserva build/verify skipped-success; `needs` incluye `targets`; `concurrency` grupo constante

## Entrega
- Cambio post-feature (fuera de la cadena single-deploy-target ya pusheada). Push solo con aprobación explícita.
