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

This is a single-screen Expo app. The entire UI and logic lives in `App.tsx` — there is no `src/` directory, no routing library, and no state management library. **Resist the temptation to "structure" it** unless adding multiple genuinely distinct screens; the small surface area is intentional.

### Three non-obvious things about `App.tsx`

1. **CameraView's autofocus is global, not per-point.** `expo-camera` doesn't expose a "focus at coordinate" API. The tap-to-focus implementation works by toggling the `autofocus` prop `'off'` → `'on'` → back to `'off'` after ~80 ms, which forces the camera to re-run its focus routine. The green focus ring is purely visual feedback; the camera does not actually focus at that point. Don't "fix" this by trying to pass coordinates to CameraView — they're not supported. If real point-of-interest focus is ever needed, the path is `react-native-vision-camera`, which means leaving Expo Go.

2. **Layering order is load-bearing.** From back to front: `CameraView` (absoluteFill) → full-screen `Pressable` (tap-to-focus catcher) → focus-ring `Animated.View` (`pointerEvents="none"`) → `SafeAreaView` overlay (`pointerEvents="box-none"`). The `box-none` is what lets taps on empty overlay regions fall through to the Pressable below, while still letting the "Scan again" button receive its own taps. Reordering these or changing `pointerEvents` will silently break either tap-to-focus or the button.

3. **Audio mode must be set to `playsInSilentMode: true`.** Without this, the beep is silent when the phone is in silent/vibrate mode — defeating the whole "satisfying cashier beep" point of the app. The call lives in a `useEffect` at app start; don't remove it.

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
