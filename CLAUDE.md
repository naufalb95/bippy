# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

The root holds only docs (`README.md`, `CLAUDE.md`) and two self-contained app folders, each with its own `package.json`, `node_modules`, and `.env.local` — there is no root-level package or toolchain:

- **`mobile/`** — the Expo + React Native app (the Bippy! scanner). Everything in this doc up to "The admin web app" is about `mobile/`, and those commands run from inside `mobile/`.
- **`admin/`** — a separate Next.js web app to manage the deck (see its own section below).

## Commands

`mobile/` commands — run from inside `mobile/`:

```sh
npm start                       # Metro + Expo dev server (test on physical iPhone via Expo Go)
npx tsc --noEmit                # typecheck (strict mode); no other test/lint setup
node scripts/make-beep.js       # regenerate assets/beep.wav (after editing freq/duration in the script)
node scripts/make-icons.js      # regenerate the full icon set (after editing COLORS/shapes in the script)
npx expo install <pkg>          # install deps so versions match SDK 54 — do NOT use `npm install` for Expo packages
```

There is **no test suite, no linter, no formatter** configured. Don't invent commands or invoke `npm test` / `npm run lint`. The only "is it working" gate is `tsc --noEmit` plus running the app in Expo Go.

## Architecture

Single-screen Expo app under `mobile/`. `App.tsx` is a thin `SafeAreaProvider` wrapper; everything else lives under `mobile/src/`. The tree below (and the `src/` / `scripts/` / `assets/` paths in the rest of this section) is relative to `mobile/`:

```
App.tsx                       SafeAreaProvider + <Scanner />
src/
  Scanner.tsx                 composes hooks + components, owns layering
  constants.ts                BARCODE_TYPES + timing constants
  flashcards.ts               typed deck keyed by UUID + getFlashcard() lookup
  hooks/
    useScannerBeep.ts         audio player + silent-mode setup, returns play()
    useBarcodeScan.ts         scan state, lock ref, same-code debounce
  components/
    Flashcard.tsx             full-screen blurred-backdrop card with looping video
    ResultCard.tsx            generic post-scan card for unrecognised codes
    PermissionGate.tsx        "Allow camera" screen
    ScannerChrome.tsx         Header / Reticle / Footer (small chrome bits)
```

Styles are co-located per component — there is no shared `styles.ts`. No routing, no state library; if you find yourself reaching for one, push back first.

### Three non-obvious things

1. **There is no tap-to-focus, and don't try to add one.** `expo-camera` only exposes a global `autofocus` mode (`'off'` = continuous autofocus, `'on'` = focus once then lock) with no "refocus now" trigger or point-of-interest API. The earlier toggle-the-prop workaround (`'off'` → `'on'` for ~80 ms → `'off'`) didn't actually trigger a refocus reliably in practice and was removed. The default continuous autofocus handles real-world scanning fine. If real point-of-interest focus is ever needed, the path is `react-native-vision-camera`, which means leaving Expo Go.

2. **`onBarcodeScanned` must stay attached to CameraView.** Setting it to `undefined` (e.g. while a result card is shown) makes CameraView tear down and re-init the native scanning pipeline, freezing the preview for ~1 s on both transitions. `useBarcodeScan` instead gates scans through a `lockedRef` so the handler stays attached for the camera's whole lifetime while still ignoring new codes while a result is on screen.

3. **Audio mode must be set to `playsInSilentMode: true`.** Without this, the beep is silent when the phone is in silent/vibrate mode — defeating the whole "satisfying cashier beep" point of the app. The call lives inside `useScannerBeep`'s `useEffect`; don't remove it.

### Flashcard flow

The deck is **fetched from the admin app**, not hardcoded. `useDeck` (`src/useDeck.ts`) loads it from `${EXPO_PUBLIC_API_URL}/api/public/deck` on launch and on foreground, caches it to disk (`src/flashcards.ts`, `expo-file-system` legacy API) for instant/offline startup, and exposes a synchronous `lookup(scanData)`. A scanned `bippy://<uuid>` (or legacy `bippy:<uuid>`) is parsed by `parseFlashcardId` and looked up in the fetched deck. On hit it takes over the screen with the `Flashcard` component (heavy blur, big name, looping video); a miss falls through to the generic `ResultCard`. Cards may omit `video` — the UI shows a "Video coming soon!" placeholder.

`video` is always a remote URL string now (public Vercel Blob URL stored in the DB). If `EXPO_PUBLIC_API_URL` is unset the deck is empty and every scan falls through to `ResultCard`. `scripts/upload-flashcard.js` still exists for manual Blob uploads, but cards are normally added via the admin app.

### Vercel Blob and the secret-token rule

`BLOB_READ_WRITE_TOKEN` lives only in `.env.local` (gitignored). `.env` is the committed template with empty values. **Never import `@vercel/blob` from anything under `src/`, `App.tsx`, or `index.ts`** — the SDK is for the Node upload script only. The token grants read+write to the bucket; bundling it (even via `EXPO_PUBLIC_*`) would let anyone with the IPA delete or overwrite the deck.

The app only ever sees the public URLs the upload script returns. To add a new card video:

```sh
npm run upload-flashcard ./path/to/video.mp4 --name "Giraffe"
```

The script prints a ready-to-paste `FLASHCARDS` entry with the URL.

### Asset pipeline

Both the beep (`assets/beep.wav`) and the icon set (`assets/icon.png`, `splash-icon.png`, `favicon.png`, `android-icon-*.png`) are **generated**, not hand-authored. To change them, edit the constants at the top of `scripts/make-beep.js` or `scripts/make-icons.js` and re-run. Do not replace the PNG/WAV files directly — the next regeneration will overwrite your edits.

`scripts/make-icons.js` depends on `sharp` (devDependency); it rasterises inline SVG. The icon symbol is sized to stay inside Android's adaptive-icon 66% safe zone, so the sparkle's position is deliberately conservative.

## The admin web app (`admin/`)

`admin/` is a **separate Next.js (App Router) project** — not part of the Expo app and not under the Expo toolchain. It has its own `package.json`, `node_modules`, `tsconfig.json`, and `.env.local`. Treat it as its own world:

- Run commands from inside `admin/`. Its gates are `npm run typecheck` (`tsc --noEmit`) and `npm run build`. There's still no linter/formatter.
- It uses **plain `npm install`** (it's not an Expo project — the "use `npx expo install`" rule does **not** apply here).
- `npm run seed` (idempotent) creates the schema from `db/schema.sql`, seeds the first admin, and migrates the original 3 cards. It reads `admin/.env.local` via `node --env-file`.

What it is: a browser tool to CRUD the flashcard deck (list/add/edit/delete + video upload) and manage the admin allow-list. Same warm theme; the icon is ported 1:1 from `mobile/scripts/make-icons.js` into `admin/components/BippyIcon.tsx` (and `admin/app/icon.svg`) — if the mobile icon's `COLORS`/shapes change, update those too.

### Non-obvious things about the admin app

1. **Neon Postgres is the source of truth, not the codebase.** Both the deck (`flashcards`) and the allow-list (`admins`) live in Neon (`admin/lib/db.ts`, `@neondatabase/serverless` HTTP driver). The old Blob `deck.json` store was removed. The driver is initialised **lazily** so `next build` / middleware don't need `DATABASE_URL` at import time — keep it that way.

2. **The mobile app reads the live deck** from the public `GET /api/public/deck` route (no auth — allow-listed in `middleware.ts` alongside `/api/auth`). It returns the deck as JSON (names + public video URLs only). The app sets its base URL via `EXPO_PUBLIC_API_URL`. Keep this route unauthenticated and free of secrets.

3. **Auth is the `admins` table, fail-closed.** Google sign-in via Auth.js (NextAuth v5); the `signIn` callback checks `isAdmin()`. An empty table locks everyone out — that's intentional. There is no `ALLOWED_EMAILS` env var anymore. The check runs at sign-in, so a removed admin keeps access until their JWT expires.

4. **Secrets in `admin/.env.local` (gitignored): `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`.** The Blob token must stay server-side — video upload uses a short-lived client token minted by `/api/upload`, never the raw token. `@vercel/blob` here is for video file storage only; the deck is in Postgres.

## SDK version is pinned for a reason

Expo SDK is pinned to **54** because that's what the App Store release of Expo Go supports. The project was originally bootstrapped on SDK 56 and rejected by Expo Go with an "incompatible version" error.

Before bumping the SDK, check [expo.dev/go](https://expo.dev/go) to confirm the new version is available in Expo Go. After changing `expo` in `package.json`, always run `npx expo install --fix` (and usually `rm -rf node_modules package-lock.json && npm install` to clear lingering peer-dep conflicts).

## Context that shapes design decisions

This is a **toy for the author's daughter to pretend-play cashier**, not a production app. Bias toward:

- Playful, kid-readable UI (big text, friendly copy, satisfying audio feedback)
- Simple flows with obvious "Scan again" reset buttons
- No analytics, accounts, scan history, or export — none of that fits the use case

When suggesting features, lean playful (e.g. fake price totals, a "cart" mode) over technical (e.g. clipboard export, history list).
