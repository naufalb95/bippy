# Bippy!

A pocket-sized barcode & QR scanner built in Expo + React Native.
Fun project for my daughter to pretend-play as a cashier at home — point it
at anything with a barcode, hear the satisfying _beep_, see the code.

## What it does

- Scans QR codes plus common 1D barcodes: EAN-13/8, UPC-A/E,
  Code 128/39/93, ITF-14, Codabar, PDF417, Aztec, Data Matrix.
- Plays a short beep on every scan (audio mode is configured so it
  plays even when the iPhone is on silent — important for a cashier).
- Shows the decoded value in a big result card with the code type.
- Tap anywhere on the camera preview to force a refocus (a green ring
  pops up at the tap point as feedback).
- Friendly debounce so holding the camera on the same barcode doesn't
  machine-gun the beep — same code within 1.2 s is ignored.

## Stack

- [Expo](https://expo.dev) SDK 54 (managed workflow)
- TypeScript (strict)
- [`expo-camera`](https://docs.expo.dev/versions/latest/sdk/camera/) `CameraView` for live scanning
- [`expo-audio`](https://docs.expo.dev/versions/latest/sdk/audio/) for the beep
- [`react-native-safe-area-context`](https://github.com/th3rdwave/react-native-safe-area-context) for `SafeAreaView`

The SDK version is pinned to **54** because that's what the App Store
release of Expo Go supports. If you bump it later, check
[expo.dev/go](https://expo.dev/go) first.

## Run it on your iPhone

1. Install **Expo Go** from the App Store.
2. Make sure your Mac and iPhone are on the same Wi-Fi.
3. From this folder:
   ```sh
   npm install
   npm start
   ```
4. Scan the QR shown in the terminal with the iPhone Camera app — tap
   the banner to open in Expo Go.
5. Approve camera permission on first launch.

If Wi-Fi discovery is flaky, press `s` in the Expo CLI to switch to
**Tunnel** mode and rescan the QR. Press `r` to reload, `?` for the
full key menu.

## Project layout

```
App.tsx                  scanner UI + scan/audio/focus logic
index.ts                 Expo root-component entry
app.json                 Expo config: name "Bippy!", camera permission, plugins
assets/
  beep.wav               generated scanner beep
  icon.png               app icon
  splash-icon.png        splash screen mark
  favicon.png            web favicon
  android-icon-*.png     Android adaptive + monochrome icon
scripts/
  make-beep.js           regenerate the beep (tweak freq/duration at top)
  make-icons.js          regenerate the icon set (tweak colors at top)
```

## Customising the beep

Edit `freq`, `durationSec`, or `amplitude` at the top of
`scripts/make-beep.js` and run:

```sh
node scripts/make-beep.js
```

It writes `assets/beep.wav`. Reload Expo Go to pick it up.

## Customising the icon

Edit the `COLORS` palette or shapes at the top of
`scripts/make-icons.js` and run:

```sh
node scripts/make-icons.js
```

It regenerates the whole icon set (iOS icon, splash, web favicon,
Android adaptive foreground/background, Android 13+ monochrome).

## Known limitations

- The custom **app icon** only shows up on the iPhone home screen after
  you build a standalone app (e.g. via EAS Build). In Expo Go you'll
  see the project's icon in the recent-projects list and on the splash
  screen, but the home-screen icon stays Expo Go's.
- `expo-camera` only exposes a global autofocus mode, not "focus at a
  specific point" — tap-to-focus refocuses globally rather than at the
  exact tap location.
