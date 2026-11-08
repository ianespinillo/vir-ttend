# Vir-ttend mobile

Expo (SDK 57) app for preceptors and teachers.

## Running against the dockerized API over the network

The API runs in Docker and is published on the laptop at port `3001`. The phone
reaches it, and Metro, over the network: same wifi (LAN IP) or Tailscale. No
USB cable or `adb` is needed.

1. Start the API: `docker compose up -d` (check `http://localhost:3001/health`).
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the laptop's
   address, e.g. `http://192.168.1.100:3001` (LAN) or its Tailscale IP. Check it
   from the phone's browser: `http://<ip>:3001/health`.
3. From the repo root run:

   ```bash
   pnpm --filter mobile android
   ```

   It starts Expo on the LAN; scan the QR code with Expo Go. If the phone
   cannot reach Metro (different network, firewall), use
   `pnpm --filter mobile android:tunnel` instead. The API still has to be
   reachable at `EXPO_PUBLIC_API_URL`.

If requests stop reaching the API, check that the laptop's IP has not changed
and that the firewall allows ports `3001` and `8081`.

### Cleartext http

The dev API is plain `http`. This works without extra config in Expo
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
| `eest3`   | EEST Nº3 Eva Perón  | `virttend-eest3` | `com.virttend.eest3` | `https://eest3.virttend.app/api` |

Both variants share the slug `vir-ttend` so they belong to a single EAS
project. The release builds read their API URL from the variant
(`extra.apiUrl`); the tenancy mode and school name come from the server's
`GET /config/public`, never from a user setting.

### API URL precedence

1. `EXPO_PUBLIC_API_URL` (dev override, or set per profile in `eas.json`).
2. The variant's `extra.apiUrl`.
3. `http://localhost:3001` (only reachable when the app runs on the dev machine).

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

### Releases

`.github/workflows/mobile-release.yaml` builds the `preview-*` APKs on EAS and
publishes them to a GitHub Release as `virttend-<variant>.apk` on every push to
`main` that touches the app, on `mobile-v*` tags and on manual runs. The site
download pages link to the latest release. Setup and details:
[docs/ci-cd.md](../../docs/ci-cd.md#mobile-release-mobile-releaseyaml).

### Pending

- General variant API URL: set `apiUrl` for `general` in `app.config.ts` and
  `EXPO_PUBLIC_API_URL` in the `*-general` profiles once the shared server is
  deployed.
- EEST3 icon and splash: both variants reuse the default assets until the
  school provides its logo.
- Store accounts, signing credentials and publishing.
