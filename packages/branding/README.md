# @repo/branding

Branding logic shared by the API, `@repo/ui` (shadcn) and the mobile app (NativeWind).
Framework-agnostic: pure functions plus a zod schema.

| Subpath | Content |
|---|---|
| `@repo/branding` | Types, schemas, `VIRTTEND_BRANDING`, `resolveBranding`, `deriveBrandTokens`, color utilities, `resolveAssetUrl` |
| `@repo/branding/web` | `toShadcnVars`, `brandStyleSheet` (shadcn CSS variables, light mode only) |
| `@repo/branding/native` | `toNativeWindVars`, `nativewindPrimaryColors`, `NATIVE_DEFAULT_VARS` |
| `@repo/branding/marks` | Vir-ttend seal geometry and palette |

See `docs/superpowers/specs/2026-10-12-instance-branding-design.md`.

```sh
pnpm --filter @repo/branding test
pnpm --filter @repo/branding build
```
