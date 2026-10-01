"use client";

import React, { useEffect, useRef, useState } from "react";

// 3D point with surface normal for lighting calculation
interface Point3D {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
}

interface SpinningAsciiEdsProps {
  compact?: boolean;
}

export function SpinningAsciiEds({ compact = false }: SpinningAsciiEdsProps) {
  const [frame, setFrame] = useState<string>("");
  const angleYRef = useRef(0);
  const angleXRef = useRef(0.2); // slight downward tilt for 3D depth

  useEffect(() => {
    // Generate voxel points for 3D letters "E D S"
    // Each letter is defined on a grid, extruded along Z-axis
    const points: Point3D[] = [];

    // Grid representations (9 rows x 7 cols per letter)
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
      "11000011",
      "11000011",
      "11000011",
      "11000011",
      "11000011",
      "1100011",
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
      { map: letterD, offsetX: -1 },
      { map: letterS, offsetX: 9 },
    ];

    const depths = [-1.4, -0.7, 0, 0.7, 1.4];

    letters.forEach(({ map, offsetX }) => {
      for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
          if (map[r][c] === "1") {
            const px = c + offsetX;
            const py = r - 4.5; // center vertically

            // Add front & back faces with normals
            points.push({ x: px, y: py, z: 1.4, nx: 0, ny: 0, nz: 1 });
            points.push({ x: px, y: py, z: -1.4, nx: 0, ny: 0, nz: -1 });

            // Add side edges along depth
            depths.forEach((dz) => {
              // check boundaries for edge normals
              const isTop = r === 0 || map[r - 1]?.[c] !== "1";
              const isBottom = r === map.length - 1 || map[r + 1]?.[c] !== "1";
              const isLeft = c === 0 || map[r][c - 1] !== "1";
              const isRight = c === map[r].length - 1 || map[r][c + 1] !== "1";

              if (isTop || isBottom || isLeft || isRight) {
                points.push({
                  x: px,
                  y: py,
                  z: dz,
                  nx: isRight ? 1 : isLeft ? -1 : 0,
                  ny: isBottom ? 1 : isTop ? -1 : 0,
                  nz: 0,
                });
              }
            });
          }
        }
      }
    });

    const width = compact ? 38 : 56;
    const height = compact ? 13 : 18;
    const chars = " .·:;+*#%@";

    let animationFrameId: number;

    const render = () => {
      angleYRef.current += 0.035;
      const ay = angleYRef.current;
      const ax = angleXRef.current;

      const cosY = Math.cos(ay);
      const sinY = Math.sin(ay);
      const cosX = Math.cos(ax);
      const sinX = Math.sin(ax);

      // Light source vector pointing towards screen
      const lx = 0.577;
      const ly = -0.577;
      const lz = 0.577;

      // 2D Character buffer and Z-buffer
      const output: string[] = new Array(width * height).fill(" ");
      const zBuffer: number[] = new Array(width * height).fill(-Infinity);

      const distance = compact ? 32 : 30;
      const k1 = compact ? 23 : 36; // horizontal scale factor
      const k2 = compact ? 12 : 18; // vertical scale factor (terminal chars are taller than wide)

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // 3D rotation Y then X
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Rotate normals for lighting
        const nx1 = p.nx * cosY + p.nz * sinY;
        const nz1 = -p.nx * sinY + p.nz * cosY;
        const ny1 = p.ny * cosX - nz1 * sinX;
        const nz2 = p.ny * sinX + nz1 * cosX;

        const ooz = 1 / (distance + z2);

        // Projected 2D coordinates
        const xp = Math.floor(width / 2 + x1 * k1 * ooz);
        const yp = Math.floor(height / 2 + y1 * k2 * ooz);

        if (xp >= 0 && xp < width && yp >= 0 && yp < height) {
          const idx = xp + yp * width;
          if (ooz > zBuffer[idx]) {
            zBuffer[idx] = ooz;

            // Calculate diffuse luminance
            const lum = nx1 * lx + ny1 * ly + nz2 * lz;
            const ambient = 0.35;
            const brightness = Math.max(0, lum * 0.65 + ambient);
            const charIdx = Math.min(
              chars.length - 1,
              Math.max(0, Math.floor(brightness * chars.length))
            );
            output[idx] = chars[charIdx];
          }
        }
      }

      // Convert buffer array to multi-line string
      let frameStr = "";
      for (let y = 0; y < height; y++) {
        frameStr += output.slice(y * width, (y + 1) * width).join("") + "\n";
      }

      setFrame(frameStr);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
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
