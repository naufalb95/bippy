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
  hooks/
    useScannerBeep.ts         audio player + silent-mode setup, returns play()
    useTapFocus.ts            autofocus toggle + focus-ring animation
    useBarcodeScan.ts         scan state, same-code debounce, auto-dismiss
  components/
    FocusRing.tsx             animated green ring at tap point
    ResultCard.tsx            post-scan card with "Scan again" button
    PermissionGate.tsx        "Allow camera" screen
    ScannerChrome.tsx         Header / Reticle / Footer (small chrome bits)
```

Styles are co-located per component — there is no shared `styles.ts`. No routing, no state library; if you find yourself reaching for one, push back first.

### Three non-obvious things

1. **CameraView's autofocus is global, not per-point.** `expo-camera` doesn't expose a "focus at coordinate" API. `useTapFocus` works by toggling the `autofocus` prop `'off'` → `'on'` → back to `'off'` after ~80 ms (see `REFOCUS_TOGGLE_MS`), forcing the camera to re-run its focus routine. The green `FocusRing` is purely visual feedback; the camera does not actually focus at that point. Don't "fix" this by trying to pass coordinates to CameraView — they're not supported. If real point-of-interest focus is ever needed, the path is `react-native-vision-camera`, which means leaving Expo Go.

2. **Layering order in `Scanner.tsx` is load-bearing.** From back to front: `CameraView` (absoluteFill) → full-screen `Pressable` (tap-to-focus catcher) → `FocusRing` (`pointerEvents="none"`) → `SafeAreaView` overlay (`pointerEvents="box-none"`). The `box-none` is what lets taps on empty overlay regions fall through to the Pressable below, while still letting the "Scan again" button receive its own taps. Reordering these or changing `pointerEvents` will silently break either tap-to-focus or the button.

3. **Audio mode must be set to `playsInSilentMode: true`.** Without this, the beep is silent when the phone is in silent/vibrate mode — defeating the whole "satisfying cashier beep" point of the app. The call lives inside `useScannerBeep`'s `useEffect`; don't remove it.

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
