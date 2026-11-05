"use client";

import React, { useEffect, useRef } from "react";
import { Grid, palette, gradient, rotX, rotY } from "ascii-magic-art/lib/kit.js";
import { frameHTML } from "ascii-magic-art/runtime/player.js";

interface SpinningAsciiEdsProps {
  compact?: boolean;
}

const FONT7: Record<string, string> = {
  E: "#####|#....|#....|####.|#....|#....|#####",
  D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  S: ".###.|#...#|#....|.###.|....#|#...#|.###.",
  " ": ".....|.....|.....|.....|.....|.....|.....",
};

const GL7: Record<string, string[]> = {};
for (const k in FONT7) {
  GL7[k] = FONT7[k].split("|");
}

function textMask(word: string, sx = 1, sy = 1, gap = 2) {
  const cw = 5 * sx + gap;
  const w = word.length * cw - gap;
  const h = 7 * sy;
  const m = new Uint8Array(w * h);

  [...word].forEach((c, k) => {
    const gl = GL7[c] || GL7[" "];
    for (let j = 0; j < 7; j++) {
      for (let i = 0; i < 5; i++) {
        if (gl[j][i] === "#") {
          for (let a = 0; a < sy; a++) {
            for (let b = 0; b < sx; b++) {
              const p = k * cw + i * sx + b + (j * sy + a) * w;
              m[p] = 1;
            }
          }
        }
      }
    }
  });

  return {
    w,
    h,
    at: (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? m[x + y * w] : 0),
  };
}

// Brand terminal colors: Mint green face lighting with deep emerald side extrusion
const FACE = gradient(["#1C4532", "#276749", "#48BB78", "#9AE6B4", "#D1FAE5"], 8);
const SIDE = gradient(["#0A1A12", "#133023", "#22543D", "#2F855A", "#48BB78"], 8);
const BRAND_PALETTE = palette([...FACE, ...SIDE]);
const SH = "░▒▓█";

export function SpinningAsciiEds({ compact = false }: SpinningAsciiEdsProps) {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const cols = compact ? 38 : 54;
    const rows = compact ? 12 : 16;
    const g = new Grid(cols, rows);

    const mask = textMask("EDS", 1, 1, compact ? 1 : 2);
    const w = mask.w;
    const h = mask.h;
    const depth = 1.6;

    // Sample points on exposed voxel faces
    type Ptr = [number, number, number, [number, number, number], number];
    const pts: Ptr[] = [];
    const samples = 4;

    const addPoint = (
      fx: number,
      fy: number,
      fz: number,
      normal: [number, number, number],
      isFront: number
    ) => {
      pts.push([fx - w / 2, h / 2 - fy, fz, normal, isFront]);
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!mask.at(x, y)) continue;

        for (let i = 0; i < samples; i++) {
          for (let j = 0; j < samples; j++) {
            const u = (i + 0.5) / samples;
            const v = (j + 0.5) / samples;
            addPoint(x + u, y + v, depth / 2, [0, 0, 1], 1);
            addPoint(x + u, y + v, -depth / 2, [0, 0, -1], 1);

            const zOffset = (v - 0.5) * depth;
            if (!mask.at(x - 1, y)) addPoint(x, y + u, zOffset, [-1, 0, 0], 0);
            if (!mask.at(x + 1, y)) addPoint(x + 1, y + u, zOffset, [1, 0, 0], 0);
            if (!mask.at(x, y - 1)) addPoint(x + u, y, zOffset, [0, 1, 0], 0);
            if (!mask.at(x, y + 1)) addPoint(x + u, y + 1, zOffset, [0, -1, 0], 0);
          }
        }
      }
    }

    const lightDir = [0.32, 0.42, 0.85];
    const scale = compact ? 1.85 : 2.5;
    const startTime = performance.now();
    let animId = 0;

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001;

      // Oscillating 3D sway from extruded-word-spin
      const ay = Math.sin(elapsed * 0.9) * 0.62;
      const ax = 0.22 + Math.sin(elapsed * 0.6) * 0.1;

      g.clear();

      for (let i = 0; i < pts.length; i++) {
        const [px, py, pz, normVec, isFace] = pts[i];

        const rotP = rotX(rotY([px, py, pz], ay), ax);
        const rotN = rotX(rotY(normVec, ay), ax);

        // Discard rear-facing faces
        if (rotN[2] < -0.05) continue;

        const depthFactor = 48 / (48 - rotP[2]);
        const sx = cols / 2 + rotP[0] * scale * depthFactor;
        const sy = rows / 2 - rotP[1] * scale * 0.5 * depthFactor * 1.15;

        const lit =
          0.2 +
          0.8 *
            Math.max(
              0,
              rotN[0] * lightDir[0] + rotN[1] * lightDir[1] + rotN[2] * lightDir[2]
            );

        const colorIndex = Math.min(7, Math.floor(lit * 7.99));
        const shadeIndex = Math.min(3, Math.floor(lit * 4));

        g.setZ(
          sx,
          sy,
          rotP[2],
          SH[shadeIndex],
          isFace ? "01234567"[colorIndex] : "89abcdef"[colorIndex]
        );
      }

      if (preRef.current) {
        preRef.current.innerHTML = frameHTML(g.frame(), BRAND_PALETTE);
      }

      animId = requestAnimationFrame(render);
    };

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      render(startTime);
      cancelAnimationFrame(animId);
      return;
    }

    animId = requestAnimationFrame(render);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [compact]);

  return (
    <div
      className={`select-none flex justify-center items-center py-2 font-mono transition-all max-w-full overflow-hidden ${
        compact
          ? "text-[8px] sm:text-[9px] leading-[1.08]"
          : "text-[9.5px] sm:text-xs md:text-sm leading-[1.12]"
      }`}
    >
      <pre
        ref={preRef}
        aria-label="EDS 3D ASCII Logo"
        className="font-mono whitespace-pre transition-opacity"
      />
    </div>
  );
}
