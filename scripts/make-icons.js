// Generates the Bippy! app icon set into assets/.
// Design: rounded sunshine-yellow square, centered barcode in indigo,
// a hot-pink scan line cutting across, and a tiny white sparkle that
// hints "scanned!" — kid-friendly and readable at small sizes.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const COLORS = {
  yellow: '#FFC93C',
  bars: '#1E1B4B',
  scan: '#FF3B6F',
  white: '#FFFFFF',
};

const ASSETS = path.join(__dirname, '..', 'assets');
const SIZE = 1024;

function symbol(mode /* 'full' | 'monochrome' */) {
  const center = SIZE / 2;

  // Barcode area — kept inside Android's 66% safe zone (≈ 170..854 on 1024).
  const barAreaW = SIZE * 0.46;
  const barAreaH = SIZE * 0.46;
  const barAreaX = center - barAreaW / 2;
  const barAreaY = center - barAreaH / 2;

  const widths = [4, 2, 3, 2, 5, 2, 3];
  const totalUnits = widths.reduce((a, b) => a + b, 0) + (widths.length - 1);
  const unit = barAreaW / totalUnits;

  const barFill = mode === 'monochrome' ? '#fff' : COLORS.bars;
  let cursor = barAreaX;
  let bars = '';
  for (const w of widths) {
    const bw = w * unit;
    bars += `<rect x="${cursor}" y="${barAreaY}" width="${bw}" height="${barAreaH}" rx="${Math.min(unit * 0.45, 16)}" fill="${barFill}" />`;
    cursor += bw + unit;
  }

  // Scan line — across the bars, a touch below center.
  const lineH = SIZE * 0.045;
  const lineY = barAreaY + barAreaH * 0.6 - lineH / 2;
  const lineX = barAreaX - SIZE * 0.045;
  const lineW = barAreaW + SIZE * 0.09;
  const lineFill = mode === 'monochrome' ? '#fff' : COLORS.scan;
  const scanLine = `<rect x="${lineX}" y="${lineY}" width="${lineW}" height="${lineH}" rx="${lineH / 2}" fill="${lineFill}" />`;

  // Sparkle (4-point star) — inside safe zone so adaptive crop won't eat it.
  let sparkle = '';
  if (mode === 'full') {
    const cx = SIZE * 0.74;
    const cy = SIZE * 0.26;
    const r = SIZE * 0.055;
    // Diamond-ish star via two crossed quads → one path.
    sparkle = `<path transform="translate(${cx} ${cy})"
      d="M 0 -${r} Q ${r * 0.18} -${r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q -${r * 0.18} ${r * 0.18} -${r} 0 Q -${r * 0.18} -${r * 0.18} 0 -${r} Z"
      fill="${COLORS.white}" />`;
  }

  return bars + scanLine + sparkle;
}

function svg({ withBackground, mode }) {
  const bg = withBackground
    ? `<rect width="${SIZE}" height="${SIZE}" rx="${SIZE * 0.22}" fill="${COLORS.yellow}" />`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    ${bg}
    ${symbol(mode)}
  </svg>`;
}

function solidBgSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="${COLORS.yellow}" /></svg>`;
}

async function render(svgString, outPath, outSize) {
  await sharp(Buffer.from(svgString))
    .resize(outSize, outSize)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log('  ✓', path.basename(outPath), `(${outSize}px)`);
}

(async () => {
  if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });
  console.log('Generating Bippy! icons →', ASSETS);

  // iOS / generic app icon — full design with rounded yellow bg.
  await render(svg({ withBackground: true, mode: 'full' }), path.join(ASSETS, 'icon.png'), 1024);

  // Splash icon — same design works (Expo centers it on the splash screen).
  await render(svg({ withBackground: true, mode: 'full' }), path.join(ASSETS, 'splash-icon.png'), 1024);

  // Web favicon.
  await render(svg({ withBackground: true, mode: 'full' }), path.join(ASSETS, 'favicon.png'), 192);

  // Android adaptive — foreground (transparent bg, symbol only, inside safe zone).
  await render(svg({ withBackground: false, mode: 'full' }), path.join(ASSETS, 'android-icon-foreground.png'), 1024);

  // Android adaptive — solid background.
  await render(solidBgSVG(), path.join(ASSETS, 'android-icon-background.png'), 1024);

  // Android 13+ themed icon — monochrome silhouette.
  await render(svg({ withBackground: false, mode: 'monochrome' }), path.join(ASSETS, 'android-icon-monochrome.png'), 1024);

  console.log('Done.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
