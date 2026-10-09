# Feature: notifications-smtp

**Branch**: feat/notifications-smtp (base: dev)
**Status**: implementing
**Spec**: docs/superpowers/specs/2026-10-06-smtp-notifications-design.md

## Objective
BC `notifications` nuevo: enviar email por SMTP (Nodemailer + Handlebars) al
crear usuario (credenciales) y al vincular usuario existente a tenant (bienvenida).
Best-effort, modo captura, config vía getEnvs().

## Scope
- Módulo `apps/api/src/modules/notifications` (domain/application/infrastructure + templates)
- Extender `UserCreatedEvent` con firstName/lastName; `UserTenantLinkedEvent` con tenantName
- Actualizar emit en `create-user.handler` (resolver tenantName)
- Config SMTP en `app.config.ts` + validación prod
- Reemplazar listeners log-only de identity por listeners de email en notifications
- Dependencias: nodemailer, handlebars (+ types)
- Tests unitarios: renderer, mailer, listeners (TDD)

## Tasks
- [x] T1: Extender eventos UserCreatedEvent (firstName/lastName) y UserTenantLinkedEvent (tenantName); actualizar emits en create-user.handler (resuelve tenant via ITenantRepository)
- [x] T2: Agregar deps nodemailer + handlebars + types a apps/api
- [x] T3: EmailSender interface + EmailPayload (domain)
- [x] T4: TemplateRenderer (Handlebars) con templates user-created.hbs y user-tenant-linked.hbs
- [x] T5: MailerService (nodemailer transport, best-effort, captura logs/emails.ndjson, EMAIL_ENABLED)
- [x] T6: UserCreatedEmailListener + UserTenantLinkedEmailListener; identity.events.module quedó solo con TenantCreatedListener
- [x] T7: Config SMTP en getEnvs() + validateAppConfig prod (SMTP_HOST/SMTP_FROM requeridos si EMAIL_ENABLED=true en prod)
- [x] T8: NotificationsModule + registro en app.module.ts (+ assets .hbs en nest-cli.json)
- [x] T9: Tests TDD — 50 suites / 259 tests OK; ts:check OK

## Verification evidence (2026-10-06)
- `pnpm --filter api ts:check`: OK (sin errores)
- `pnpm --filter api test`: Test Suites: 50 passed / Tests: 259 passed
- `gentle-ai review mode status`: off (global) — RDD deshabilitado, sin review
- `gentle-ai review assess`: no disponible por untracked (RDD off) — gate cubierto con self-verify + readback estructural del orchestrator

## Follow-ups
- user-tenant-linked.hbs: `{{#if firstName}}` nunca renderiza (evento no lleva nombres) — decidir si el evento debe incluir firstName/lastName o quitar el bloque del saludo

## TDD
- Modo: estándar (sin sdd-init). Runner: jest (apps/api), ts:check = tsc --noEmit
- RED → GREEN → REFACTOR por unidad

## Verification
- `pnpm --filter api ts:check`
- `pnpm --filter api test` (o turbo test; notar que lint:check Biome falla por CRLF pre-existente — no es gate)

## Known environmental failures
- `biome check .` (pre-commit) marca errores CRLF pre-existentes en archivos no tocados;
  los commits usan --no-verify hasta que se resuelva .gitattributes (decisión del usuario)