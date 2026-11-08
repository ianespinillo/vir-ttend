# Password reset email + mobile change password

## Objective
1. When an admin resets a user's password, email the new temporary password to the user.
2. Let users change their own password from the Android app (the web already has it in the profile page).

## Problem
- `ResetUserPasswordHandler` generates and saves a temporary password but emits no event and never calls the mailer. The admin has to pass the password on by hand.
- `apps/mobile` has no change-password screen.

## Scope
- API: `user.password-reset` event emitted by `ResetUserPasswordHandler`, a listener in the notifications module, a `user-password-reset.hbs` template, unit tests. The admin credentials dialog stays as the fallback (mail is best effort; `MailerService` logs and swallows errors).
- Mobile: a change-password screen that uses the existing change-password endpoint, reachable from the app, plus handling of `mustChangePassword` after a reset if mobile does not handle it yet.
- Web: no changes (already has `password-form.tsx` and `force-change-password-dialog.tsx`).

## Constraints
- English artifacts; user-facing copy in Spanish to match the existing app.
- Branch `feat/password-reset-email` from `origin/dev`. Two writers run in parallel on disjoint paths (`apps/api` vs `apps/mobile`); each commits only its own paths.

## Tasks
- [x] T1: API reset email (event, listener, template, tests). Route: delegated writer (2+ non-trivial files).
- [x] T2: Mobile change-password screen and `mustChangePassword` handling. Route: delegated writer (2+ non-trivial files). Done: voluntary screen `app/(app)/change-password.tsx` linked from Settings; forced flow (`mustChangePassword`) already existed.

## Acceptance criteria
- Resetting a password emits `user.password-reset`; the listener sends a mail with the temporary password to the user's email; a mailer failure does not fail the reset.
- An Android user can change their password (current + new + confirm) with validation matching the API rules and clear errors.

## Checks
- T1: `pnpm --filter api test`, `pnpm --filter api ts:check` (or the api typecheck script), `pnpm lint:check`.
- T2: `pnpm --filter mobile ts:check`, `pnpm lint:check`.

## TDD
- API: on (convention from notifications-smtp), runner jest.
- Mobile: off (no test runner in `apps/mobile`).

## Delivery
- Strategy: ask-on-risk. Forecast ~400-600 authored lines across both tasks.

## Progress
- Created. Next: T1 and T2 in parallel.
- T1 done: RED observed (3 suites failed before implementation), GREEN: identity+notifications suites 32/32. api ts:check clean except pre-existing stale `@repo/common` dist errors (hasSubjectAttendance); full api jest has 12 suites failing for that same reason; biome clean on apps/api.
- After rebuilding `@repo/common`: root `pnpm run ts:check` 9/9 pass; full api jest 1185 passed / 2 failed (failing suites not identified: output truncated, re-run killed by low system memory) — pending. Pre-commit hook (ts:check + `biome check .`) green. T1 commit: `1e66d65`.
- T2 done: `pnpm --filter mobile ts:check` pass; biome clean. App not run manually. T2 commit: see branch log (`feat(mobile): let users change their password`).
- Next: identify the 2 failing api tests; manual check of the email and the mobile screen.
