"use client";

import React, { useEffect, useRef } from "react";
import {
  C,
  RAMP,
  blit,
  dprOf,
  fitCanvas,
  fontsReady,
  getMonoFont,
  getResolvedFont,
  makeAtlas,
  reducedMotion,
  sampleText,
  type Atlas,
} from "@/lib/ascii";

interface LivingAsciiEdsProps {
  compact?: boolean;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
}

const CHARS = RAMP + '|/\\_¯~';
const G = { dot: 1, mid: 2, colon: 3, dash: 4, tilde: 16 };
const EDGE_I = [0, 11, 12, 13, 14, 15];
const INK_PAPER = 0;    // White
const INK_GRAPHITE = 1; // Subtle gray
const INK_SIGNAL = 2;   // Orange trail
const INK_SMOKE = 3;    // Void air streaks

type Streak = { x: number; y: number; len: number; v: number };

export function LivingAsciiEds({ compact = false }: LivingAsciiEdsProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const reduce = reducedMotion();
    let atlas: Atlas | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let cols = 0;
    let rows = 0;
    let ox = 0;
    let oy = 0;
    let cov = new Float32Array(0);
    let wind = new Float32Array(0);
    let rnd = new Float32Array(0);
    let edge = new Uint8Array(0);
    let streaks: Streak[] = [];
    let raf = 0;
    let visible = false;
    let disposed = false;
    let last = performance.now();
    let introAt = -1;
    let nextGust = 0;
    let lastPointer = -1e9;
    let gust: { t0: number; ph: number; px: number; py: number } | null = null;
    let prev: { x: number; y: number } | null = null;
    let buildId = 0;

    const newStreak = (anywhere: boolean): Streak => ({
      x: anywhere ? Math.random() * cols : -Math.random() * cols * 0.35,
      y: Math.floor(Math.random() * rows),
      len: 4 + Math.floor(Math.random() * 14),
      v: 4 + Math.random() * 10,
    });

    const inject = (x: number, y: number, s: number) => {
      const RX = Math.max(2.5, cols / 36);
      const RY = Math.max(1.5, RX * 0.45);
      const x0 = Math.max(0, Math.floor(x - RX));
      const x1 = Math.min(cols - 1, Math.ceil(x + RX));
      const y0 = Math.max(0, Math.floor(y - RY));
      const y1 = Math.min(rows - 1, Math.ceil(y + RY));
      for (let r = y0; r <= y1; r++) {
        for (let q = x0; q <= x1; q++) {
          const d = Math.hypot((q - x) / RX, (r - y) / RY);
          if (d < 1) {
            const i = r * cols + q;
            wind[i] = Math.min(1, wind[i] + (1 - d) * s);
          }
        }
      }
    };

    const stroke = (x0: number, y0: number, x1: number, y1: number, s: number) => {
      const dist = Math.hypot(x1 - x0, (y1 - y0) * 2);
      const steps = Math.max(1, Math.ceil(dist / 1.5));
      for (let k = 1; k <= steps; k++) {
        inject(x0 + ((x1 - x0) * k) / steps, y0 + ((y1 - y0) * k) / steps, s);
      }
    };

    const draw = (now: number, dt: number) => {
      if (!ctx || !atlas) return;
      const a = atlas;
      const t = now / 1000;
      const intro = 1;

      if (dt > 0) {
        const k = Math.pow(0.95, dt * 60);
        for (let i = 0; i < wind.length; i++) wind[i] *= k;
      }

      // Ambient gusts keep the emblem lively when idle
      if (!compact && !reduce && intro >= 1) {
        if (!gust && t > nextGust && now - lastPointer > 3500) {
          gust = { t0: t, ph: Math.random() * 6.28, px: -4, py: rows / 2 };
          nextGust = t + 8 + Math.random() * 5;
        }
        if (gust) {
          const p = (t - gust.t0) / 2.2;
          if (p >= 1) gust = null;
          else {
            const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            const x = -4 + (cols + 8) * e;
            const y = rows * (0.5 + 0.25 * Math.sin(p * Math.PI * 2 + gust.ph));
            stroke(gust.px, gust.py, x, y, 0.35);
            gust.px = x;
            gust.py = y;
          }
        }
      }

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Ambient air streaks in void (Hero view only)
      if (!compact && intro > 0.3) {
        for (const s of streaks) {
          if (dt > 0) s.x += s.v * dt;
          if (s.x - s.len > cols) Object.assign(s, newStreak(false));
          const head = Math.floor(s.x);
          for (let k = 0; k < s.len; k++) {
            const q = head - k;
            if (q < 0 || q >= cols) continue;
            if (cov[s.y * cols + q] > 0.04) continue;
            blit(ctx, a, k === 0 ? G.tilde : k < s.len * 0.6 ? G.dash : G.mid, INK_SMOKE, q, s.y, ox, oy);
          }
        }
      }

      // Render ASCII glyphs
      for (let r = 0; r < rows; r++) {
        for (let q = 0; q < cols; q++) {
          const i = r * cols + q;
          let c = cov[i];
          const w = wind[i];

          if (intro < 1) {
            const th = rnd[i];
            if (th > intro) {
              if (c > 0.05 && th < intro + 0.08) {
                blit(ctx, a, 1 + ((Math.random() * 10) | 0), INK_SIGNAL, q, r, ox, oy);
              }
              continue;
            }
          }

          if (c > 0.04) {
            if (w > 0.02) c *= 1 - Math.min(0.96, w * 1.25);
            if (c <= 0.04) {
              if (w > 0.06) {
                blit(ctx, a, w > 0.55 ? G.tilde : w > 0.25 ? G.dash : G.mid, INK_SIGNAL, q, r, ox, oy);
              }
              continue;
            }

            let ci: number;
            let ink = INK_PAPER;
            const e = edge[i];

            if (e && w < 0.1) {
              ci = EDGE_I[e];
            } else if (c > 0.88) {
              ci = 8 + ((rnd[i] * 3) | 0);
            } else {
              ci = 1 + Math.min(9, Math.floor(c * 10));
              if (c < 0.35) ink = INK_GRAPHITE;
            }

            if (w > 0.12) ink = INK_SIGNAL;

            // Micro-shimmer: subtle breathing of glyphs
            if (!reduce && Math.random() < 0.0015) {
              ci = 1 + ((Math.random() * 10) | 0);
            }

            blit(ctx, a, ci, ink, q, r, ox, oy);
          } else if (w > 0.07) {
            blit(ctx, a, w > 0.55 ? G.tilde : w > 0.25 ? G.dash : G.mid, INK_SIGNAL, q, r, ox, oy);
          }
        }
      }
    };

    const build = async () => {
      const id = ++buildId;
      const family = getResolvedFont('--font-bodoni-moda', '"Bodoni Moda", serif');
      const monoFont = getMonoFont();
      const weight = 900;

      await fontsReady(`900 100px ${family}`, `400 12px ${monoFont}`);
      if (disposed || id !== buildId) return;

      const W = wrap.clientWidth;
      const H = wrap.clientHeight;
      if (W < 20 || H < 10) return;

      const dpr = dprOf();
      const fs = compact
        ? Math.max(4.5, Math.min(7.5, W / 48))
        : Math.max(6, Math.min(10.5, W / 85));

      atlas = makeAtlas(
        CHARS,
        [C.paper, C.graphite, C.signal, C.smoke],
        fs,
        1.12,
        dpr,
        monoFont
      );

      cols = Math.max(4, Math.floor(W / atlas.cellW));
      rows = Math.max(2, Math.floor(H / atlas.cellH));
      ox = (W - cols * atlas.cellW) / 2;
      oy = (H - rows * atlas.cellH) / 2;

      const s = sampleText({
        text: "EDS",
        family,
        weight,
        cols,
        rows,
        cellW: atlas.cellW,
        cellH: atlas.cellH,
        padX: compact ? 0.04 : 0.08,
        padY: compact ? 0.04 : 0.06,
        tracking: 0.05,
      });

      cov = s.cov;
      edge = s.edge;
      const N = cols * rows;
      wind = new Float32Array(N);
      rnd = new Float32Array(N);
      for (let i = 0; i < N; i++) rnd[i] = Math.random();

      streaks = compact
        ? []
        : Array.from({ length: Math.max(4, Math.round(N / 320)) }, () => newStreak(true));

      ctx = fitCanvas(canvas, W, H, dpr);
      draw(performance.now(), 0);
    };

    const loop = (now: number) => {
      if (!visible || reduce) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(now, dt);
    };

    const onMove = (e: PointerEvent) => {
      if (compact || !atlas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - ox) / atlas.cellW;
      const y = (e.clientY - rect.top - oy) / atlas.cellH;
      lastPointer = performance.now();
      if (prev) {
        const sp = Math.hypot(x - prev.x, (y - prev.y) * 2);
        stroke(prev.x, prev.y, x, y, Math.min(0.9, 0.2 + sp / 12));
      }
      prev = { x, y };
    };

    const onLeave = () => {
      prev = null;
    };

    if (!compact) {
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);
    }

    const io = new IntersectionObserver(
      ([en]) => {
        visible = en.isIntersecting;
        if (visible && !raf && !reduce) {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        }
      },
      { rootMargin: "120px" }
    );
    io.observe(wrap);

    let tm = 0;
    let lastW = 0;
    let lastH = 0;
    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return;
      lastW = w;
      lastH = h;
      window.clearTimeout(tm);
      tm = window.setTimeout(build, 140);
    });
    ro.observe(wrap);

    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(tm);
      if (!compact) {
        wrap.removeEventListener("pointermove", onMove);
        wrap.removeEventListener("pointerleave", onLeave);
      }
    };
  }, [compact]);

  return (
    <div
      ref={wrapRef}
      className={`relative select-none ${
        compact
          ? "aspect-[3.2/1] w-36 mx-auto cursor-default pointer-events-none"
          : "aspect-[3.6/1] w-full max-w-xl mx-auto cursor-crosshair"
      }`}
      aria-label="EDS ASCII Typographical Emblem"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />
    </div>
  );
}
