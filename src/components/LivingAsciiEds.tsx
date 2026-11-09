"use client";

import React, { useEffect, useRef } from "react";

interface LivingAsciiEdsProps {
  compact?: boolean;
}

const DENSE_GLYPHS = ["%", "@", "#", "0", "O", "8", "&"];
const MEDIUM_GLYPHS = ["+", "*", "=", "x", "~"];
const LIGHT_GLYPHS = [".", ":", "-", "'"];
const BORDER_GLYPHS = ["/", "\\", "|", "_", "[", "]"];

// 18 rows x 76 cols template for Hero view
const LARGE_TEMPLATE = [
  "|%0%0%00 0%%===%%% 0%%|   |%000 0=%00 0%#%00 0%0\\         /%0% 0%0 %##00%      ",
  "|00 0%0 0%%00%00 00 0%|   |0%#0 00%0% 00%00#00%00\\\\    / %0###00%00 0%000%00 \\",
  "|0%0% |%00 00%0000 00 |   |0%00 00#00 %000 00%00 0\\\\   //00#%0#000 0%00 000%00\\\\",
  "|0 00%00 %000 0%00 000|   |000% 00|     \\00% 00% 00|   /%#00#00%0=---=0%00%00#0\\",
  "|0%%0% 00|====0000 00 |   |%00 000|      |000 00#00|   |00# 0000/      \\00 000|",
  "|%00 000%|                |%00 000|      |00# 00000|   \\000 0000\\              ",
  "|%00 000%|                |0%0 000|      |000 000%0|    \\00% 0000000000%0\\     ",
  "|%00 0%00%000000000000|   |000 000|      |000 00#00|     \\000%0000000000000\\   ",
  "|%%00%000000 000000000|   |%00 000|      |000 00000|       \\000%000000000000\\  ",
  "|00%00 000%00 00000000|   |0%0 000|      |000 000%0|          \\0000000000%000\\ ",
  "|%00 000%|                |%00 000|      |00# 00000|                \\0000 0000|",
  "|%00 000%|                |%00 000|      |000 00#00|   |000 000\\      /000 000|",
  "|0%%0% 00|====0000 00 |   |000% 00|     /00% 00% 00|   \\00#00#00%0---=0%00%00#/ ",
  "|0 00%00 %000 0%00 000|   |0%00 00#00 %000 00%00 0//   \\\\00#%0#000 0%00 000%0// ",
  "|0%0% |%00 00%0000 00 |   |0%#0 00%0% 00%00#00%00//     \\ %0###00%00 0%000%0/  ",
  "|00 0%0 0%%00%00 00 0%|   |%000 0=%00 0%#%00 0%0/          \\%0% 0%0 %##00%/    ",
  "|%0%0%00 0%%===%%% 0%%|   +==+====+==+===+=====+             +===+===+===+      ",
  "+==+====+==+===+=====+                                                          ",
];

// 7 rows x 29 cols template for Sidebar view
const COMPACT_TEMPLATE = [
  "|%0%===%|  |%0%==%0\\    /%0%===%\\",
  "|0%0%0 0|  |0%0  \\00|  //00%    |",
  "|%00    |  |%00   |0|  \\00%====/ ",
  "|0%0===0|  |0%0   |0|   \\000%==\\ ",
  "|%00    |  |%00   |0|       \\000\\\\",
  "|0%0%0 0|  |0%0  /00|  |00%====//",
  "+==+===+  +==+==%0/    \\ %0%==/ ",
];


type DensityType = "space" | "border" | "dense" | "medium" | "light";

interface CellState {
  initialChar: string;
  char: string;
  type: DensityType;
  intensity: number; // 0..1 (orange trail glow)
  baseColor: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  opacity: number;
}

function getDensityType(ch: string): DensityType {
  if (ch === " ") return "space";
  if (BORDER_GLYPHS.includes(ch)) return "border";
  if (DENSE_GLYPHS.includes(ch)) return "dense";
  if (MEDIUM_GLYPHS.includes(ch)) return "medium";
  return "light";
}

function getRandomGlyph(type: DensityType): string {
  if (type === "dense") return DENSE_GLYPHS[Math.floor(Math.random() * DENSE_GLYPHS.length)];
  if (type === "medium") return MEDIUM_GLYPHS[Math.floor(Math.random() * MEDIUM_GLYPHS.length)];
  if (type === "light") return LIGHT_GLYPHS[Math.floor(Math.random() * LIGHT_GLYPHS.length)];
  return "·";
}

function getBaseColor(type: DensityType): string {
  switch (type) {
    case "dense":
      return "#FFFFFF";
    case "medium":
      return "#D4D4D8";
    case "border":
      return "#A1A1AA";
    case "light":
    default:
      return "#71717A";
  }
}

export function LivingAsciiEds({ compact = false }: LivingAsciiEdsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lines = compact ? COMPACT_TEMPLATE : LARGE_TEMPLATE;
    const rows = lines.length;
    const cols = Math.max(...lines.map((l) => l.length));

    // Initialize grid cells
    const grid: CellState[][] = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      const line = lines[r].padEnd(cols, " ");
      for (let c = 0; c < cols; c++) {
        const ch = line[c];
        const type = getDensityType(ch);
        grid[r][c] = {
          initialChar: ch,
          char: ch,
          type,
          intensity: 0,
          baseColor: getBaseColor(type),
        };
      }
    }

    const particles: Particle[] = [];
    let animationFrameId: number;
    let lastTime = performance.now();
    let lastShimmerTime = performance.now();
    let lastInteractionTime = performance.now();

    // Autonomous sweep state
    let isSweeping = false;
    let sweepProgress = 0;
    let sweepStartTime = 0;

    const computeMetrics = () => {
      const containerWidth = container.clientWidth || (compact ? 240 : 640);
      // Determine font size based on container width
      let fontSize = compact ? 8 : 13;
      if (!compact) {
        if (containerWidth < 480) {
          fontSize = 6.2;
        } else if (containerWidth < 640) {
          fontSize = 8.5;
        } else if (containerWidth < 800) {
          fontSize = 11;
        }
      }

      const charWidth = fontSize * 0.6;
      const charHeight = fontSize * 1.15;
      const totalWidth = Math.ceil(cols * charWidth);
      const totalHeight = Math.ceil(rows * charHeight);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = totalWidth * dpr;
      canvas.height = totalHeight * dpr;
      canvas.style.width = `${totalWidth}px`;
      canvas.style.height = `${totalHeight}px`;

      ctx.scale(dpr, dpr);
      ctx.font = `${fontSize}px var(--font-ioskeley-mono), monospace`;
      ctx.textBaseline = "top";

      return { fontSize, charWidth, charHeight, totalWidth, totalHeight };
    };

    let metrics = computeMetrics();

    const resizeObserver = new ResizeObserver(() => {
      metrics = computeMetrics();
    });
    resizeObserver.observe(container);

    // Mouse / Touch Interaction Handler (only if not compact)
    const handlePointer = (clientX: number, clientY: number) => {
      if (compact) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x < 0 || x > metrics.totalWidth || y < 0 || y > metrics.totalHeight) {
        return;
      }

      const touchedCol = x / metrics.charWidth;
      const touchedRow = y / metrics.charHeight;
      const radius = 2.4; // cells radius

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (cell.type === "space") continue;

          const dist = Math.hypot(c - touchedCol, r - touchedRow);
          if (dist <= radius) {
            const addedIntensity = 1.0 - (dist / radius) * 0.45;
            cell.intensity = Math.max(cell.intensity, addedIntensity);

            // Dynamic glyph mutation on contact
            if (Math.random() < 0.4) {
              cell.char = getRandomGlyph(cell.type);
            }

            // Spawn particle whisper
            if (Math.random() < 0.08 && particles.length < 30) {
              particles.push({
                x: c * metrics.charWidth + (Math.random() - 0.5) * 6,
                y: r * metrics.charHeight + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 12,
                vy: -Math.random() * 15 - 5,
                char: [".", ":", "-", "·", "+"][Math.floor(Math.random() * 5)],
                opacity: 1.0,
              });
            }
          }
        }
      }

      lastInteractionTime = performance.now();
    };

    const onMouseMove = (e: MouseEvent) => {
      handlePointer(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    if (!compact) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
    }

    // Main render loop
    const render = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Shimmer engine: micro-mutate a few cells periodically
      if (now - lastShimmerTime > 90) {
        lastShimmerTime = now;
        const shimmerCount = compact ? 1 : 3;
        for (let i = 0; i < shimmerCount; i++) {
          const randR = Math.floor(Math.random() * rows);
          const randC = Math.floor(Math.random() * cols);
          const cell = grid[randR][randC];
          if (cell.type !== "space") {
            if (Math.random() < 0.3) {
              cell.char = getRandomGlyph(cell.type);
            } else {
              cell.char = cell.initialChar;
            }
          }
        }
      }

      // 2. Autonomous Idle Sweep (Hero only)
      if (!compact) {
        const idleDuration = now - lastInteractionTime;
        if (!isSweeping && idleDuration > 4000) {
          isSweeping = true;
          sweepProgress = 0;
          sweepStartTime = now;
        }

        if (isSweeping) {
          const sweepDuration = 2200; // ms
          const elapsed = now - sweepStartTime;
          sweepProgress = elapsed / sweepDuration;

          if (sweepProgress >= 1.0) {
            isSweeping = false;
            lastInteractionTime = now; // wait another interval
          } else {
            // Sweeping wave coordinate
            const sweepCol = sweepProgress * (cols + 16) - 8;
            const waveCenterRow = rows / 2 + Math.sin(sweepProgress * Math.PI * 2) * 2;

            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const cell = grid[r][c];
                if (cell.type === "space") continue;

                const dist = Math.hypot(c - sweepCol, (r - waveCenterRow) * 1.5);
                if (dist <= 2.2) {
                  const added = 1.0 - (dist / 2.2) * 0.4;
                  cell.intensity = Math.max(cell.intensity, added);
                  if (Math.random() < 0.25) {
                    cell.char = getRandomGlyph(cell.type);
                  }
                  if (Math.random() < 0.05 && particles.length < 25) {
                    particles.push({
                      x: c * metrics.charWidth,
                      y: r * metrics.charHeight,
                      vx: (Math.random() - 0.5) * 8,
                      vy: -Math.random() * 12,
                      char: [".", ":", "-"][Math.floor(Math.random() * 3)],
                      opacity: 0.9,
                    });
                  }
                }
              }
            }
          }
        }
      }

      // 3. Clear Canvas
      ctx.clearRect(0, 0, metrics.totalWidth, metrics.totalHeight);

      // 4. Render Grid Cells
      const { charWidth, charHeight, fontSize } = metrics;
      ctx.font = `${fontSize}px var(--font-ioskeley-mono), monospace`;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (cell.type === "space") continue;

          // Decay intensity smoothly
          if (cell.intensity > 0) {
            cell.intensity = Math.max(0, cell.intensity - delta * 1.8);
          }

          const x = c * charWidth;
          const y = r * charHeight;

          // Color blending: warm glowing orange to monochrome base
          if (cell.intensity > 0.02) {
            // High intensity: warm bright orange (#FF6B00), fading into amber (#F97316), then base
            const orangeAlpha = Math.min(cell.intensity, 1.0);
            ctx.fillStyle = `rgba(255, 107, 0, ${orangeAlpha})`;
            ctx.fillText(cell.char, x, y);

            // Ambient glow halo for brightest cells
            if (cell.intensity > 0.6 && !compact) {
              ctx.shadowColor = "rgba(255, 107, 0, 0.5)";
              ctx.shadowBlur = 4;
              ctx.fillStyle = "#FF8A3D";
              ctx.fillText(cell.char, x, y);
              ctx.shadowBlur = 0;
            }
          } else {
            ctx.fillStyle = cell.baseColor;
            ctx.fillText(cell.char, x, y);
          }
        }
      }

      // 5. Update & Render Trail Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.opacity -= delta * 1.4;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(249, 115, 22, ${p.opacity * 0.75})`;
        ctx.fillText(p.char, p.x, p.y);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (!compact) {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("touchmove", onTouchMove);
      }
    };
  }, [compact]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none overflow-hidden ${
        compact ? "w-full py-1 pointer-events-none" : "w-full max-w-full py-2 cursor-crosshair"
      }`}
      aria-label="EDS ASCII Typographical Emblem"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="EDS 2D Typographical ASCII Emblem"
        className="block mx-auto"
      />
      <span className="sr-only">EDS</span>
    </div>
  );
}
