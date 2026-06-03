# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm start                       # Metro + Expo dev server (test on physical iPhone via Expo Go)
npx tsc --noEmit                # typecheck (strict mode); no other test/lint setup
node scripts/make-beep.js       # regenerate assets/beep.wav (after editing freq/duration in the script)
node scripts/make-icons.js      # regenerate the full icon set (after editing COLORS/shapes in the script)
npx expo install <pkg>          # install deps so versions match SDK 54 — do NOT use `npm install` for Expo packages
```

There is **no test suite, no linter, no formatter** configured. Don't invent commands or invoke `npm test` / `npm run lint`. The only "is it working" gate is `tsc --noEmit` plus running the app in Expo Go.

## Architecture

Single-screen Expo app. `App.tsx` is a thin `SafeAreaProvider` wrapper; everything else lives under `src/`:

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

A QR encoding `bippy:<uuidv4>` is looked up in `src/flashcards.ts` and, on hit, takes over the screen with a `Flashcard` component (heavy blur over the live camera, big name, looping video). Unknown UUIDs fall through to the generic `ResultCard`. Cards may omit the `video` field — the UI shows a "Video coming soon!" placeholder so a card can exist before its media is added. Video files live in `assets/flashcards/videos/` and are referenced via `require()`.

### Asset pipeline

Both the beep (`assets/beep.wav`) and the icon set (`assets/icon.png`, `splash-icon.png`, `favicon.png`, `android-icon-*.png`) are **generated**, not hand-authored. To change them, edit the constants at the top of `scripts/make-beep.js` or `scripts/make-icons.js` and re-run. Do not replace the PNG/WAV files directly — the next regeneration will overwrite your edits.

`scripts/make-icons.js` depends on `sharp` (devDependency); it rasterises inline SVG. The icon symbol is sized to stay inside Android's adaptive-icon 66% safe zone, so the sparkle's position is deliberately conservative.

## SDK version is pinned for a reason

Expo SDK is pinned to **54** because that's what the App Store release of Expo Go supports. The project was originally bootstrapped on SDK 56 and rejected by Expo Go with an "incompatible version" error.

Before bumping the SDK, check [expo.dev/go](https://expo.dev/go) to confirm the new version is available in Expo Go. After changing `expo` in `package.json`, always run `npx expo install --fix` (and usually `rm -rf node_modules package-lock.json && npm install` to clear lingering peer-dep conflicts).

## Context that shapes design decisions

This is a **toy for the author's daughter to pretend-play cashier**, not a production app. Bias toward:

- Playful, kid-readable UI (big text, friendly copy, satisfying audio feedback)
- Simple flows with obvious "Scan again" reset buttons
- No analytics, accounts, scan history, or export — none of that fits the use case

When suggesting features, lean playful (e.g. fake price totals, a "cart" mode) over technical (e.g. clipboard export, history list).
