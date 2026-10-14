# Vir-ttend — Sitio público (`apps/site`)

Landing de Vir-ttend: presentación del producto, planes (Compartido y Servidor dedicado), app móvil, preguntas frecuentes, contacto, página de descargas y política de privacidad. Se despliega en Vercel.

Es un sitio estático (Next.js, Server Components) sin backend. Solo hay JavaScript de cliente en un detalle: `PlatformScope` detecta Android/iOS para resaltar el botón de descarga correcto.

## Desarrollo local

```bash
# Desde la raíz del monorepo
pnpm install
pnpm --filter site dev        # http://localhost:3002
pnpm --filter site ts:check
pnpm --filter site build
pnpm --filter site start
```

La marca (`@repo/branding`) y los tokens de color (`@repo/ui/tokens.css`) vienen de los paquetes del monorepo. Los colores del sitio son los de Vir-ttend: azul noche y lima. El lima es un color de fondo (con texto azul noche); no se usa como texto sobre blanco.

## Variables de entorno

Todas son opcionales y se leen en tiempo de build (`NEXT_PUBLIC_*`): al cambiarlas hay que volver a desplegar. Ver `.env.example`.

| Variable | Default | Uso |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `VERCEL_PROJECT_PRODUCTION_URL` en Vercel; sin valor en local | URL pública del sitio: `metadataBase`, sitemap, robots, Open Graph y el QR de `/descargar/[slug]`. Sin URL, el QR no se genera. |
| `NEXT_PUBLIC_DEMO_URL` | `https://demo.virttend.app` | Destino de «Probar la demo» (el despliegue de `apps/demo`). |
| `NEXT_PUBLIC_APP_URL` | sin valor | Destino de «Ingresar» (instancia compartida). Sin valor, el botón se oculta. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `espinilloian@hotmail.com` | Dirección de los enlaces `mailto:`. |

## Despliegue en Vercel

Vercel construye el monorepo desde la raíz y necesita compilar primero `@repo/branding` (genera `dist`). Para eso `apps/site/vercel.json` define:

- `installCommand`: `cd ../.. && pnpm install --frozen-lockfile`
- `buildCommand`: `cd ../.. && pnpm turbo run build --filter=site...`

El filtro `site...` incluye `site` y todas sus dependencias del workspace; Turborepo respeta `dependsOn: ["^build"]` y compila `@repo/branding` antes que el sitio. No se usa `output: 'standalone'`: Vercel despliega el build de Next directamente.

### Pasos

1. En Vercel: **Add New > Project** e importá el repositorio.
2. **Root Directory**: `apps/site`. Dejá activa la opción **Include source files outside of the Root Directory in the Build Step** (viene activa por defecto) para que Vercel vea `packages/*` y el `pnpm-lock.yaml` de la raíz.
3. **Framework Preset**: Next.js (se detecta solo). Los comandos de instalación y build salen de `vercel.json`; no los sobrescribas en el panel.
4. **Environment Variables**: cargá las de la tabla anterior (como mínimo `NEXT_PUBLIC_DEMO_URL` con la URL real de la demo y `NEXT_PUBLIC_CONTACT_EMAIL`).
5. **Deploy**. El sitio queda en `https://<proyecto>.vercel.app`.

### Dominio propio (más adelante)

1. **Settings > Domains**: agregá el dominio (por ejemplo `vir-ttend.app`) y creá en tu DNS los registros que indique Vercel.
2. Definí `NEXT_PUBLIC_SITE_URL=https://virttend.app` y redesplegá, para que el sitemap, Open Graph y el QR usen el dominio definitivo.
3. Mapa de dominios previsto: la landing en la raíz, `app.` para la instancia compartida y un dominio por escuela para las instancias dedicadas. Cuando exista la instancia compartida, cargá su URL en `NEXT_PUBLIC_APP_URL`.

## Descargas de la app móvil

Hay una app general (Vir-ttend, `com.virttend.app`, para el servidor compartido) y una app por escuela con servidor dedicado (hoy `com.virttend.eest3`). Ninguna está publicada todavía: todos los enlaces están en `null` y el sitio muestra «Próximamente».

Rutas:

| Ruta | Contenido |
|---|---|
| `/` (sección «Descargá la app») | Botones de la app general y enlace a `/descargar` |
| `/descargar` | App general y lista de escuelas con app propia |
| `/descargar/[slug]` | Página de una escuela: botones, aviso de que la app solo se conecta al servidor de esa escuela y código QR de la página |

La fuente de verdad es `src/config/mobile-apps.ts`. **Para publicar un enlace, completá la URL y volvé a desplegar.**

```ts
android: { playStoreUrl: 'https://play.google.com/store/apps/details?id=com.virttend.app', apkUrl: null },
ios: { appStoreUrl: null, testFlightUrl: 'https://testflight.apple.com/join/XXXXXXXX' },
```

- Si hay URL de tienda, se muestra el botón de la tienda. Los enlaces `apkUrl` y `testFlightUrl` aparecen como opciones secundarias («APK para Android», «Beta en TestFlight»).
- Si una plataforma no tiene ningún enlace, muestra «Próximamente» deshabilitado.
- En teléfonos, el botón de la plataforma detectada pasa primero y el otro se atenúa. Sin JavaScript se muestran ambos por igual.
- Los botones son de estilo propio (texto e íconos genéricos). Antes de publicar en las tiendas, reemplazalos por las insignias oficiales de Google Play y App Store, que tienen reglas de uso de marca.

### Agregar una escuela

1. Agregá una entrada en `schools` de `src/config/mobile-apps.ts`: `slug` (igual al `APP_VARIANT` de la app móvil), `name`, `shortName` y `downloads`.
2. Opcional: copiá el escudo a `public/schools/<slug>/crest.png` (por ejemplo desde `deploy/branding/<slug>/crest-small-256.png`) y poné `crest: '/schools/<slug>/crest.png'`.
3. Redesplegá. La página `/descargar/<slug>`, la entrada de `/descargar` y el sitemap se generan solos; un slug que no está en la configuración devuelve 404.

### Qué esperar de las tiendas

- **Google Play**: requiere una cuenta de desarrollador con un pago único.
- **App Store**: requiere el Apple Developer Program, con un pago anual.
- **Android** permite instalar un APK por fuera de la tienda (sideload) antes de publicar. Sirve, por ejemplo, un enlace de distribución interna de EAS en `apkUrl`.
- **iOS no permite sideload**: antes de la publicación, la alternativa es TestFlight (`testFlightUrl`).

## Privacidad y SEO

- `/privacidad` es un **borrador** (Ley 25.326, datos de menores) y debe ser revisado por un profesional del derecho. Mientras tanto la página tiene `noindex` y no figura en el sitemap. Una vez aprobado el texto, quitá el aviso de borrador, el `robots: { index: false }` de `src/app/privacidad/page.tsx` y agregala a `src/app/sitemap.ts`. Los datos entre corchetes (razón social, CUIT, domicilio, proveedores, plazos) hay que completarlos.
- `src/app/icon.svg` es el ícono del sitio (logo 01, monograma check). `robots.ts` y `sitemap.ts` se generan en el build.
