# Feature: Single-tenant admin management — admins can create and manage admins

## Objective
In single-tenant mode, an ADMIN can create other ADMINs and promote/demote members to/from ADMIN, with guards that keep the school from losing its last admin.

## Problem
In single mode nobody can create an ADMIN: `canCreate[ADMIN]` and `canManage[ADMIN]` only allow PRECEPTOR/TEACHER, and SUPERADMIN (the only role allowed to create admins) is locked out because `ALLOW_SUPERADMIN` defaults to false in single mode. The bootstrap admin is indistinguishable from other admins (no flag/column).

## Why
User request (2026-10-13), eest3 instance live. Decision (option A, accepted "todo pelota"): any ADMIN in single mode, no owner column, no migration.

## Scope (authorized)
- API: role rules depend on tenancy mode. Single mode: ADMIN may create ADMIN/PRECEPTOR/TEACHER and change roles among ADMIN/PRECEPTOR/TEACHER. Multi mode unchanged.
- Guards (single mode, and anywhere they apply): an admin cannot change their own role or deactivate themselves; the last active ADMIN of a tenant cannot be demoted or deactivated.
- Client/UI: role selectors (`user-form.tsx`, `change-role-dialog.tsx`) offer ADMIN to admins in single mode.
- Out of scope: owner/bootstrap flag, SUPERADMIN behavior, multi-tenant rules.

## Checklist
- [ ] T1: API rules + guards + unit tests (create-user, change-role, deactivate if present).
- [ ] T2: UI role selectors in single mode.
- [ ] T3: commit on main; push = user's call.

## Route
- T1–T2 delegated to one writer (trigger: 2+ non-trivial files across api and ui).

## TDD
- Off (no TDD configuration in the project). Unit tests still added for the new rules. Checks: `pnpm --filter api test` (jest), `pnpm ts:check`, `pnpm lint:check`.

## Acceptance criteria
- Single mode: ADMIN creates ADMIN → 201; ADMIN promotes TEACHER → ADMIN → OK; ADMIN demotes another ADMIN → OK while another active admin remains.
- Single mode: demoting/deactivating the last active ADMIN → rejected; changing own role → rejected.
- Multi mode: ADMIN creating ADMIN → 403 (unchanged).
- UI shows ADMIN in the role selector for admins only in single mode.

## Progress / evidence
- (pending)
