"use client";

import React, { useEffect, useRef, useState } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  isFront: boolean;
}

interface SpinningAsciiEdsProps {
  compact?: boolean;
}

export function SpinningAsciiEds({ compact = false }: SpinningAsciiEdsProps) {
  const [frame, setFrame] = useState<string>("");
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    // 7x9 clean block letter bitmaps for "E D S" with equal column widths
    const letterE = [
      "1111111",
      "1100000",
      "1100000",
      "1111110",
      "1111110",
      "1100000",
      "1100000",
      "1111111",
      "1111111",
    ];

    const letterD = [
      "1111110",
      "1100011",
      "1100001",
      "1100001",
      "1100001",
      "1100001",
      "1100011",
      "1111110",
      "1111110",
    ];

    const letterS = [
      "0111111",
      "1100001",
      "1100000",
      "0111110",
      "0000011",
      "0000011",
      "1000011",
      "1111110",
      "0111100",
    ];

    const letters = [
      { map: letterE, offsetX: -11 },
      { map: letterD, offsetX: -0.5 },
      { map: letterS, offsetX: 10 },
    ];

    const points: Point3D[] = [];
    const subStep = 0.3; // Dense sampling so letters render solid without gaps
    const frontZ = 1.0;
    const backZ = -1.0;
    const depthSlices = 6;

    letters.forEach(({ map, offsetX }) => {
      const height = map.length;
      const width = map[0].length;

      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (map[r][c] !== "1") continue;

          // 1. Denser front face points
          for (let sc = 0; sc < 1; sc += subStep) {
            for (let sr = 0; sr < 1; sr += subStep) {
              points.push({
                x: c + sc - width / 2 + offsetX,
                y: r + sr - height / 2,
                z: frontZ,
                nx: 0,
                ny: 0,
                nz: 1,
                isFront: true,
              });
            }
          }

          // 2. Extrusion edge walls along depth
          const isTop = r === 0 || map[r - 1][c] !== "1";
          const isBottom = r === height - 1 || map[r + 1][c] !== "1";
          const isLeft = c === 0 || map[r][c - 1] !== "1";
          const isRight = c === width - 1 || map[r][c + 1] !== "1";

          if (!isTop && !isBottom && !isLeft && !isRight) continue;

          for (let s = 1; s <= depthSlices; s++) {
            const z = frontZ - (s / depthSlices) * (frontZ - backZ);
            for (let sub = 0; sub < 1; sub += subStep) {
              if (isTop) {
                points.push({
                  x: c + sub - width / 2 + offsetX,
                  y: r - height / 2,
                  z,
                  nx: 0,
                  ny: -1,
                  nz: 0,
                  isFront: false,
                });
              }
              if (isBottom) {
                points.push({
                  x: c + sub - width / 2 + offsetX,
                  y: r + 1 - height / 2,
                  z,
                  nx: 0,
                  ny: 1,
                  nz: 0,
                  isFront: false,
                });
              }
              if (isLeft) {
                points.push({
                  x: c - width / 2 + offsetX,
                  y: r + sub - height / 2,
                  z,
                  nx: -1,
                  ny: 0,
                  nz: 0,
                  isFront: false,
                });
              }
              if (isRight) {
                points.push({
                  x: c + 1 - width / 2 + offsetX,
                  y: r + sub - height / 2,
                  z,
                  nx: 1,
                  ny: 0,
                  nz: 0,
                  isFront: false,
                });
              }
            }
          }
        }
      }
    });

    const bufferW = compact ? 42 : 58;
    const bufferH = compact ? 13 : 16;
    const fontAspect = 1.95; // Compensates for terminal character cells being taller than wide

    // High contrast character ramps
    const frontChars = ["#", "#", "#", "#", "#"];
    const sideChars = [".", ":", "-", "=", "+", "*"];

    // Directional light from top-right-front
    const lx = 0.45;
    const ly = -0.55;
    const lz = 0.7;

    const distance = 28;
    const scale = compact ? 26 : 38;

    const startTime = performance.now();

    const render = () => {
      const elapsed = (performance.now() - startTime) * 0.001;

      // Oscillating floating sway keeps text permanently front-facing and readable
      const ay = Math.sin(elapsed * 1.1) * 0.38;
      const ax = 0.16 + Math.cos(elapsed * 0.8) * 0.08;

      const cosY = Math.cos(ay);
      const sinY = Math.sin(ay);
      const cosX = Math.cos(ax);
      const sinX = Math.sin(ax);

      const output: string[] = new Array(bufferW * bufferH).fill(" ");
      const zBuffer: number[] = new Array(bufferW * bufferH).fill(-Infinity);

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // 3D rotation
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Normal rotation
        const nx1 = p.nx * cosY + p.nz * sinY;
        const nz1 = -p.nx * sinY + p.nz * cosY;
        const ny1 = p.ny * cosX - nz1 * sinX;
        const nz2 = p.ny * sinX + nz1 * cosX;

        // Backface culling: discard rear-facing polygons
        if (nz2 < -0.05) continue;

        const ooz = 1 / (distance + z2);
        const xp = Math.floor(bufferW / 2 + x1 * scale * ooz * fontAspect);
        const yp = Math.floor(bufferH / 2 + y1 * scale * ooz);

        if (xp < 0 || xp >= bufferW || yp < 0 || yp >= bufferH) continue;

        const idx = xp + yp * bufferW;
        // Subtle depth bias for front faces to eliminate surface-edge z-fighting
        const effZ = p.isFront ? ooz + 0.0005 : ooz;

        if (effZ > zBuffer[idx]) {
          zBuffer[idx] = effZ;

          const lum = Math.max(0, nx1 * lx + ny1 * ly + nz2 * lz);

          if (p.isFront) {
            const charIdx = Math.min(
              frontChars.length - 1,
              Math.max(0, Math.floor(lum * frontChars.length))
            );
            output[idx] = frontChars[charIdx] || "#";
          } else {
            const charIdx = Math.min(
              sideChars.length - 1,
              Math.max(0, Math.floor((lum * 0.7 + 0.3) * sideChars.length))
            );
            output[idx] = sideChars[charIdx] || ":";
          }
        }
      }

      let frameStr = "";
      for (let y = 0; y < bufferH; y++) {
        frameStr += output.slice(y * bufferW, (y + 1) * bufferW).join("") + "\n";
      }

      setFrame(frameStr);
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [compact]);

  return (
    <div
      className={`select-none flex justify-center items-center py-2 text-[#9AE6B4] font-mono tracking-wider transition-all max-w-full overflow-hidden ${
        compact
          ? "text-[8px] sm:text-[9px] leading-[1.08]"
          : "text-[9.5px] sm:text-xs md:text-sm leading-[1.15]"
      }`}
    >
      <pre className="font-mono whitespace-pre opacity-90 transition-opacity">
        {frame}
      </pre>
    </div>
  );
}
