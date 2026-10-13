# Diseño: Branding por instancia — paquete `@repo/branding`, marca Vir-ttend fija + identidad de escuela en single

| Campo | Valor |
|---|---|
| **Fecha** | 2026-10-12 |
| **Rama** | `feat/instance-branding` |
| **Plan de implementación** | `docs/superpowers/plans/2026-10-12-instance-branding.md` |
| **Estado** | Aprobado por el usuario: logo "monograma check" como marca principal; escudo por escuela en las instancias single; branding como paquete propio del monorepo |

## 1. Contexto y problema

Con el cambio de modelo de negocio conviven dos ofertas:

- **Multi (instancia compartida):** la marca es siempre Vir-ttend (logo "monograma check": lima `#C6F432` + azul noche `#14213D`). No se personaliza.
- **Single (instancia dedicada, paga extra):** la escuela ve su identidad (nombre, escudo, colores) y un sello Vir-ttend fijo y discreto ("con vir-ttend").

Hoy ninguna de las dos es posible sin tocar código:
- La app móvil tiene el índigo hardcodeado.
- El web usa un azul genérico de shadcn.
- El logo es una "V" en el móvil y el ícono `School` de lucide en el web.

El objetivo es que la marca sea **dato de la instancia, no código**: las mismas imágenes de API y client por commit, la misma base de código móvil, y la regla comercial ("multi = Vir-ttend, single = escuela") decidida en un solo lugar. Toda la lógica de marca (schema, defaults, cálculo de colores, adaptadores para shadcn y NativeWind, dibujo del sello) vive en un paquete nuevo: **`@repo/branding`**.

## 2. Hechos verificados (2026-10-12)

| ID | Hecho | Evidencia |
|---|---|---|
| F1 | Ya existe `GET /config/public` (sin auth) con `tenancyMode`, `tenantName`, `tenantSlug`, `tenantId` y `allowSuperadmin`. | `apps/api/src/modules/shared/tenants/public-config.controller.ts` |
| F2 | La tenancy se configura solo por env (`env-var`), sin DB. `Tenant` solo tiene `name`, `subdomain`, `contactEmail` e `isActive`. | `apps/api/src/modules/shared/config/tenancy.config.ts`; `apps/api/src/modules/identity/domain/entities/tenant.entity.ts` |
| F3 | La app móvil cachea `/config/public` por URL de API (AsyncStorage, prefijo `virttend:server-config:`, no se borra en el logout), funciona offline y valida el payload con `parsePublicConfig`. `AuthProvider` expone `config` a toda la app. | `apps/mobile/src/features/config/*`; `apps/mobile/src/context/auth-context.tsx:73-77` |
| F4 | La app móvil se compila por variante (`general`, `eest3`) con `APP_VARIANT`: nombre, scheme, `appId` y `apiUrl` horneados. Las dos usan el ícono placeholder y `adaptiveIcon.backgroundColor: '#E6F4FE'`. | `apps/mobile/app.config.ts`; `apps/mobile/eas.json` |
| F5 | La app móvil tiene **87 usos de índigo hardcodeado en 13 archivos**: clases `*-indigo-*` (con prefijos `active:` y `focus:`) y los hex `#4F46E5`, `#4338CA`, `#6366F1`, `#3730A3`, `#E0E7FF`, `#EEF2FF` y `#C7D2FE` en props `color`. `tailwind.config.js` define `primary` como índigo fijo. NativeWind `^4.2.7`, sin `react-native-svg`. | grep en `apps/mobile/app` y `apps/mobile/src`; `apps/mobile/tailwind.config.js`; `apps/mobile/package.json` |
| F6 | El logo del login y del header del móvil es una "V" blanca sobre `bg-indigo-600`. | `apps/mobile/app/(auth)/login.tsx`; `apps/mobile/app/(app)/_layout.tsx` |
| F7 | `@repo/ui` es shadcn (`components.json`: `cssVariables: true`, `baseColor: zinc`). Los primitivos usan **solo tokens semánticos** (`bg-primary`, `text-primary-foreground`, `bg-sidebar-accent`…) mapeados en `packages/ui/tailwind.config.ts` como `hsl(var(--x))`. Los gráficos usan `hsl(var(--chart-1))`. | `packages/ui/components.json`; `packages/ui/tailwind.config.ts`; `packages/ui/src/components/features/dashboard/attendance-trend-chart.tsx:23` |
| F8 | El bloque de variables `:root` / `.dark` está **duplicado** en `packages/ui/src/globals.css` y `apps/client/src/app/globals.css`. El client solo importa el suyo. El `.dark` es una paleta verde que no tiene relación con la marca. | Los dos `globals.css`; `apps/client/src/app/layout.tsx` |
| F9 | Los colores de paleta que quedan en `@repo/ui` son casi todos **de estado y de rol**: amber (75), emerald (40), rose (19), indigo/sky/purple/blue en badges de asistencia, justificaciones y roles. Solo dos son "de marca": los puntos de no leído con `bg-blue-500` en `alert-item.tsx:31` y `announcement-card.tsx:38`. | grep en `packages/ui/src` |
| F10 | Los lugares de logo en web son `AuthLayout` (ícono `School` sobre `bg-primary`, título "Vir-ttend" y pie "© Vir-ttend") y `TenantSwitcher`/`AppSidebar` (ícono `School` y la prop `brandName = 'Vir-ttend'`). | `packages/ui/src/components/features/auth/auth-layout.tsx`; `packages/ui/src/components/layout/tenant-switcher.tsx`; `app-sidebar.tsx:51` |
| F11 | El client lee `/config/public` en runtime con `usePublicConfig()` de `@repo/hooks` (client-side, `staleTime` 1 h). El título y el favicon son estáticos. | `packages/hooks/src/features/tenants/use-public-config.ts`; `apps/client/src/app/(dashboard)/layout.tsx:39-51`; `apps/client/src/app/layout.tsx` |
| F12 | Los paquetes compartidos siguen un patrón: `tsup` con cjs+esm, `exports` por subpath y `vitest`. `@repo/common` ya lo hace y la API y la app móvil lo consumen desde `dist`. El client usa `transpilePackages`. | `packages/common/{package.json,tsup.config.ts,vitest.config.ts}`; `apps/client/next.config.mjs` |
| F13 | Los Dockerfiles copian manifests y construyen paquetes **de forma explícita**: la API solo `@repo/common`; el client `common` y `hooks`. Un paquete nuevo hay que agregarlo a mano. | `apps/api/dockerfile`; `apps/client/Dockerfile` |
| F14 | Las imágenes se construyen una vez por commit en CI (GHCR) y Caddy sirve un solo origen con `handle_path /api/*`. La API no tiene prefijo global. | `Caddyfile`; `compose.prod.yml`; spec `2026-10-07-single-deploy-target-design.md` (F10) |

## 3. Decisiones de diseño

**D1 — Dos capas.**

| Capa | Qué incluye | Dónde vive |
|---|---|---|
| Fija (Vir-ttend) | Sello lima con check, colores de estado y de rol (amber, emerald, rose, sky, purple…), `destructive`, fondo, bordes, tipografía, leyenda "con vir-ttend" | `@repo/branding` (defaults y marcas) y clases de estado existentes |
| Variable (instancia) | `displayName`, `shortName`, `colors.primary`, `colors.accent`, `colors.highlight`, `crest`, `crestSmall`, `crestSmallPng`, `favicon` | `branding.json` en la VM |

**D2 — La regla vive en `@repo/branding` y la aplica el servidor.** Hay una función pura `resolveBranding({ mode, instance })`:
- Con `multi` devuelve siempre `VIRTTEND_BRANDING`.
- Con `single` combina la instancia con el default campo por campo.

La API es el único lugar que la llama. Los clientes reciben el resultado y solo lo pintan.

**D3 — La fuente de verdad es un archivo en la VM, no la DB** (coherente con F2 y F14).
- `BRANDING_DIR` (default `/app/branding`) contiene `branding.json` (`version: 1`) y los assets.
- Se valida al arrancar con `brandingFileSchema`. Si el JSON o algún color es inválido, el boot falla y el error nombra el campo. Si la carpeta no existe, se usa el default y se deja un warning.
- La edición desde un panel queda fuera de alcance.

**D4 — Caddy sirve los assets en producción.**
- En el `Caddyfile`: `handle_path /branding/* { root * /srv/branding; file_server }`.
- Volúmenes `./branding:/srv/branding:ro` (caddy) y `./branding:/app/branding:ro` (api).
- En desarrollo, sin Caddy, la API sirve `BRANDING_DIR` en `/branding` con `express.static`, solo si `NODE_ENV !== 'production'`.
- Las URLs viajan como rutas relativas al origen con versión (`/branding/crest.png?v=<hash>`). `resolveAssetUrl(path, apiUrl)` las resuelve contra el origen de la URL de la API. Esto sirve para `https://x/api` en producción, `http://localhost:3001` en dev y `/api` relativo en el web.

**D5 — `/config/public` suma `branding: PublicBranding`.** El campo es compatible hacia atrás: los clientes viejos lo ignoran. Viajan los **colores crudos validados**, no los tokens: cada cliente llama a `deriveBrandTokens` del mismo paquete, así que el resultado es idéntico y la API no queda acoplada a shadcn ni a NativeWind.

```ts
interface PublicBranding {
  source: 'virttend' | 'instance';
  version: string;            // hash sha256 (10 chars) de branding.json + assets
  displayName: string;
  shortName: string;
  colors: { primary: string; accent: string; highlight: string | null };
  assets: { crest: string | null; crestSmall: string | null; crestSmallPng: string | null; favicon: string | null };
  showPoweredBy: boolean;     // true solo si source === 'instance'
}
```

**D6 — Paquete `@repo/branding`.** No depende de ningún framework y no tiene dependencias de runtime aparte de `zod`. Sigue el patrón de F12 (tsup cjs+esm, vitest). Sus subpaths son:

| Subpath | Contenido | Lo consumen |
|---|---|---|
| `@repo/branding` | Tipos, `brandingFileSchema`, `publicBrandingSchema`, `VIRTTEND_BRANDING`, `resolveBranding`, `deriveBrandTokens`, `contrastRatio`, utilidades de color, `resolveAssetUrl` | api, ui, hooks, client, mobile |
| `@repo/branding/web` | `toShadcnVars(tokens)`, `brandStyleSheet(tokens)` (devuelve el `:root:not(.dark){…}`), `BRAND_STYLE_ELEMENT_ID`, `BRAND_STORAGE_KEY` | ui, client |
| `@repo/branding/native` | `toNativeWindVars(tokens)` (devuelve `--brand-*` en formato `"R G B"`), `nativewindPrimaryColors` (fragmento para `tailwind.config.js`), `NATIVE_DEFAULT_VARS` | mobile |
| `@repo/branding/marks` | Geometría del sello Vir-ttend (viewBox 280, `rx` 64, trazo del check, grosor 38) y paleta del sello | ui (SVG inline), mobile (referencia; usa PNG) |

El paquete **no exporta componentes React**. Los componentes de web viven en `@repo/ui` y los de React Native en `apps/mobile`, porque son plataformas distintas.

**D7 — Tokens.** `deriveBrandTokens(colors)` devuelve:
- `primary` y una escala `primary50…primary900`: 50–500 son mezclas con blanco, 600 es el primario exacto y 700–900 son mezclas con negro.
- `onPrimary`: blanco o `#14213D`, el de mayor contraste.
- `accent`, `onAccent` y `usable`.

Si ninguna opción de `onPrimary` llega a 4.5:1, `usable = false` y la función devuelve los tokens de Vir-ttend. La API además lo deja en un warning al arrancar.

**D8 — Contrato con shadcn (`@repo/ui`).** Los componentes de shadcn **no se tocan**: siguen consumiendo variables CSS. La marca solo escribe esta lista blanca de variables, únicamente en modo claro:

| Variable shadcn | Token |
|---|---|
| `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring`, `--chart-1` | `primary` |
| `--primary-foreground`, `--sidebar-primary-foreground` | `onPrimary` |
| `--accent`, `--sidebar-accent` | `primary50` |
| `--accent-foreground`, `--sidebar-accent-foreground` | `primary700` |
| `--chart-2` | `accent` |

Todo lo demás (`--background`, `--destructive`, `--border`, `--muted`, y todo `.dark`) queda fijo.

- **Inyección:** con `<style id="vt-brand">:root:not(.dark){…}</style>` y no con estilos inline en `<html>`, porque esos también pisarían `.dark`.
- **Fuente única de variables:** se crea `packages/ui/src/tokens.css` con el bloque `:root` / `.dark` (exportado como `@repo/ui/tokens.css`). Sus valores de modo claro son los de Vir-ttend. `packages/ui/src/globals.css` lo importa, el client lo importa desde `layout.tsx`, y se borra el bloque duplicado de `apps/client/src/app/globals.css`.
- **Test de deriva:** un test en `@repo/ui` compara `tokens.css` con `toShadcnVars(deriveBrandTokens(VIRTTEND_BRANDING.colors))`.
- **Componentes nuevos en `@repo/ui` (`components/brand/`):**
  - `BrandProvider`: lee `usePublicConfig().data.branding`, inyecta el `<style>`, cachea en `localStorage` para que no parpadee, y actualiza `document.title` y el favicon.
  - `useBrand()`.
  - `BrandMark`: en multi muestra el sello Vir-ttend; en single, `crestSmall` con el sello en la esquina.
  - `VirttendSeal` (SVG desde `@repo/branding/marks`).
  - `PoweredBy` ("con vir-ttend" con el sello).
- **Reemplazos:**
  - `School` en `AuthLayout` y `TenantSwitcher` pasa a ser `BrandMark`.
  - `brandName` y el título por defecto salen de `useBrand()`.
  - El pie de `AuthLayout` muestra `PoweredBy` en single y "© Vir-ttend" en multi.
  - Los puntos de no leído pasan de `bg-blue-500` a `bg-primary`.
- **Colores de estado (F9):** quedan como están (capa fija). Consolidarlos en tokens de estado queda fuera de alcance.

**D9 — Móvil híbrido.**

*Build-time, por variante* (`app.config.ts`):
- `icon`, `adaptiveIcon` (foreground, background, monochrome y `backgroundColor` real) y splash, tomados de `assets/variants/<variant>/`.
- `extra.branding`: el `PublicBranding` de fallback para la primera apertura sin red.

*Runtime:*
- `parsePublicConfig` suma `branding`, validado con `publicBrandingSchema.safeParse`. Si es inválido queda en `null` sin descartar el resto, y viaja en el caché existente (F3).
- `MobileAppConfig.branding` se toma del servidor; si no hay, de `extra.branding`; si tampoco, de `VIRTTEND_BRANDING`.

*Theming:*
- **CSS variables:** `global.css` define los `--brand-*` por defecto (Vir-ttend). `tailwind.config.js` mapea `primary` con `nativewindPrimaryColors` (`rgb(var(--brand-primary-600) / <alpha-value>)`, etc.). `BrandProvider` envuelve el árbol en una `View` con `vars(toNativeWindVars(tokens))`.
- **Colores imperativos:** las props `color` de lucide, `headerTintColor`, `ActivityIndicator` y `StatusBar` usan `useBrand()`.

*Logo:*
- `BrandMark` en RN muestra el `Image` del sello desde `assets/brand/virttend-mark.png` (@2x/@3x). No suma `react-native-svg`.
- En single, el `Image` de `crestSmallPng` (URL resuelta) con el sello en la esquina.
- `PoweredBy` aparece en el login de single.

**D10 — Ícono de lanzador de una variante escolar.** Es el escudo simplificado sobre el color primario de la escuela, sin sello: a ese tamaño no se lee. El sello aparece dentro de la app.

**D11 — Formatos.** Los SVG solo salen de nuestro pipeline y se commitean en `deploy/branding/<slug>/`. Si en el futuro una escuela sube archivos, se aceptan solo PNG/WebP, nunca SVG de terceros.

## 4. Alcance / Fuera de alcance

**Dentro:**
- `packages/branding`, con tests.
- Cableado del monorepo (deps, Dockerfiles, `transpilePackages`).
- API: `BrandingModule`, `/config/public` y la ruta estática solo en dev.
- Infra: `Caddyfile`, `compose.prod.yml`, `.env.production.example` y docs.
- `@repo/ui`: `tokens.css`, componentes de marca, reemplazos de logo y puntos de no leído.
- `@repo/hooks`: tipo de `PublicConfig`.
- Client: montaje de `BrandProvider`, título y favicon.
- Móvil: plumbing de theming, migración de los 13 archivos, `BrandMark` y `PoweredBy`, variantes con assets.

**Fuera:**
- Editar la marca desde el panel y guardarla en DB.
- Tema oscuro por escuela (el `.dark` actual queda como está).
- Tipografía por escuela.
- Consolidar los colores de estado en tokens.
- Binario único con directorio de instancias.
- Marca en PDFs y Excel exportados.
- SSR de la marca en Next (posible fase 2 si el parpadeo molesta con caché).

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| La escuela elige colores con poco contraste | `deriveBrandTokens` con `usable=false` cae a Vir-ttend, y la API avisa al arrancar |
| Parpadeo con los colores por defecto en web | `BrandProvider` aplica la marca de `localStorage` en un `useLayoutEffect` antes de la respuesta de red |
| `vars()` de NativeWind con Expo SDK 57 / RN 0.86 | Spike en la Task 9 antes de migrar los 13 archivos, verificado contra la documentación versionada (`apps/mobile/AGENTS.md`). Plan B: `primary` como colores estáticos generados por variante en build-time |
| Deriva entre `tokens.css` y los defaults del paquete | Test de deriva en `@repo/ui` (D8) |
| Olvidar el paquete nuevo en los Dockerfiles | Task 3 los modifica y su verificación construye las dos imágenes |
| Cambio visual del web multi (azul shadcn → azul noche Vir-ttend) | Es deseado (marca principal). Se revisa en la verificación de la Task 12 |

## 6. Criterios de aceptación

1. Con `TENANCY_MODE=multi`, `/config/public` devuelve `branding.source = 'virttend'` aunque exista `BRANDING_DIR`.
2. Con `TENANCY_MODE=single` y `deploy/branding/eest3` montado: `branding.colors.primary = '#023064'`, `showPoweredBy = true`, y las URLs `/branding/...` responden 200 (vía Caddy en producción, vía API en dev).
3. Un `branding.json` con un color inválido hace fallar el boot con un mensaje que nombra el campo.
4. Web single: `--primary` es el de la escuela en modo claro y `.dark` no cambia; el título, el favicon, el `BrandMark` del login y el del sidebar son de la escuela, con `PoweredBy`. Web multi: todo Vir-ttend.
5. Móvil `eest3`: ícono, splash, login (escudo + sello + "con vir-ttend") y botones en `#023064`. Sin red, en la segunda apertura, se ve igual.
6. Móvil `general` contra multi: marca Vir-ttend; grep de `indigo|#4F46E5|#4338CA|#6366F1|#3730A3|#E0E7FF|#EEF2FF|#C7D2FE` en `apps/mobile/app` y `apps/mobile/src` en cero.
7. Los colores de estado y de rol son idénticos en todas las instancias.
8. `pnpm --filter @repo/branding test`, `pnpm --filter @repo/ui test`, los tests de branding de la API y los `ts:check` de client y mobile pasan; las dos imágenes Docker se construyen.

## 7. Assets incluidos con este diseño

- `apps/mobile/assets/variants/general/` y `apps/mobile/assets/variants/eest3/`: `icon`, `android-icon-{foreground,background,monochrome}`, `splash-icon` y `favicon`.
- `apps/mobile/assets/brand/virttend-mark{,@2x,@3x}.png`: el sello para `BrandMark` y `PoweredBy`.
- `deploy/branding/eest3/`: `branding.json`, `crest.png` (escudo oficial recibido de la escuela, 466 px; pedir uno en alta resolución), `crest-small.svg` y PNG de 64 a 512 px, `favicon.ico`.
- `deploy/branding/virttend/`: `branding.json`, `mark.svg`, `lockup.svg`, `lockup-on-dark.svg`, `favicon.ico` y `.svg`. Es la referencia del default; el default real vive en `@repo/branding`.
