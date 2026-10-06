# Design — SMTP Notifications Module (BC `notifications`)

**Date**: 2026-10-06
**Status**: Approved
**Branch base**: `dev` (from `main` @ `41a666d` + fix `c9a8b87`)

## Goal

Deliver the first email capability of Vir-ttend: when a user is created, send them an
email with their temporary credentials. Build it as a new bounded context (BC)
`notifications` so future channels (attendance alerts, announcements, WhatsApp) plug
into the same seam without touching business logic.

## Scope (first iteration)

- New BC `apps/api/src/modules/notifications` with its own
  `domain / application / infrastructure` layers.
- Listen to the existing `user.created` domain event (already emitted by
  `create-user.handler`), render a Handlebars template, and send it via SMTP (Nodemailer).
- Configuration via `getEnvs()`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`,
  `SMTP_FROM`, `EMAIL_ENABLED` (default `false`), with production validation.
- **Best-effort delivery**: an email failure must never break user creation.
- **Capture mode**: when SMTP is not configured, payloads are written to
  `logs/emails.ndjson` instead of being sent (dev/test friendliness).

Out of scope (future iterations, same seam): alerts `alert.triggered`,
announcements, WhatsApp provider, email queue (BullMQ), retry/backoff.

## Architecture

The repo is already organized per bounded context under `apps/api/src/modules/`
(`identity`, `academic`, `attendance`, `reporting`, `shared`, `events`). BCs
communicate through the global event bus (`modules/events/event-bus.module.ts`,
`@nestjs/event-emitter`, `wildcard: false`). `identity` emits `user.created`
without knowing who consumes it; `notifications` consumes it. No new dependency
from `identity` to email.

### Components

| Component | Layer | Responsibility |
| --- | --- | --- |
| `EmailSender` (interface) | domain | Contract `send(payload: EmailPayload): Promise<void>` — the extension point for future mails/channels |
| `EmailPayload` | domain | `{ to, subject, template, context }` |
| `TemplateRenderer` | application | Compiles `templates/*.hbs` with Handlebars; exposes `render(name, context)` |
| `MailerService` | application | Implements `EmailSender`: creates Nodemailer transport once, best-effort, capture mode |
| `UserCreatedEmailListener` | infrastructure | `@OnEvent('user.created')` → render `user-created` → `MailerService.send`; try/catch + `Logger.error`, never throws |
| `templates/user-created.hbs` | infrastructure | Versioned template: names, email, temporary password |
| `app.config.ts` (extended) | shared | SMTP envs + prod validation |

Module wiring: `NotificationsModule` declares `TemplateRenderer`,
`MailerService`, `UserCreatedEmailListener`, and exports the `EmailSender`
interface provider.

### Data flow

```
create-user.handler (unchanged except event payload)
  → emits 'user.created' { userId, email, tenantId, rawPassword, firstName, lastName }
  → UserCreatedEmailListener (BC notifications)
  → TemplateRenderer.render('user-created', context)
  → MailerService.send({ to: email, subject, html })
```

The existing `UserCreatedEvent` carries `userId, email, tenantId, rawPassword`.
It is extended with `firstName` and `lastName` (set in `create-user.handler`'s
emit) so the email is human.

## Error handling (non-negotiable)

1. **Best-effort** — the listener wraps everything in try/catch and logs via
   `Logger.error`. An SMTP failure never fails or blocks `create-user`.
2. **`EMAIL_ENABLED=false`** (default, dev/test) — silent skip.
3. **No SMTP configured** — capture mode: messages appended to `logs/emails.ndjson`
   (single-file append, JSON lines, incl. `to`, `subject`, rendered `html`).
4. **Production validation** — `validateAppConfig` requires `SMTP_HOST` + `SMTP_FROM`
   when `NODE_ENV === 'production'` and `EMAIL_ENABLED === 'true'`.

## Configuration

Added to `getEnvs()` (`apps/api/src/modules/shared/config/app.config.ts`):

| Var | Required | Default |
| --- | --- | --- |
| `EMAIL_ENABLED` | no | `false` |
| `SMTP_HOST` | prod when enabled | — |
| `SMTP_PORT` | no | `587` |
| `SMTP_USER` | no | — |
| `SMTP_PASS` | no | — |
| `SMTP_FROM` | prod when enabled | — |

## Testing (TDD)

- **Renderer unit tests**: rendering `user-created.hbs` with a context yields html
  containing firstName, email, and the temporary password (snapshot/contain assertions).
- **Mailer unit tests**: transport used is injected/fake (`jsonTransport` or mocked);
  asserts `to`, `subject`, `html`; respects `EMAIL_ENABLED=false` (no send attempted);
  capture mode writes the ndjson file.
- **Listener unit tests**: emits a `user.created` event → `EmailSender.send` called
  with the rendered payload; when send rejects, the listener logs and does not throw.
- Existing suites must keep passing (`pnpm lint:check`, `pnpm ts:check`).

## Git workflow

- Base: `dev` branch.
- Work branch: `feat/notifications-smtp` from `dev`.
- Work-unit commits; conventional commit messages.
- Merge back to `dev` (PR to `dev` if preferred).
- CI/CD pipeline is a separate subsequent design doc (GitHub Actions;
  deploy only from `main`).

## Risks

- CRLF/`.gitattributes`: Windows checkout triggers pre-existing Biome formatting
  failures on untouched files (repo has no `.gitattributes`, `core.autocrlf=true`).
  Handled by explicit `--no-verify` on the base fix commit; root fix deferred as a
  separate change.
- Email deliverability depends on the chosen SMTP provider (school/provider choice
  later; the SMTP env contract already fits any provider).
- Raw password in event/email: acceptable for this iteration (best-effort email of
  temporary credentials; `mustChangePassword` flag already forces rotation at first login).