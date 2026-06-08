// The Bippy! mark, ported 1:1 from scripts/make-icons.js so the admin
// header reads as the same app. Rounded caramel->tan plate, deep-brown
// barcode, tilted terracotta scan line, cream sparkles + confetti.

const COLORS = {
  bgTop: "#E6CBA8",
  bgBot: "#C9A27A",
  bars: "#3C2E20",
  scan: "#DC6B4C",
  sparkle: "#FAF5EE",
  confettiYellow: "#F2C76C",
};

const SIZE = 1024;

function star4(cx: number, cy: number, r: number, fill: string) {
  return (
    <path
      transform={`translate(${cx} ${cy})`}
      d={`M 0 -${r} Q ${r * 0.18} -${r * 0.18} ${r} 0 Q ${r * 0.18} ${
        r * 0.18
      } 0 ${r} Q -${r * 0.18} ${r * 0.18} -${r} 0 Q -${r * 0.18} -${
        r * 0.18
      } 0 -${r} Z`}
      fill={fill}
    />
  );
}

function Symbol() {
  const center = SIZE / 2;
  const barAreaW = SIZE * 0.46;
  const barAreaH = SIZE * 0.46;
  const barAreaX = center - barAreaW / 2;
  const barAreaY = center - barAreaH / 2;

  const widths = [4, 2, 3, 2, 5, 2, 3];
  const totalUnits = widths.reduce((a, b) => a + b, 0) + (widths.length - 1);
  const unit = barAreaW / totalUnits;

  let cursor = barAreaX;
  const bars = widths.map((w, i) => {
    const bw = w * unit;
    const rect = (
      <rect
        key={i}
        x={cursor}
        y={barAreaY}
        width={bw}
        height={barAreaH}
        rx={Math.min(unit * 0.45, 16)}
        fill={COLORS.bars}
      />
    );
    cursor += bw + unit;
    return rect;
  });

  const lineH = SIZE * 0.05;
  const lineY = barAreaY + barAreaH * 0.6 - lineH / 2;
  const lineX = barAreaX - SIZE * 0.055;
  const lineW = barAreaW + SIZE * 0.11;

  return (
    <>
      {bars}
      <g transform={`rotate(-3 ${center} ${center})`}>
        <rect
          x={lineX}
          y={lineY}
          width={lineW}
          height={lineH}
          rx={lineH / 2}
          fill={COLORS.scan}
        />
      </g>
      {star4(SIZE * 0.77, SIZE * 0.21, SIZE * 0.065, COLORS.sparkle)}
      {star4(SIZE * 0.2, SIZE * 0.2, SIZE * 0.032, COLORS.sparkle)}
      {star4(SIZE * 0.82, SIZE * 0.78, SIZE * 0.038, COLORS.sparkle)}
      <circle cx={SIZE * 0.16} cy={SIZE * 0.78} r={SIZE * 0.022} fill={COLORS.confettiYellow} />
      <circle cx={SIZE * 0.3} cy={SIZE * 0.84} r={SIZE * 0.014} fill={COLORS.sparkle} />
      <circle cx={SIZE * 0.7} cy={SIZE * 0.86} r={SIZE * 0.018} fill={COLORS.confettiYellow} />
    </>
  );
}

export function BippyIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Bippy!"
    >
      <defs>
        <linearGradient id="bippy-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={COLORS.bgTop} />
          <stop offset="100%" stopColor={COLORS.bgBot} />
        </linearGradient>
      </defs>
      <rect width={SIZE} height={SIZE} rx={SIZE * 0.22} fill="url(#bippy-bg)" />
      <Symbol />
    </svg>
  );
}
