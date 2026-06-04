# Bippy!

A pocket-sized barcode & QR scanner that doubles as a flashcard game,
built in Expo + React Native. The cashier-toy version for my daughter:
point it at a barcode, hear the satisfying _beep_, see the code. Point
it at a special `bippy:<uuid>` QR sticker and a full-screen flashcard
takes over with the item's name and a looping video.

## Try the elephant card

The repo includes a sample QR — display it on another screen and scan
it with the app to see the flashcard flow without printing anything:

<p align="center">
  <img src="assets/sample-elephant-qr.png" alt="Sample elephant QR" width="240" />
</p>

It encodes `bippy:12812dd3-a9a2-4c93-97da-cc8cca0e8cd1` — Bippy! looks
that UUID up in the deck and shows the Elephant flashcard.

## What it does

- **Scans QR codes and 1D barcodes**: EAN-13/8, UPC-A/E, Code 128/39/93,
  Codabar, ITF-14, PDF417, Aztec, Data Matrix.
- **Plays a beep on every scan** — audio mode is configured so it
  plays even on silent (important for a cashier).
- **Recognises `bippy:<uuidv4>` QR codes** as flashcards. On hit, the
  whole screen takes over with a portrait video and the item's name.
  Unknown codes (or non-`bippy:` codes) fall through to a generic
  result card with the decoded text.
- **Same-code debounce** — holding the camera on one barcode doesn't
  re-fire the beep (1.2 s window).
- **Tap "Scan again"** to clear a result; there's no auto-dismiss so
  flashcard videos can play through.

## Stack

- [Expo](https://expo.dev) SDK 54 (managed workflow)
- TypeScript (strict)
- [`expo-camera`](https://docs.expo.dev/versions/latest/sdk/camera/) — `CameraView` for live scanning
- [`expo-audio`](https://docs.expo.dev/versions/latest/sdk/audio/) — the beep
- [`expo-video`](https://docs.expo.dev/versions/latest/sdk/video/) — flashcard video playback
- [`react-native-safe-area-context`](https://github.com/th3rdwave/react-native-safe-area-context) — `SafeAreaView`

The SDK version is pinned to **54** to match what the App Store
release of Expo Go supports. Check [expo.dev/go](https://expo.dev/go)
before bumping.

## Run it on your iPhone

1. Install **Expo Go** from the App Store.
2. Make sure your Mac and iPhone are on the same Wi-Fi.
3. From this folder:
   ```sh
   npm install
   npm start
   ```
4. Scan the Expo QR in the terminal with the iPhone Camera app, tap
   the banner to open in Expo Go.
5. Approve camera permission on first launch.
6. Point Bippy! at the elephant QR above.

If Wi-Fi discovery is flaky, press `s` in the Expo CLI to switch to
**Tunnel** mode and rescan. Press `r` to reload, `?` for the full menu.

## Project layout

```
App.tsx                       SafeAreaProvider + <Scanner />
index.ts                      Expo root-component entry
app.json                      Expo config: "Bippy!", permissions, plugins

src/
  Scanner.tsx                 composes hooks + components, owns layering
  constants.ts                BARCODE_TYPES + timing constants
  theme.ts                    color palette (light brown / warm cream)
  flashcards.ts               typed deck keyed by UUID + getFlashcard()
  hooks/
    useScannerBeep.ts         audio player + silent-mode setup
    useBarcodeScan.ts         scan state, lock ref, same-code debounce
  components/
    Flashcard.tsx             full-screen card with looping portrait video
    ResultCard.tsx            generic post-scan card for unrecognised codes
    PermissionGate.tsx        "Allow camera" screen
    ScannerChrome.tsx         header / reticle / footer (over camera)

assets/
  beep.wav                    generated scanner beep
  sample-elephant-qr.png      sample QR encoding the Elephant flashcard
  flashcards/videos/          bundled flashcard videos (optional; can be remote URLs)
  icon.png / splash-icon.png  app icon + splash
  favicon.png                 web favicon
  android-icon-*.png          Android adaptive + monochrome icon

scripts/
  make-beep.js                regenerate the beep
  make-icons.js               regenerate the icon set
  upload-flashcard.js         upload a flashcard video to Vercel Blob
```

## Adding your own flashcards

Each flashcard is a `{ id, name, video? }` entry in `src/flashcards.ts`
keyed by a UUIDv4. The QR sticker for it encodes `bippy:<that-uuid>`.

**Videos can be either:**

- **Bundled** — `video: require('../assets/flashcards/videos/giraffe.mp4')`.
  Works offline; ships inside the app bundle.
- **Remote URL** — `video: 'https://....public.blob.vercel-storage.com/...'`.
  Streams at scan time; keeps the app bundle small.

### Upload to Vercel Blob

For remote videos, there's a script that handles upload + prints the
ready-to-paste entry. One-time setup:

1. Create a Vercel Blob store on the Vercel dashboard.
2. Copy the read-write token into `.env.local`:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXX_YYYYYY
   ```
   `.env.local` is gitignored. The token only ever lives on your dev
   machine; the upload script (run from your laptop) uses it. The app
   itself never sees the token — only the public URL it returns.

Then:

```sh
npm run upload-flashcard ./giraffe.mp4 --name "Giraffe"
```

It prints:

```
✓ Uploaded.
  URL:     https://xxxx.public.blob.vercel-storage.com/flashcards/videos/...-giraffe.mp4

Paste this into FLASHCARDS in src/flashcards.ts:

  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx': {
    id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    name: 'Giraffe',
    video: 'https://xxxx.public.blob.vercel-storage.com/...',
  },
```

Paste the entry into `src/flashcards.ts`, then generate a QR encoding
`bippy:<that-uuid>` (any QR generator works) and print it as a sticker.

### Generating new QR stickers

Any online QR generator works — encode the string `bippy:<uuid>`.
A handful of options: [qrcode-monkey.com](https://www.qrcode-monkey.com/),
[goqr.me](https://goqr.me/), or `qrencode` in a terminal:

```sh
qrencode -o giraffe-qr.png -s 10 "bippy:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## Customising the beep

Edit `freq`, `durationSec`, or `amplitude` at the top of
`scripts/make-beep.js` and run:

```sh
node scripts/make-beep.js
```

It writes `assets/beep.wav`. Reload Expo Go to pick it up.

## Customising the icon

Edit the `COLORS` palette or shapes at the top of `scripts/make-icons.js`
and run:

```sh
node scripts/make-icons.js
```

It regenerates the whole icon set (iOS icon, splash, web favicon,
Android adaptive foreground/background, Android 13+ monochrome).

## Known limitations

- **`expo-camera` has no point-of-interest focus.** Continuous autofocus
  is on by default and handles real-world scanning fine, but there's
  no tap-to-focus-here API. The escape hatch would be migrating to
  `react-native-vision-camera`, which means leaving Expo Go.
- **Custom app icon only shows up in standalone builds** (EAS Build).
  In Expo Go you see the project icon in the recent-projects list and
  on splash, but the home-screen icon stays Expo Go's.
- **Remote (Vercel Blob) flashcard videos need network.** First scan
  after launch buffers briefly; later scans use the system video cache.
  Bundled videos work offline.
