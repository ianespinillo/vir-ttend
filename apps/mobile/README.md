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
