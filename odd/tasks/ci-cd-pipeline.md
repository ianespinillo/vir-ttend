# Feature: ci-cd-pipeline

**Branch**: main (user explicit: no branch this time)
**Status**: tasks done — pending first live deploy (secrets + VM)

## Objective
Pipeline CI/CD completo: CI existente (lint/typecheck/test) + CD nuevo:
build imagenes API/client -> push GHCR al merge a main -> deploy SSH a la VM
(compose pull + up -d) con paso EXPLICITO de migraciones. .env solo en VM/Secrets.

## Facts (verified)
- CI ya existe: .github/workflows/ci.yaml (lint:check, ts:check, tests, build; PRs a main + push a ramas no main/develop)
- Bug: branches-ignore refiere a `develop`, la rama real de integracion es `dev`
- Composicion: compose.prod.yml usa build context raiz; TENANCY_MODE single
- Dockerfiles: apps/api/dockerfile y apps/client/Dockerfile (node:20-alpine, pnpm 9.8.0)
- La imagen runner de API NO copia apps/api/src (solo dist), las migraciones MikroORM
  estan en src/modules/shared/database/migrations -> el paso de migraciones del CD debe
  resolver esto (config con pathTs vs dist, o ajustar el dockerfile runner)
- Repo: github.com/ianespinillo/vir-ttend; VM: ssh aws-virttend, /home/ubuntu/vir-ttend
- gh CLI NO esta instalado local -> secrets de GHA se documentan, no se configuran

## Tasks
- [x] T1: CD workflow .github/workflows/cd.yaml: build+push GHCR (api+client) al push a main
- [x] T2: Deploy job: SSH a VM, git pull, compose pull, migraciones explicitas, up -d
- [x] T3: Resolver paso de migraciones — solucion (a): dockerfile runner copia src + tsconfig.json; `docker compose run --rm --no-deps api ... migration:up` (verificado end-to-end contra Postgres: 7 migraciones, idempotente)
- [x] T4: Corregir branches-ignore en ci.yaml (develop -> dev)
- [x] T5: docs/ci-cd.md — flujo, secrets, solucion T3, fallback manual

## Progress
- Delegado a un writer (general) 2026-10-07; todo T1-T5 verificado:
  - YAML parse OK (cd.yaml jobs=[build,deploy]; ci.yaml)
  - compose override merge OK: IMAGE_TAG=sha-... -> ghcr.io/.../{api,client}:sha-...
  - Migraciones: build de imagen + `migration:up` contra postgres:16 fresco -> 7 OK, rerun idempotente
  - git diff revisado: solo ci.yaml (1 linea), apps/api/dockerfile (+7), nuevos cd.yaml/compose.ci.yml/docs/ci-cd.md
- Route: delegated direct (writer trigger: 5 archivos no triviales)
- Commit: ver `git log` (work-unit commit en main, --no-verify por CRLF/biome)

## Pending (post-commit)
- Crear 6 GitHub Secrets (gh no instalado local): SSH_HOST, SSH_USER, SSH_PRIVATE_KEY, GHCR_USERNAME, GHCR_TOKEN (PAT read:packages), NEXT_PUBLIC_API_URL
- VM: llegar a ser alcanzable por SSH desde runners; checkout divergente rompe `git pull --ff-only`
- Primer deploy observando paso de migraciones + health
- Consideracion: CI no corre en push a main (branches-ignore) — el gate es el PR a main

## Verification
- YAML de workflows valido (actionlint o parser YAML)
- No romper CI: pnpm lint:check / ts:check / build en CI contexto (nota: CRLF local rompe biome, en CI Linux no aplica)
- git diff revisado antes de commit

## Known environmental failures
- Biome/CRLF local: commits usan --no-verify (decisión de usuario previa)
- gh no instalado: no se pueden crear secrets desde aca