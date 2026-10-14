# Feature: Mobile variant branding — theme, logos, icons and splash per school

## Objetivo
Que el APK de cada variante (hoy `eest3`) muestre la identidad de la escuela: colores de marca en todas las pantallas, escudo visible, ícono de launcher y splash propios.

## Por qué
Pedido del usuario (2026-10-13), tras instalar el primer APK: "no se adapta ni el theme ni los logos". Pidió pushear directo a `main`.

## Diagnóstico (mapeo delegado)
- La marca de `/config/public` se parsea y aplica como variables NativeWind (`BrandProvider`), pero las pantallas usan hex hardcodeados, sobre todo el índigo viejo `#4F46E5` (19 usos) y `#EEF2FF`.
- `BrandMark` y `PoweredBy` existen pero ninguna pantalla los renderiza.
- `extra.branding` nunca se define: sin red en el primer arranque, la app cae a la marca Vir-ttend.
- `app.config.ts` usa los íconos genéricos para todas las variantes; `assets/variants/<variant>/` existía sin commitear y sin conectar. No hay splash configurado.

## Alcance autorizado
- Trabajo directo sobre `main` (decisión del usuario). Push a `main` al terminar: dispara `mobile-release` (APK nuevo) y el CD.
- Archivos: `apps/mobile/**` (config, pantallas, componentes de branding, assets por variante) y lockfile si se agrega `expo-splash-screen`.
- Fuera de alcance: colores semánticos de estado (rojo, verde, ámbar) y grises neutros.

## Checklist
- [x] T1: íconos + splash por variante (`assetsDir` en `app.config.ts`, `expo-splash-screen ~57.0.10`); se borraron los íconos genéricos de `assets/` (sin referencias).
- [x] T2: `extra.branding` por variante desde `deploy/branding/<variant>/branding.json` (`readVariantBranding`, versión `baked-<variant>`); `general` sin marca horneada.
- [x] T3: índigo de marca → escala `primary` (clases) y `useBrand().tokens` (props). Se mantuvo el índigo semántico de "justificado" y "sincronizando" (`status-colors.ts`, `justification-badge`, `justify-sheet`, `sync-indicator`).
- [x] T4: `BrandMark` en login, pantalla de carga y header de `(app)`; `PoweredBy` en login y ajustes.
- [ ] T5: commit + push a `main`. El build del APK lo sigue el usuario.

## Verificación (writer + spot check del parent)
- `pnpm --filter mobile ts:check`: OK (repetido por el parent).
- `pnpm lint:check`: solo los 5 warnings conocidos.
- `expo config` eest3: íconos, adaptive icon, favicon y splash bajo `assets/variants/eest3`; `extra.branding` con `#023064` / `#0195EF` / `#F9D648` (repetido por el parent).
- `expo config` general: assets de general, sin `extra.branding`.
- `expo install --check`: solo los avisos de patch conocidos de `expo` y `expo-router`.
- No verificado: APK real en dispositivo (splash, launcher icon y pantallas).

## Ruta
- T1-T4 delegados a un writer (trigger: 2+ archivos no triviales). T5 inline.

## TDD
- Off (sin configuración de TDD en el proyecto). Checks funcionales: `pnpm --filter mobile ts:check`, tests de mobile si existen, `pnpm lint:check`, `expo config` por variante.
