/* ───────────────────────────────────────────────────────────
   ATMOS ASCII Engine - Adapted for Eds Terminal Portfolio
   Dynamic Typographical Rasterization, Directional Contour Edges & Atlas Blitting
   ─────────────────────────────────────────────────────────── */

export function getResolvedFont(varName: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return val ? `${val}, ${fallback}` : fallback;
}

export function getMonoFont(): string {
  return getResolvedFont('--font-ioskeley-mono', '"Ioskeley Mono", ui-monospace, SFMono-Regular, Menlo, monospace');
}

export const C = {
  ink: '#161616',     // Carbon Black base
  paper: '#FFFFFF',   // Crisp solid white glyphs
  graphite: '#A1A1AA',// Subdued gray for mid-density
  smoke: '#27272A',   // Border/void dust
  signal: '#FF6B00',  // Signature warm orange trail
} as const;

/** Density ramp — light → dense. Index 0 is empty. */
export const RAMP = ' .·:-=+*#%@';

/** Edge glyphs indexed by edge code (0 = none). */
export const EDGE = ['', '|', '/', '\\', '_', '¯'];

export const dprOf = () => (typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1);
export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function measureCell(fontSize: number, lineHeight: number, monoFont?: string) {
  if (typeof document === 'undefined') return { cellW: 7, cellH: 12 };
  const ctx = document.createElement('canvas').getContext('2d')!;
  const font = monoFont || getMonoFont();
  ctx.font = `400 ${fontSize}px ${font}`;
  return { cellW: ctx.measureText('M').width || fontSize * 0.6, cellH: fontSize * lineHeight };
}

export type Atlas = {
  canvas: HTMLCanvasElement;
  cw: number;
  ch: number;
  cellW: number;
  cellH: number;
  dpr: number;
};

/** Pre-render every glyph in every ink once — drawing becomes a cheap blit. */
export function makeAtlas(
  chars: string,
  inks: readonly string[],
  fontSize: number,
  lineHeight: number,
  dpr: number,
  monoFont?: string,
): Atlas {
  const font = monoFont || getMonoFont();
  const { cellW, cellH } = measureCell(fontSize, lineHeight, font);
  const cw = Math.ceil(cellW * dpr) + 4;
  const ch = Math.ceil(cellH * dpr) + 4;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, cw * chars.length);
  canvas.height = Math.max(1, ch * inks.length);
  const ctx = canvas.getContext('2d')!;
  ctx.font = `400 ${fontSize * dpr}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  inks.forEach((ink, j) => {
    ctx.fillStyle = ink;
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] !== ' ') ctx.fillText(chars[i], i * cw + cw / 2, j * ch + ch / 2);
    }
  });
  return { canvas, cw, ch, cellW, cellH, dpr };
}

export function blit(
  ctx: CanvasRenderingContext2D,
  a: Atlas,
  ci: number,
  ink: number,
  col: number,
  row: number,
  ox: number,
  oy: number,
) {
  const x = Math.round((ox + (col + 0.5) * a.cellW) * a.dpr - a.cw / 2);
  const y = Math.round((oy + (row + 0.5) * a.cellH) * a.dpr - a.ch / 2);
  ctx.drawImage(a.canvas, ci * a.cw, ink * a.ch, a.cw, a.ch, x, y, a.cw, a.ch);
}

export function fitCanvas(canvas: HTMLCanvasElement, w: number, h: number, dpr: number) {
  const W = Math.max(1, Math.round(w * dpr));
  const H = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return ctx;
}

export async function fontsReady(...specs: string[]) {
  if (typeof document === 'undefined') return;
  try {
    await Promise.race([
      Promise.all(specs.map((s) => document.fonts.load(s))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* fall back silently */
  }
}

export type TextOpts = {
  text: string;
  family: string;
  weight?: number | string;
  italic?: boolean;
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  padX?: number;
  padY?: number;
  tracking?: number;
};

/**
 * Rasterise a word into the character grid (4× supersampled).
 * Returns coverage per cell plus an edge code so contours can be
 * drawn with directional glyphs ( | / \ _ ¯ ) — crisp ASCII letterforms.
 */
export function sampleText(o: TextOpts) {
  const { text, family, cols, rows, cellW, cellH } = o;
  const weight = o.weight ?? 900;
  const padX = o.padX ?? 0.02;
  const padY = o.padY ?? 0.08;
  const tracking = o.tracking ?? 0;
  const SS = 4;
  const W = cols * cellW;
  const H = rows * cellH;
  const c = document.createElement('canvas');
  c.width = Math.max(1, cols * SS);
  c.height = Math.max(1, rows * SS);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.setTransform(SS / cellW, 0, 0, SS / cellH, 0, 0);
  const font = (px: number) => `${o.italic ? 'italic ' : ''}${weight} ${px}px ${family}`;
  ctx.font = font(100);
  const chars = Array.from(text);
  const adv = chars.map((ch) => ctx.measureText(ch).width);
  const trackPx = tracking * 100;
  const total = adv.reduce((s, v) => s + v, 0) + trackPx * (chars.length - 1);
  const m = ctx.measureText(text);
  const asc = m.actualBoundingBoxAscent || 72;
  const desc = m.actualBoundingBoxDescent || 0;
  const capH = ctx.measureText('H').actualBoundingBoxAscent || asc;
  const k = Math.min((W * (1 - 2 * padX)) / total, (H * (1 - 2 * padY)) / (asc + desc));
  ctx.font = font(100 * k);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  let x = (W - total * k) / 2;
  const base = (H - (asc + desc) * k) / 2 + asc * k;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, base);
    x += (adv[i] + trackPx) * k;
  });

  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const N = cols * rows;
  const cov = new Float32Array(N);
  const edge = new Uint8Array(N);
  const cw = c.width;
  const half = SS / 2;
  const norm = 255 * SS * half;
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      let s = 0;
      let L = 0;
      let R = 0;
      let T = 0;
      let B = 0;
      for (let yy = 0; yy < SS; yy++) {
        const rowBase = ((r * SS + yy) * cw + q * SS) * 4 + 3;
        for (let xx = 0; xx < SS; xx++) {
          const a = d[rowBase + xx * 4];
          s += a;
          if (xx < half) L += a;
          else R += a;
          if (yy < half) T += a;
          else B += a;
        }
      }
      const i = r * cols + q;
      const v = s / (255 * SS * SS);
      cov[i] = v;
      if (v > 0.16 && v < 0.84) {
        const nx = (R - L) / norm;
        const ny = (B - T) / norm;
        if (Math.hypot(nx, ny) > 0.35) {
          let ang = (Math.atan2(ny / cellH, nx / cellW) * 180) / Math.PI;
          if (ang < 0) ang += 180;
          if (ang < 22.5 || ang >= 157.5) edge[i] = 1;
          else if (ang < 67.5) edge[i] = 2;
          else if (ang < 112.5) edge[i] = ny > 0 ? 4 : 5;
          else edge[i] = 3;
        }
      }
    }
  }
  return { cov, edge, base, cap: base - capH * k };
}
