# Instance Branding (`@repo/branding`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Que la marca sea dato de la instancia: multi siempre Vir-ttend, single con la identidad de la escuela más el sello Vir-ttend.
- Toda la lógica vive en un paquete nuevo, `@repo/branding`.
- La consumen la API, `@repo/ui` (shadcn) y la app móvil (NativeWind).

**Architecture:**
- **Paquete `@repo/branding`:** framework-agnostic (tsup cjs+esm, vitest), con subpaths `.` (core), `./web` (variables shadcn), `./native` (variables NativeWind) y `./marks` (geometría del sello).
- **Fuente de la marca:** la API lee `deploy/branding/<slug>/branding.json` montado en la VM, aplica la policy (`resolveBranding`) y publica el resultado en `GET /config/public` como `branding`.
- **Assets:** Caddy sirve `/branding/*` en producción; en dev los sirve la API.
- **Web:** shadcn no se toca. `BrandProvider` (en `@repo/ui`) inyecta un `<style>` con una lista blanca de variables solo para modo claro.
- **Móvil:** variables CSS con `vars()` de NativeWind, más assets de build por variante.

**Tech Stack:** pnpm workspaces + turbo, tsup, vitest, zod, NestJS (jest), Next.js 16 + shadcn/Tailwind 3, Expo SDK 57 + NativeWind 4, Docker Compose v2, Caddy 2.

**Spec:** `docs/superpowers/specs/2026-10-12-instance-branding-design.md` (los IDs F*/D* de este plan se refieren a esa spec).

**Branch:** `feat/instance-branding` (crear desde `main`).

## Global Constraints

- **Rama y commits:**
  - Rama `feat/instance-branding`, con un commit por tarea. Push/PR es decisión del usuario: nunca hacer push sin que lo pida.
  - Husky falla localmente por CRLF/biome, así que se commitea con `git commit --no-verify`.
  - NUNCA `git add .`: solo los archivos de la tarea.
  - Conventional commits, asunto ≤72 caracteres, sin atribución de AI ni Co-Authored-By.
- **Idioma:** artefactos en español neutro; identificadores y comandos en inglés.
- **Verificación:** los comandos de **Verification** son exactamente los que corre el executor (PowerShell 7 desde la raíz del repo, salvo que se indique otra cosa).
- **Antes de tocar APIs de Expo/EAS/NativeWind:** leer la versión de `expo` en `apps/mobile/package.json` y la documentación versionada (`apps/mobile/AGENTS.md`). Instalar dependencias móviles con `npx expo install`.
- **shadcn:** no se modifica ningún archivo de `packages/ui/src/ui/*` (primitivos shadcn). La marca entra solo por variables CSS.
- **Colores de estado y rol** (amber, emerald, rose, sky, purple, y el indigo/blue de "justificado"): son capa fija y no se migran a la marca.
- **Assets ya en el repo** (agregados junto con la spec, sin commitear): `apps/mobile/assets/variants/{general,eest3}/*`, `apps/mobile/assets/brand/virttend-mark{,@2x,@3x}.png` y `deploy/branding/{eest3,virttend}/*`. Se commitean en las tareas que los usan.

---

### Task 1: Paquete `@repo/branding` — core (tipos, schema, color, tokens, policy, URLs)

**Files:**
- Create: `packages/branding/package.json`, `tsup.config.ts`, `tsconfig.json`, `vitest.config.ts`, `README.md`
- Create: `packages/branding/src/{index.ts,types.ts,schema.ts,color.ts,tokens.ts,defaults.ts,resolve.ts,urls.ts}`
- Create: `packages/branding/src/{color,tokens,schema,resolve,urls}.test.ts`

**Contexto:** Es el corazón de la feature: funciones puras sin dependencias de framework. Se copia el patrón de `packages/common` (F12).

- [ ] **`package.json`.** Nombre `@repo/branding`, `type: module`. Scripts `build` (tsup), `dev`, `test` (`vitest run`) y `ts:check`. Dependencia: `zod` (misma versión que `@repo/common`). DevDeps: `tsup`, `typescript`, `vitest`. Los `exports` siguen el formato de common para `.`, `./web`, `./native` y `./marks` (`require` → `./dist/<x>.cjs`, `import` → `./dist/<x>.js`, `types` → `./dist/<x>.d.ts`; para `.` el archivo es `index`).
- [ ] **`tsup.config.ts`:** `entry: ['src/index.ts', 'src/web/index.ts', 'src/native/index.ts', 'src/marks/index.ts']`, `format: ['cjs','esm']`, `dts: true`, `clean: true`, `target: 'es2020'`.
- [ ] **`color.ts`** (no usar `URL` ni APIs de DOM, porque tiene que correr en Hermes):

```ts
export type Hex = `#${string}`;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
export const isHex = (v: string): v is Hex => HEX_RE.test(v);
export const normalizeHex = (h: string): Hex => h.toUpperCase() as Hex;
const toRgb = (h: string) => { const n = Number.parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const; };
const toHex = (r: number, g: number, b: number): Hex =>
  `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`.toUpperCase() as Hex;
/** Mezcla `a` hacia `b` con peso `t` (0 = a, 1 = b). */
export const mix = (a: string, b: string, t: number): Hex => { const x = toRgb(a), y = toRgb(b); return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
export const relativeLuminance = (h: string): number => {
  const ch = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = toRgb(h); return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
export const contrastRatio = (a: string, b: string): number => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05);
};
/** "H S% L%" (formato shadcn), 1 decimal. */
export const hexToHslTriplet = (h: string): string => { /* RGB→HSL estándar; redondear a 1 decimal */ };
/** "R G B" (formato rgb(var() / <alpha-value>) de NativeWind). */
export const hexToRgbTriplet = (h: string): string => toRgb(h).join(' ');
```

- [ ] **`types.ts` + `schema.ts`** (zod; los mensajes en español nombran el campo):

```ts
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'debe ser un color #RRGGBB');
const assetName = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|webp|svg|ico)$/, 'nombre de archivo inválido');
export const brandingFileSchema = z.object({
  version: z.literal(1),
  displayName: z.string().trim().min(1).max(120),
  shortName: z.string().trim().min(1).max(40),
  colors: z.object({ primary: hex, accent: hex.optional(), highlight: hex.optional() }),
  assets: z.object({ crest: assetName, crestSmall: assetName, crestSmallPng: assetName, favicon: assetName }).partial().default({}),
});
export type BrandingFile = z.infer<typeof brandingFileSchema>;
export const publicBrandingSchema = z.object({
  source: z.enum(['virttend', 'instance']),
  version: z.string().min(1),
  displayName: z.string(), shortName: z.string(),
  colors: z.object({ primary: hex, accent: hex.nullable(), highlight: hex.nullable() }),
  assets: z.object({ crest: z.string().nullable(), crestSmall: z.string().nullable(), crestSmallPng: z.string().nullable(), favicon: z.string().nullable() }),
  showPoweredBy: z.boolean(),
});
export type PublicBranding = z.infer<typeof publicBrandingSchema>;
export const formatBrandingError = (e: z.ZodError): string => e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
```

- [ ] **`defaults.ts`.** `VIRTTEND_COLORS = { navy: '#14213D', lime: '#C6F432' }`, `INK = '#14213D'` y `VIRTTEND_BRANDING: PublicBranding` con estos valores:
  - `source: 'virttend'`, `version: 'virttend-1'`, `displayName` y `shortName` `'Vir-ttend'`.
  - `colors: { primary: '#14213D', accent: '#C6F432', highlight: null }`.
  - Todos los assets en `null` (los clientes usan la marca empaquetada) y `showPoweredBy: false`.
- [ ] **`tokens.ts`:**

```ts
export const SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type ScaleStep = (typeof SCALE)[number];
export interface BrandTokens { primary: Hex; onPrimary: Hex; scale: Record<ScaleStep, Hex>; accent: Hex; onAccent: Hex; usable: boolean }
const TINT: Partial<Record<ScaleStep, number>> = { 50: 0.92, 100: 0.84, 200: 0.68, 300: 0.5, 400: 0.32, 500: 0.14 };
const SHADE: Partial<Record<ScaleStep, number>> = { 700: 0.15, 800: 0.3, 900: 0.45 };
const pickOn = (bg: string) => { const w = contrastRatio(bg, '#FFFFFF'), k = contrastRatio(bg, INK); return { on: (w >= k ? '#FFFFFF' : INK) as Hex, ratio: Math.max(w, k) }; };
const build = (c: { primary: string; accent?: string | null }): BrandTokens => {
  const primary = normalizeHex(c.primary);
  const scale = Object.fromEntries(SCALE.map((s) => [s, s === 600 ? primary : TINT[s] !== undefined ? mix(primary, '#FFFFFF', TINT[s]!) : mix(primary, '#000000', SHADE[s]!)])) as Record<ScaleStep, Hex>;
  const p = pickOn(primary); const accent = normalizeHex(c.accent ?? scale[400]);
  return { primary, onPrimary: p.on, scale, accent, onAccent: pickOn(accent).on, usable: p.ratio >= 4.5 };
};
export const deriveBrandTokens = (c: { primary: string; accent?: string | null }): BrandTokens => {
  const t = build(c); return t.usable ? t : { ...build(VIRTTEND_BRANDING.colors), usable: false };
};
```

- [ ] **`resolve.ts`.** `resolveBranding({ mode, instance })`, donde `instance: { file: BrandingFile; version: string } | null`:
  - Con `multi` o sin instancia devuelve `VIRTTEND_BRANDING`.
  - Si no, devuelve `source: 'instance'`, `showPoweredBy: true`, `colors.accent`/`highlight` del archivo o `null`, y assets como `` `/branding/${name}?v=${version}` `` (o `null`).
  - Exporta `BRANDING_URL_PREFIX = '/branding'`.
- [ ] **`urls.ts`.** `resolveAssetUrl(path, apiUrl)`. Si `path` es null devuelve null; si `path` ya es absoluto lo devuelve tal cual. Si `apiUrl` es absoluto, toma su origen con la regex `^(https?:\/\/[^/]+)` (sin `URL`) y le concatena `path`. Si `apiUrl` es relativo (`/api`), devuelve `path` (mismo origen).
- [ ] **`index.ts`:** re-exporta todo lo anterior.
- [ ] **Tests:**
  - `contrastRatio('#FFFFFF','#000000') ≈ 21`.
  - `#023064` da `onPrimary` blanco y `usable`.
  - `#F9D648` da `onPrimary` `#14213D`.
  - Un primario con contraste < 4.5 contra las dos opciones (`#8A8A8A`) da `usable=false` con los tokens de Vir-ttend.
  - `scale[600] === primary`.
  - El schema acepta `deploy/branding/eest3/branding.json` (leerlo con `fs` desde `../../deploy/...`) y rechaza `primary: 'azul'` con un mensaje que contiene `colors.primary`.
  - `resolveBranding`: multi con instancia da `source 'virttend'`; single da las URLs con `?v=`.
  - `resolveAssetUrl`: los 4 casos (null, absoluto, `https://x.org/api` → `https://x.org/branding/a.png?v=1`, y `/api`).

**Verification:**
```powershell
pnpm install
pnpm --filter @repo/branding test
pnpm --filter @repo/branding build
pnpm --filter @repo/branding ts:check
```

**Commit:** `feat(branding): add @repo/branding core package` (incluye `pnpm-lock.yaml`).

---

### Task 2: `@repo/branding` — adaptadores `web`, `native` y `marks`

**Files:**
- Create: `packages/branding/src/web/index.ts`, `src/native/index.ts`, `src/marks/index.ts`
- Create: `packages/branding/src/web/web.test.ts`, `src/native/native.test.ts`

- [ ] **`web/index.ts`** (contrato D8; mantener la lista blanca exacta):

```ts
export const BRAND_STYLE_ELEMENT_ID = 'vt-brand';
export const BRAND_STORAGE_KEY = 'virttend:branding';
export const toShadcnVars = (t: BrandTokens): Record<string, string> => {
  const h = hexToHslTriplet;
  return {
    '--primary': h(t.primary), '--primary-foreground': h(t.onPrimary), '--ring': h(t.primary),
    '--accent': h(t.scale[50]), '--accent-foreground': h(t.scale[700]),
    '--sidebar-primary': h(t.primary), '--sidebar-primary-foreground': h(t.onPrimary),
    '--sidebar-accent': h(t.scale[50]), '--sidebar-accent-foreground': h(t.scale[700]), '--sidebar-ring': h(t.primary),
    '--chart-1': h(t.primary), '--chart-2': h(t.accent),
  };
};
/** Solo modo claro: `.dark` queda intacto (D8). */
export const brandStyleSheet = (t: BrandTokens): string =>
  `:root:not(.dark){${Object.entries(toShadcnVars(t)).map(([k, v]) => `${k}:${v};`).join('')}}`;
```

- [ ] **`native/index.ts`:**
  - `toNativeWindVars(t)` devuelve `--brand-primary`, `--brand-on-primary`, `--brand-primary-50` … `--brand-primary-900`, `--brand-accent` y `--brand-on-accent` en formato `"R G B"`.
  - `nativewindPrimaryColors` tiene esta forma: `{ primary: { DEFAULT: 'rgb(var(--brand-primary) / <alpha-value>)', foreground: 'rgb(var(--brand-on-primary) / <alpha-value>)', 50: 'rgb(var(--brand-primary-50) / <alpha-value>)', …900 }, accent: { DEFAULT, foreground } }`.
  - `NATIVE_DEFAULT_VARS = toNativeWindVars(deriveBrandTokens(VIRTTEND_BRANDING.colors))`.
- [ ] **`marks/index.ts`:** `VIRTTEND_MARK = { viewBox: '0 0 280 280', radius: 64, check: { d: 'M 62 118 L 116 206 L 220 66', strokeWidth: 38 }, background: '#C6F432', foreground: '#14213D' } as const`.
- [ ] **Tests:**
  - `toShadcnVars` devuelve exactamente las 12 claves de la lista blanca, sin `--background` ni `--destructive`.
  - `brandStyleSheet` empieza con `:root:not(.dark){`.
  - `toNativeWindVars` da 14 claves, todas con formato `^\d+ \d+ \d+$`.
  - Snapshot de los valores de Vir-ttend.

**Verification:**
```powershell
pnpm --filter @repo/branding test
pnpm --filter @repo/branding build
node -e "import('@repo/branding/web').then(m=>import('@repo/branding').then(c=>console.log(m.toShadcnVars(c.deriveBrandTokens(c.VIRTTEND_BRANDING.colors)))))" --input-type=module
```
(Correr el último comando desde `packages/branding`. Su salida es la que se usa en la Task 6.)

**Commit:** `feat(branding): add web, native and marks adapters`

---

### Task 3: Cableado del monorepo (deps, Dockerfiles, Next)

**Files:**
- Modify: `apps/api/package.json`, `packages/ui/package.json`, `packages/hooks/package.json`, `apps/client/package.json`, `apps/mobile/package.json` (agregar `"@repo/branding": "workspace:*"`; en mobile `"workspace:^"`, igual que common)
- Modify: `apps/client/next.config.mjs` (`transpilePackages` suma `'@repo/branding'`)
- Modify: `apps/api/dockerfile`, `apps/client/Dockerfile`

**Contexto:** F13. Sin esto, las imágenes de CI se rompen en la primera tarea que importe el paquete.

- [ ] **Dependencias:** agregarlas en los 5 `package.json` y correr `pnpm install`.
- [ ] **`apps/api/dockerfile`:**
  - Builder: `COPY packages/branding/package.json ./packages/branding/` junto a common, y `RUN pnpm --filter @repo/branding build` antes de `api build`.
  - Runner: `COPY --from=builder /app/packages/branding ./packages/branding`.
- [ ] **`apps/client/Dockerfile`:** `COPY packages/branding/package.json ./packages/branding/` y `RUN pnpm --filter @repo/branding build` antes de `@repo/hooks build`.
- [ ] **Turbo:** `turbo.json` no cambia (`build.dependsOn: ["^build"]` ya resuelve el orden).
- [ ] **EAS:** la app móvil (Metro y `app.config.ts`) consume `@repo/branding` y `@repo/common` desde `dist`, que no está en git. Hay que asegurar que EAS los construya:
  1. Verificar en la documentación de EAS (SDK 57) el hook `eas-build-post-install`.
  2. Agregar a `apps/mobile/package.json` `"eas-build-post-install": "pnpm --filter @repo/common --filter @repo/branding build"` (o lo que indique la doc para monorepos pnpm).
  3. Si hoy los builds de EAS ya resuelven `@repo/common` de otra forma, replicar ese mecanismo y anotarlo en el commit.

**Verification:**
```powershell
pnpm install
pnpm build
docker build -f apps/api/dockerfile -t virttend-api:branding-check .
docker build -f apps/client/Dockerfile -t virttend-client:branding-check .
```

**Commit:** `build: wire @repo/branding into apps, packages and Dockerfiles`

---

### Task 4: API — `BrandingModule` + `branding` en `/config/public`

**Files:**
- Create: `apps/api/src/modules/shared/branding/{branding.config.ts,branding-loader.ts,branding.service.ts,branding.module.ts}`
- Create: `apps/api/src/modules/shared/branding/{branding-loader.spec.ts,branding.service.spec.ts}`
- Modify: `apps/api/src/modules/shared/tenants/public-config.controller.ts`, `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/.env.example`

- [ ] **`branding.config.ts`:** `getBrandingConfig(env = process.env)` lee `BRANDING_DIR` con `env-var`, con default `/app/branding`.
- [ ] **`branding-loader.ts`.** `loadInstanceBranding(dir)` devuelve `{ file, version } | null`:
  - Si no existe `dir/branding.json`, devuelve `null`.
  - Parsea con `brandingFileSchema.safeParse`. Si falla, lanza `Error('branding.json inválido: ' + formatBrandingError(...))`.
  - Comprueba que cada asset declarado exista en `dir`. Si falta, lanza un error que nombra el archivo.
  - `version` = sha256 de `branding.json` más los bytes de los assets, primeros 10 caracteres hex.
- [ ] **`branding.service.ts`** (`@Injectable`, `OnModuleInit`):
  - Lee el modo con `getTenancyConfig()`. Con `single`, carga la instancia (dejando propagar el error, para que el boot falle). Con `multi` no lee el disco.
  - Guarda `resolveBranding(...)`.
  - Si `!deriveBrandTokens(colors).usable`, deja un `Logger.warn` ("contraste insuficiente, se usa Vir-ttend").
  - Si es single sin `branding.json`, deja un `Logger.warn`.
  - Expone `getPublicBranding(): PublicBranding` y `getAssetsDir(): string | null`.
- [ ] **`branding.module.ts`:** `@Global()`, `providers/exports: [BrandingService]`. Importarlo en `AppModule` antes de `TenantModule`.
- [ ] **`PublicConfigController`:** constructor con `BrandingService`; `PublicConfigDto` suma `branding!: PublicBranding` (`@ApiProperty({ type: Object })`), y la respuesta suma `branding: this.branding.getPublicBranding()`.
- [ ] **`main.ts` (solo dev, D4):** `NestFactory.create<NestExpressApplication>(AppModule)`. Si `NODE_ENV !== 'production'` y `getAssetsDir()` no es null, registrar `app.useStaticAssets(dir, { prefix: '/branding/' })`.
- [ ] **`.env.example`:** comentario sobre `BRANDING_DIR` (para dev local, `BRANDING_DIR=../../deploy/branding/eest3` junto con `TENANCY_MODE=single`).
- [ ] **Tests (jest):**
  - Loader con `deploy/branding/eest3` real: devuelve la versión de 10 hex y `colors.primary #023064`.
  - Loader con un dir temporal (`fs.mkdtempSync`): sin `branding.json` devuelve `null`; con un color inválido lanza un error con `colors.primary`; con un asset faltante lanza un error con el nombre del archivo.
  - Service: multi con `BRANDING_DIR` válido da `source 'virttend'`; single da `source 'instance'` y `showPoweredBy`.

**Verification:**
```powershell
pnpm --filter @repo/branding build
pnpm --filter api test -- branding
pnpm --filter api build
```
Manual (dev): `TENANCY_MODE=single`, `TENANT_ID`/`TENANT_SLUG` de prueba y `BRANDING_DIR=../../deploy/branding/eest3`. Correr `pnpm --filter api start:dev` y comprobar:
- `curl http://localhost:3001/config/public` → `branding.colors.primary = "#023064"`.
- `curl -I "http://localhost:3001/branding/crest-small.svg"` → 200.

**Commit:** `feat(api): publish instance branding in /config/public`

---

### Task 5: Infra de producción — Caddy, compose, docs

**Files:**
- Create: `deploy/branding/_none/.gitkeep`
- Add (ya presentes en el working tree): `deploy/branding/eest3/*`, `deploy/branding/virttend/*`
- Modify: `Caddyfile`, `compose.prod.yml`, `.env.production.example`, `docs/deployment-configuration.md`, `docs/tenancy-single-tenant.md`

**Contexto:** La marca va versionada en git. La VM hace checkout exacto del sha, así que compose monta solo la carpeta de **su** escuela. `_none` es un dir vacío para las instancias sin marca, así Docker no crea directorios como root en el working tree.

- [ ] **`Caddyfile`:** agregar este bloque antes del `reverse_proxy client:3000`:

```
    handle_path /branding/* {
        root * /srv/branding
        header Cache-Control "public, max-age=31536000, immutable"
        file_server
    }
```

- [ ] **`compose.prod.yml`:**
  - `api.environment` suma `BRANDING_DIR: /app/branding`.
  - `api.volumes: [ "./deploy/branding/${BRANDING_SLUG:-_none}:/app/branding:ro" ]`.
  - `caddy.volumes` suma `- ./deploy/branding/${BRANDING_SLUG:-_none}:/srv/branding:ro`.
- [ ] **`.env.production.example`:** sección "Marca de la instancia" con `BRANDING_SLUG=` (vacío, que equivale a `_none` y a marca Vir-ttend) y un ejemplo `BRANDING_SLUG=eest3`.
- [ ] **Docs:** en `docs/deployment-configuration.md`, una sección "Marca de la instancia" con:
  - El formato de `branding.json` (link a la spec).
  - Cómo agregar una escuela: crear `deploy/branding/<slug>/`, validar con `pnpm --filter api test -- branding`, setear `BRANDING_SLUG` en el `.env` de la VM y redeploy.
  - Que la marca se ignora en multi.

  En `docs/tenancy-single-tenant.md`, un link a esa sección.

**Verification:**
```powershell
docker compose -f compose.prod.yml config | Select-String -Pattern "branding"
docker run --rm -v "${PWD}/Caddyfile:/etc/caddy/Caddyfile:ro" -e VIR_DOMAIN=localhost caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile
```

**Commit:** `feat(deploy): serve per-instance branding via Caddy and compose`

---

### Task 6: `@repo/ui` — `tokens.css` como fuente única + test de deriva

**Files:**
- Create: `packages/ui/src/tokens.css`, `packages/ui/src/lib/tokens-drift.test.ts`
- Modify: `packages/ui/src/globals.css`, `packages/ui/package.json` (export `"./tokens.css": "./src/tokens.css"`), `apps/client/src/app/globals.css`, `apps/client/src/app/layout.tsx`

**Contexto:** F8. Hoy los dos `globals.css` duplican `:root`/`.dark`, y el client solo usa el suyo. Esta tarea deja una sola fuente, con los valores de Vir-ttend en modo claro.

- [ ] **`tokens.css`:** mover a `packages/ui/src/tokens.css` el `@layer base { :root {…} .dark {…} }` de `packages/ui/src/globals.css`. En `:root`, reemplazar las 12 variables de la lista blanca por la salida del comando de la Task 2. El resto (incluido todo `.dark`) se deja igual.
- [ ] **`packages/ui/src/globals.css`:** después del `@import url(...Inter...)`, agregar `@import './tokens.css';` y borrar los bloques que se movieron.
- [ ] **Client:** borrar `:root` y `.dark` de `apps/client/src/app/globals.css` (se conservan `@tailwind` y los `* {}` / `body {}`). En `apps/client/src/app/layout.tsx`, agregar `import '@repo/ui/tokens.css';` antes de `import './globals.css';`.
- [ ] **`tokens-drift.test.ts`:** leer `tokens.css` con `fs` y extraer el primer bloque `:root { … }` con una regex. Para cada `[k, v]` de `toShadcnVars(deriveBrandTokens(VIRTTEND_BRANDING.colors))`, esperar `k: v;` dentro de ese bloque.

**Verification:**
```powershell
pnpm --filter @repo/ui test
pnpm --filter client build
```
Manual: `pnpm --filter client dev`. El login y el sidebar se ven en azul noche Vir-ttend (#14213D), y el modo oscuro (si se activa) no cambia.

**Commit:** `refactor(ui): single tokens.css source with Vir-ttend defaults`

---

### Task 7: `@repo/ui` + `@repo/hooks` — componentes de marca y reemplazo de logos

**Files:**
- Modify: `packages/hooks/src/features/tenants/use-public-config.ts` (`branding?: PublicBranding`, tipo importado de `@repo/branding`); exportar `apiClient` desde el index de hooks si todavía no lo está
- Create: `packages/ui/src/components/brand/{brand-context.tsx,brand-mark.tsx,virttend-seal.tsx,powered-by.tsx,index.ts}`
- Create: `packages/ui/src/components/brand/brand-mark.test.tsx`
- Modify: `packages/ui/src/index.tsx` (export `./components/brand`), `components/features/auth/auth-layout.tsx`, `components/layout/tenant-switcher.tsx`, `components/layout/app-sidebar.tsx`, `components/features/alerts/alert-item.tsx:31`, `components/features/announcements/announcement-card.tsx:38`

- [ ] **`brand-context.tsx`** (`'use client'`):
  - `BrandProvider({ children })`:
    1. `const { data } = usePublicConfig()`.
    2. `branding = data?.branding ?? cache ?? VIRTTEND_BRANDING`, donde `cache` se lee de `localStorage[BRAND_STORAGE_KEY]` y se valida con `publicBrandingSchema.safeParse` dentro de try/catch.
    3. `tokens = useMemo(() => deriveBrandTokens(branding.colors))`.
    4. `useIsomorphicLayoutEffect`:
       - Si `branding.source === 'instance'`, hace upsert de `<style id={BRAND_STYLE_ELEMENT_ID}>` con `brandStyleSheet(tokens)`; si no, lo elimina, porque los defaults de `tokens.css` ya son Vir-ttend.
       - Pone `document.title = branding.shortName`.
       - Si hay `assets.favicon`, actualiza `link[rel="icon"]` con `resolveAssetUrl`.
       - Guarda el branding en `localStorage` cuando `data` llega.
  - `useBrand()` devuelve `{ branding, tokens, assetUrl: (p) => resolveAssetUrl(p, apiClient.defaults.baseURL ?? '') }`.
- [ ] **`virttend-seal.tsx`:** `<svg viewBox={VIRTTEND_MARK.viewBox} role="img" aria-label="Vir-ttend">`, con un `rect rx` y un `path` con `stroke`, desde `@repo/branding/marks`. Props `size` y `ring?: string` (borde del color del fondo cuando va como badge).
- [ ] **`brand-mark.tsx`:** props `size?: 'sm' | 'md' | 'lg'` (24/40/56 px) y `className`.
  - `source === 'virttend'` o sin `crestSmall`: `<VirttendSeal size>`.
  - Si no: un contenedor `relative` con `<img src={assetUrl(crestSmall)} alt={shortName}>` y `<VirttendSeal size={size*0.4} ring="hsl(var(--background))" className="absolute -top-1 -right-2">`.
- [ ] **`powered-by.tsx`:** `<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><VirttendSeal size={14}/>con vir-ttend</span>`.
- [ ] **`AuthLayout`:**
  - El bloque `School` pasa a ser `<BrandMark size="lg" />`.
  - `title` por defecto: `useBrand().branding.displayName`, si no se pasa la prop.
  - Pie: `branding.showPoweredBy ? <PoweredBy/> : '© {año} Vir-ttend…'`.
- [ ] **`TenantSwitcher`:** los `School` del slot de marca (líneas ~55 y ~79) pasan a `<BrandMark size="sm" />`. El `School` de la lista de tenants (línea ~154) se queda. El default de `brandName` sale de `useBrand().branding.shortName`. En `AppSidebar`, lo mismo con `brandName`.
- [ ] **Puntos de no leído:** `bg-blue-500` pasa a `bg-primary` en `alert-item.tsx` y `announcement-card.tsx`.
- [ ] **`brand-mark.test.tsx`:** con un `QueryClient` de prueba y `usePublicConfig` mockeado:
  - Multi: renderiza `role="img"` con nombre "Vir-ttend" y ningún `<img>`.
  - Single: renderiza `<img alt="EEST N.º 3">` con `src` terminado en `crest-small.svg?v=…` y el sello.

**Verification:**
```powershell
pnpm --filter @repo/hooks build
pnpm --filter @repo/ui test
pnpm --filter @repo/ui ts:check
```

**Commit:** `feat(ui): BrandProvider, BrandMark and branded auth/sidebar`

---

### Task 8: Client — montar `BrandProvider`

**Files:**
- Modify: `apps/client/src/app/layout.tsx`, `apps/client/src/app/(auth)/layout.tsx` (si fija título/logo), `apps/client/src/app/(dashboard)/layout.tsx` (pasar `brandName` solo si hace falta)
- Delete: `apps/client/src/app/favicon.ico` (default de Next). Reemplazar por `apps/client/src/app/icon.svg` copiado de `deploy/branding/virttend/favicon.svg`

- [ ] **Montaje:** en `RootLayout`, envolver `{children}` con `<BrandProvider>` dentro de `<TanstackProvider>` (ahí ya está disponible `usePublicConfig`).
- [ ] **Metadata:** `metadata.title` queda en `'Vir-ttend'` (lo pisa `BrandProvider` en single); `icons` lo resuelve Next con `app/icon.svg`.
- [ ] **Limpieza:** quitar los textos "Vir-ttend" y los íconos `School` de los layouts del client que dupliquen lo que ya hace `AuthLayout`/`AppSidebar`.

**Verification:**
```powershell
pnpm --filter client ts:check
pnpm --filter client build
```
Manual, con la API de la Task 4 en modo single con eest3: el login muestra el escudo, el sello y "con vir-ttend"; el botón es `#023064`; la pestaña dice "EEST N.º 3" con el favicon de la escuela. Con la API en multi, todo Vir-ttend.

**Commit:** `feat(client): mount BrandProvider and Vir-ttend favicon`

---

### Task 9: Móvil — plumbing de theming + spike de `vars()`

**Files:**
- Modify: `apps/mobile/tailwind.config.js`, `apps/mobile/global.css`, `apps/mobile/app/_layout.tsx`, `apps/mobile/src/features/config/{public-config.ts,mobile-config.ts}`, `apps/mobile/src/config/app-config.ts`
- Create: `apps/mobile/src/features/branding/{brand-context.tsx,brand-mark.tsx,powered-by.tsx,status-colors.ts}`
- Add (ya presentes): `apps/mobile/assets/brand/virttend-mark{,@2x,@3x}.png`

- [ ] **Documentación:** leer la de NativeWind v4 (themes / `vars()` / CSS variables) y la de Expo SDK 57, según `AGENTS.md`.
- [ ] **`tailwind.config.js`:** `const { nativewindPrimaryColors } = require('@repo/branding/native');` y `colors: { ...nativewindPrimaryColors, background, card, … }` (se borra el `primary` índigo; `success`/`warning`/`destructive` quedan).
- [ ] **`global.css`:** agregar `:root { --brand-primary: … }` con los valores de `NATIVE_DEFAULT_VARS`. Imprimirlos con `node -e "import('@repo/branding/native').then(m=>console.log(m.NATIVE_DEFAULT_VARS))" --input-type=module`.
- [ ] **`public-config.ts`:** `PublicConfig` suma `branding: PublicBranding | null`, y `parsePublicConfig` usa `publicBrandingSchema.safeParse(payload.branding)` (si es inválido queda en `null` sin descartar el resto).
- [ ] **`app-config.ts`:** `StaticAppInfo.variantBranding: PublicBranding | null`, desde `Constants.expoConfig?.extra?.branding` validado con el schema.
- [ ] **`mobile-config.ts`:** `MobileAppConfig.branding: PublicBranding` = servidor, si no `variantBranding`, si no `VIRTTEND_BRANDING`.
- [ ] **`brand-context.tsx`:**
  - `BrandProvider` toma `useAuth().config.branding`, calcula `tokens` con `useMemo(deriveBrandTokens)` y renderiza `<View style={[{ flex: 1 }, vars(toNativeWindVars(tokens))]}>` más el contexto.
  - `useBrand()` devuelve `{ branding, tokens, assetUrl: (p) => resolveAssetUrl(p, API_URL) }`.
- [ ] **`brand-mark.tsx`** (RN):
  - Multi: `<Image source={require('../../../assets/brand/virttend-mark.png')}>`.
  - Single: `<Image source={{ uri: assetUrl(crestSmallPng) }}>`, con el sello en una `View` absoluta con borde del color de fondo.
- [ ] **`powered-by.tsx`:** sello de 14 px y el texto "con vir-ttend" en `text-xs text-slate-500`.
- [ ] **`status-colors.ts`:** constantes fijas para los estados que hoy usan índigo como **estado** (por ejemplo, "justificado" en `justification-badge.tsx`). Es el único archivo que puede contener índigo.
- [ ] **`app/_layout.tsx`:** `<AuthProvider><BrandProvider>…</BrandProvider></AuthProvider>`.
- [ ] **Spike:** migrar solo el botón "Ingresar" de `login.tsx` a `bg-primary` + `text-primary-foreground` y probar en el dispositivo con `APP_VARIANT=eest3` contra una API single con eest3 y con `general`.
  - **Si funciona:** seguir con la Task 10.
  - **Si `vars()` no aplica:** usar el **plan B**. `tailwind.config.js` genera colores estáticos para la variante a partir de `process.env.APP_VARIANT` y `extra.branding`, y la marca en runtime solo afecta a logos y textos. Antes de seguir, documentarlo en la spec (sección 5) y avisar al usuario.

**Verification:**
```powershell
pnpm --filter mobile ts:check
cd apps/mobile; npx expo-doctor; cd ../..
```
Manual: el spike descrito arriba (el botón de login cambia de color según la instancia).

**Commit:** `feat(mobile): brand theming plumbing with NativeWind vars`

---

### Task 10: Móvil — migrar los 13 archivos + logo y "con vir-ttend"

**Files (F5):** `app/(auth)/select-tenant.tsx`, `app/(auth)/login.tsx`, `app/(app)/attendance/[id].tsx`, `app/(app)/attendance/subject/[subjectId].tsx`, `app/(app)/settings.tsx`, `app/(app)/_layout.tsx`, `app/(app)/index.tsx`, `src/features/attendance/{attendance-date-bar,justification-badge,justify-sheet,monthly-justifications-modal}.tsx`, `src/features/offline/{failed-sync-banner,sync-indicator}.tsx`

- [ ] **Clases:** reemplazar `indigo-` por `primary-` (con los prefijos `bg-`, `text-`, `border-`, `active:`, `focus:`); la escala es 1:1.
- [ ] **Texto sobre fondo primario:** si un elemento tiene `bg-primary-600`/`bg-primary` (antes `bg-indigo-600`), su texto e íconos van con `text-primary-foreground` (y opacidades, por ejemplo `text-primary-foreground/80` donde había `text-indigo-100`), **nunca** `text-white`. Así funciona con primarios claros.
- [ ] **Hex en props `color`:** pasan a `useBrand().tokens`:

| Antes | Después |
|---|---|
| `#4F46E5` | `tokens.scale[600]` |
| `#4338CA` | `tokens.scale[700]` |
| `#3730A3` | `tokens.scale[800]` |
| `#6366F1` | `tokens.scale[500]` |
| `#C7D2FE` | `tokens.scale[200]` |
| `#E0E7FF` | `tokens.scale[100]` |
| `#EEF2FF` | `tokens.scale[50]` |
| `color="#E0E7FF"` sobre fondo primario | `tokens.onPrimary` |

- [ ] **Estados:** si el índigo representa un **estado** (justificado), usar `status-colors.ts`. No es marca.
- [ ] **`login.tsx`:**
  - La "V" pasa a ser `<BrandMark size="lg" />`.
  - El chip de escuela usa `primary-50`/`primary-700`.
  - Al pie, si `branding.showPoweredBy`, va `<PoweredBy />`.
- [ ] **`(app)/_layout.tsx`:** la "V" del header pasa a ser `<BrandMark size="sm" />`; el ícono de Ajustes con `tokens.scale[600]` no hace falta (es slate).

**Verification:**
```powershell
pnpm --filter mobile ts:check
Get-ChildItem -Recurse apps/mobile/app, apps/mobile/src -Include *.ts, *.tsx | Where-Object { $_.Name -ne 'status-colors.ts' } | Select-String -Pattern 'indigo|#4F46E5|#4338CA|#6366F1|#3730A3|#E0E7FF|#EEF2FF|#C7D2FE'
```
(El último comando no tiene que imprimir nada.) Manual: recorrer login → inicio → pase de lista → materia → ajustes con `eest3` y con `general`.

**Commit:** `refactor(mobile): replace hardcoded indigo with brand tokens`

---

### Task 11: Móvil — variantes con assets y marca de fallback

**Files:**
- Modify: `apps/mobile/app.config.ts`, `apps/mobile/README.md`
- Add (ya presentes): `apps/mobile/assets/variants/{general,eest3}/*`

- [ ] **`VariantConfig`:** suma `assetsDir`, `adaptiveBackgroundColor`, `splashBackgroundColor` y `branding: PublicBranding`. Con eso, `icon`, `adaptiveIcon.{foregroundImage,backgroundImage,monochromeImage}`, `web.favicon` y la imagen del splash salen de `` `./assets/variants/${variant}/…` ``.
  - `general`: `adaptiveBackgroundColor '#C6F432'`, splash con fondo `#14213D` y `branding: VIRTTEND_BRANDING` (importado con `require('@repo/branding')`, porque `app.config.ts` corre en Node).
  - `eest3`: `adaptiveBackgroundColor '#023064'`, splash con fondo `#FFFFFF` y `branding` = el `PublicBranding` equivalente a `deploy/branding/eest3/branding.json`. Usar `resolveBranding({ mode: 'single', instance: { file, version: 'build' } })`, leyendo el JSON con `fs` desde `../../deploy/branding/eest3/branding.json`. Los assets quedan como rutas relativas: para la primera apertura offline, `BrandMark` cae al sello si la imagen no carga.
  - `extra.branding = variantConfig.branding`.
- [ ] **Splash:** verificar en la documentación de SDK 57 si va en `splash` o en el plugin `expo-splash-screen`, y configurarlo como corresponda.
- [ ] **README móvil:** la tabla de variantes suma "Colores / assets" y explica cómo agregar una escuela (assets en `assets/variants/<slug>/`, perfil en `eas.json`, `deploy/branding/<slug>/`).
- [ ] **Limpieza:** borrar `apps/mobile/assets/{icon,android-icon-*,splash-icon,favicon}.png` (placeholders), solo si ya nada los referencia.

**Verification:**
```powershell
cd apps/mobile
$env:APP_VARIANT='eest3'; npx expo config --type public | Select-String -Pattern "variants/eest3|023064"
$env:APP_VARIANT='general'; npx expo config --type public | Select-String -Pattern "variants/general|C6F432"
Remove-Item Env:APP_VARIANT; npx expo-doctor; cd ../..
pnpm --filter mobile ts:check
```

**Commit:** `feat(mobile): per-variant icons, splash and fallback branding`

---

### Task 12: Verificación de punta a punta + cierre de docs

**Files:**
- Modify: `docs/superpowers/specs/2026-10-12-instance-branding-design.md` (Estado: implementado; anotar si se usó el plan B), `AI_CONTEXT.md` (sección breve "Branding")

- [ ] **Criterios de aceptación 1–8 de la spec:** recorrerlos uno por uno y anotar el resultado de cada uno en el mensaje final al usuario.
- [ ] **Build de preview:** `eas build --profile preview-eest3 --platform android` (solo si el usuario lo aprueba; consume cuota de EAS).
- [ ] **`AI_CONTEXT.md`:** dejar las reglas del paquete:
  - La marca entra solo por `@repo/branding`.
  - No se tocan los primitivos shadcn.
  - Los colores de estado son fijos.
  - Nada de hex de marca en las apps.

**Verification:**
```powershell
pnpm test
pnpm ts:check
pnpm build
```

**Commit:** `docs: close instance branding spec and AI context`
