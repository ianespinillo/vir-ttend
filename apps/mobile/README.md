# Vir-ttend mobile

Expo (SDK 57) app for preceptors and teachers.

## Running against the dockerized API over USB (Android)

The API runs in Docker and is published on the laptop at port `3001`. A physical
phone cannot reach the laptop's `localhost`, so the ports are forwarded over USB
with `adb reverse`. The app defaults to `http://localhost:3001` on every
platform (see `src/config/app-config.ts`), which works on devices and emulators
once the reverse is active.

1. Start the API: `docker compose up -d` (check `http://localhost:3001/health`).
2. Enable USB debugging on the phone, connect it and confirm `adb devices` lists it.
3. From the repo root run:

   ```bash
   pnpm --filter mobile android:usb
   ```

   It runs `adb reverse` for the API (`3001`) and Metro (`8081`), then starts
   Expo. To only (re)create the forwarding, run
   `pnpm --filter mobile android:reverse`.

`adb reverse` rules are dropped when the phone is unplugged or `adb` restarts;
run `android:reverse` again if requests stop reaching the API.

### Cleartext http

The API is plain `http` on `localhost`. This works without extra config in Expo
Go and in debug development builds (`expo run:android`), which allow cleartext
traffic. Release builds block it on Android 9+, so use an `https` API URL
(or add `expo-build-properties` with `android.usesCleartextTraffic`) there.

### Custom API URL

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to override the
default. Restart Expo with `--clear` after changing it.

## Build variants

One codebase ships two apps, picked by `APP_VARIANT` in `app.config.ts`
(default `general`):

| Variant   | Name                | Scheme           | Application id       | API URL                                |
| --------- | ------------------- | ---------------- | -------------------- | -------------------------------------- |
| `general` | Vir-ttend           | `virttend`       | `com.virttend.app`   | pending (shared server not deployed)   |
| `eest3`   | EEST Nº3 Eva Perón  | `virttend-eest3` | `com.virttend.eest3` | `https://eest3-virttend.duckdns.org/api` |

Both variants share the slug `vir-ttend` so they belong to a single EAS
project. The release builds read their API URL from the variant
(`extra.apiUrl`); the tenancy mode and school name come from the server's
`GET /config/public`, never from a user setting.

### API URL precedence

1. `EXPO_PUBLIC_API_URL` (dev override, or set per profile in `eas.json`).
2. The variant's `extra.apiUrl`.
3. `http://localhost:3001` (the `adb reverse` dev flow above).

### Running a variant locally

```bash
# general (default)
npx expo start

# EEST Nº3 (uses its production API unless EXPO_PUBLIC_API_URL is set)
APP_VARIANT=eest3 npx expo start

# Inspect the resolved config
APP_VARIANT=eest3 npx expo config --type public
```

On Windows PowerShell use `$env:APP_VARIANT = 'eest3'; npx expo start`.
Day-to-day development keeps running in Expo Go against `EXPO_PUBLIC_API_URL`.

### EAS builds

Profiles in `eas.json` set `APP_VARIANT` (and `EXPO_PUBLIC_API_URL` where the
server is known). Preview builds are Android APKs for internal sharing.

```bash
npx eas-cli@latest build --profile preview-general --platform android
npx eas-cli@latest build --profile preview-eest3 --platform android
npx eas-cli@latest build --profile production-general
npx eas-cli@latest build --profile production-eest3
```

`development` builds a development client (only needed for native modules
outside Expo Go).

### Pending

- EAS project: run `npx eas-cli@latest init` to create the project and add
  `extra.eas.projectId` to `app.config.ts` (none exists yet).
- General variant API URL: set `apiUrl` for `general` in `app.config.ts` and
  `EXPO_PUBLIC_API_URL` in the `*-general` profiles once the shared server is
  deployed.
- EEST3 icon and splash: both variants reuse the default assets until the
  school provides its logo.
- Store accounts, signing credentials and publishing.
