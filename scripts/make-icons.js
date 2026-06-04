// Generates the Bippy! app icon set into assets/.
// Design: rounded plate with a warm caramel→tan gradient, centered
// barcode in deep brown, a punchy terracotta scan line tilted for
// energy, three cream sparkles and two confetti dots (cream + soft
// yellow) sprinkled around. Reads playful + warm at small sizes.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const COLORS = {
  bgTop: '#E6CBA8',    // caramel — top of background gradient
  bgBot: '#C9A27A',    // brand light brown — bottom of background gradient
  bars: '#3C2E20',     // deep brown — barcode bars
  scan: '#DC6B4C',     // punchy terracotta — scan line (energetic)
  sparkle: '#FAF5EE',  // cream — sparkles
  confettiYellow: '#F2C76C', // soft sunshine — small confetti pop
};

const ASSETS = path.join(__dirname, '..', 'assets');
const SIZE = 1024;

function star4(cx, cy, r, fill) {
  // 4-point sparkle/diamond star.
  return `<path transform="translate(${cx} ${cy})"
    d="M 0 -${r} Q ${r * 0.18} -${r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q -${r * 0.18} ${r * 0.18} -${r} 0 Q -${r * 0.18} -${r * 0.18} 0 -${r} Z"
    fill="${fill}" />`;
}

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

  // Scan line — tilted a few degrees for a playful "in motion" feel,
  // extending past the bars on both sides.
  const lineH = SIZE * 0.05;
  const lineY = barAreaY + barAreaH * 0.6 - lineH / 2;
  const lineX = barAreaX - SIZE * 0.055;
  const lineW = barAreaW + SIZE * 0.11;
  const lineFill = mode === 'monochrome' ? '#fff' : COLORS.scan;
  const scanLine = `<g transform="rotate(-3 ${center} ${center})"><rect x="${lineX}" y="${lineY}" width="${lineW}" height="${lineH}" rx="${lineH / 2}" fill="${lineFill}" /></g>`;

  // Decorative confetti only on the full design — monochrome stays clean.
  if (mode !== 'full') return bars + scanLine;

  // Three sparkles of varying sizes — top-right (large), top-left (small),
  // bottom-right (small). Inside the safe zone so Android crop won't trim.
  const sparkles =
    star4(SIZE * 0.77, SIZE * 0.21, SIZE * 0.065, COLORS.sparkle) +
    star4(SIZE * 0.20, SIZE * 0.20, SIZE * 0.032, COLORS.sparkle) +
    star4(SIZE * 0.82, SIZE * 0.78, SIZE * 0.038, COLORS.sparkle);

  // Confetti dots — small splashes of warm accent colors.
  const dots =
    `<circle cx="${SIZE * 0.16}" cy="${SIZE * 0.78}" r="${SIZE * 0.022}" fill="${COLORS.confettiYellow}" />` +
    `<circle cx="${SIZE * 0.30}" cy="${SIZE * 0.84}" r="${SIZE * 0.014}" fill="${COLORS.sparkle}" />` +
    `<circle cx="${SIZE * 0.70}" cy="${SIZE * 0.86}" r="${SIZE * 0.018}" fill="${COLORS.confettiYellow}" />`;

  return bars + scanLine + sparkles + dots;
}

function gradientDef() {
  return `<defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.bgTop}" />
      <stop offset="100%" stop-color="${COLORS.bgBot}" />
    </linearGradient>
  </defs>`;
}

function svg({ withBackground, mode }) {
  const bg = withBackground
    ? gradientDef() + `<rect width="${SIZE}" height="${SIZE}" rx="${SIZE * 0.22}" fill="url(#bg)" />`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    ${bg}
    ${symbol(mode)}
  </svg>`;
}

function solidBgSVG() {
  // Android adaptive plate — solid colour (no gradients allowed by
  // the adaptive-icon spec), pick the deeper of the two for richness.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="${COLORS.bgBot}" /></svg>`;
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

  // iOS / generic app icon — full design with rounded gradient bg.
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
