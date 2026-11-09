"use client";

import React, { useEffect, useRef } from "react";

interface LivingAsciiEdsProps {
  compact?: boolean;
}

const DENSE_GLYPHS = ["@", "#", "%", "0", "O", "8", "&"];
const MEDIUM_GLYPHS = ["+", "*", "=", "x", "#", "~"];
const LIGHT_GLYPHS = [":", "-", "=", "+", "·"];
const DUST_GLYPHS = [".", "·", ":", "'", "`"];
const BORDER_GLYPHS = ["/", "\\", "|", "_", "-", "=", "[", "]"];

// 37 rows x 94 columns template with rich vertical degradation matching reference
const CINEMATIC_LARGE_TEMPLATE = [
  ".__________________________.    .________________________.                 _.-===-._            ",
  "|@@ @# %%%@%@% @@#%#%# @@%0|    |@@ @# %%%@%@% @@#%#%# @@%0\\           ..%#%#00#%@%#%@%0%_..    ",
  "|@@# @@# @@%@%%%#@@#%#@%00#|    |@@# @@# @@%@%%%#@@#%#@%00#\\\\       /__%#@#%#%@#0#%#%#@#%@#%@__ ",
  "|%@%@% @%% @@# @%@%%%#%#%00|    |%@%@% @%% @@# @%@%%%#%#%000\\\\     /%#%#%#000%#%#00#%#0%#%0%#00%\\\\",
  "|%%%%%%@@ #%## #%@#% @@#000|    |%%%%%%@@ #%## #%@#% @@#00000\\\\    /#0%#%#0#0#0#0%#%0%#%0#%#0%#0%0\\\\",
  "|0%%0% 00|=================|    |0%%0% 00|====0000 00 \\00% 00|   |#%#%@%0%0%0#%0%0%0#%00%00%000#0%|",
  "|%00 000%|                      |%00 000%|             \\00 00|   |%%00%0%@%0%0#0%000%   \\%%%%000@#%|",
  "|%00 000%|                      |%00 000%|              |000 |   |%00#0%00%00#0#000%     \\##@%#@#00|",
  "|0%0 000%|                      |0%0 000%|              |000 |   |00%00#0#0000#0#00*      |@%0%#00@|",
  "|000 000%|                      |000 000%|              |000 |   |%00#0%00%00#0#00%*       `---\\00%|",
  "|%00 000%|                      |%00 000%|              |000 |   \\%@%#%#0#0#0#0%#%#*+-: · . ·  \\00#/",
  "|%00 0%00%00000000000000000|    |%00 000%|              |000 |    \\%#0%#%%%#%#*+=__     . .    /00%|",
  "|%%00%000000 00000000000000|    |%%00%000|              |000 |     \\##%%#0#%#%#%%%#*__\\       /0#00|",
  "|00%00 000%00 0000000000000|    |00%00 00|              |000 |      \\%%%%%%%%%%%#%%%#%*\\\\   //%0%#0/",
  "|0%0%0 000000 0000000000000|    |0%0%0 00|              |000 |      -=*#%#%#+*%+#%%%%%%%#%#*\\\\    / ",
  "|%00 000%|=================|    |%00 000%|              |000 |         \\%%#*%#*#*%#%*#%##*   /--=   ",
  "|%00 000%|                      |%00 000%|              |000 |          \\   `%##%#00#*+--==*#%*+    ",
  "|%00 000%|                      |%00 000%|              |000 |                \\%%%#0%#*+-:==#%*+    ",
  "|0%0 000%|                      |0%0 000%|              |000 |                --===+*#%#*+=+#%*+--  ",
  "|000 000%|                      |000 000%|              |000 |           -+--===*#%#*+=+*#%#*+=---  ",
  "|%00 000%|                      |%00 000%|              |000 |        ==+==+*#%#*+=+*#%#*+=---      ",
  "|0%%0% 00|_________________|    |0%%0% 00|              /000 |       =+-+*#%#*+=+*#%#*+=---        ",
  "|0 00%00 %000 0%00 00000000|    |0 00%00 %000 0%00 000 /00 00|      =+-*#%#*+=+*#%#*+=--- \\000#00|  ",
  "|0%0% |%00 00%0000 00000000|    |0%0% |%00 00%0000 00 /00% 00|     /--*#%#*+=+*#%#*+=---   \\00#00%| ",
  "|00 0%0 0%%00%00 00 0000000|    |00 0%0 0%%00%00 00 0//00000//    |00#--*#%#*+=+*#%#*+=--   |00000| ",
  "|%0%0%00 0%%===%%% 00000000|    |%0%0%00 0%%===%%% 0//00000//     |0#0%--*#%#*+=+*#%#*+=--  |000#0| ",
  "|=+%#=#==#*#%*+%#=##=+#*#%#|    |=+%#=#==#*#%*+%#=##=+#*#%#/      \\000%#--*#%#*+=+*#%#*+=--/000#00| ",
  "|#%=+##%--%#%=+%#-#+#%==+#*|    |#%=+##%--%#%=+%#-#+#%==+#*        \\00#00--*#%#*+=+*#%#*+=--#000#0/ ",
  "|=+%-+-#%#+#+#-=#%=#+#==#%#|    |=+%-+-#%#+#+#-=#%=#+#==#%#       |-+=#+--*#%#*:%#%#++:-*:- -##*+=* ",
  "|:= -#-#%#*- -%#+#*- +++%=#|    |:= -#-#%#*- -%#+#*- +++%=#       \\+#+#%%-%=##*:#::-*%+-=##:%:--%*  ",
  "|: * + - # = : - ** : *%**%|    |: * + - # = : - ** : *%**%       --:+%+%+=:::#*:%:#:=%+-=+-++#=*:: ",
  "|· ** + - ++ : - :++ · · = |    |· ** + - ++ : - :++ · · =          =% -+++-: %**+-*+==:*%=#-**+=:  ",
  "|· * = + + : ; - * - *# = +|    |· * = + + : ; - * - *# = +         == . == *= .=+*+--#* -- -#%#*:. ",
  "|- + , · + = - : · - * · : |    |- + , · + = - : · - * · :            :: . -+=*+ :==  . :* + . . .  ",
  "|= = : , : · · = - · : · : |    |= = : , : · · = - · : · :               . : - -  . .   .   .       ",
  "|· · · · · · · · · · · · · |    |· · · · · · · · · · · · ·                 . . .    .               ",
  "`                          '    `                             '              .                      ",
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

type DensityType = "space" | "border" | "dense" | "medium" | "light" | "dust";

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

function getDensityType(ch: string, rowIndex: number): DensityType {
  if (ch === " ") return "space";
  if (BORDER_GLYPHS.includes(ch)) return "border";
  if (rowIndex >= 31) return "dust";
  if (rowIndex >= 26) return "light";
  if (rowIndex >= 16 && (MEDIUM_GLYPHS.includes(ch) || LIGHT_GLYPHS.includes(ch))) return "medium";
  if (DENSE_GLYPHS.includes(ch)) return "dense";
  if (MEDIUM_GLYPHS.includes(ch)) return "medium";
  return "light";
}

function getRandomGlyph(type: DensityType): string {
  if (type === "dense") return DENSE_GLYPHS[Math.floor(Math.random() * DENSE_GLYPHS.length)];
  if (type === "medium") return MEDIUM_GLYPHS[Math.floor(Math.random() * MEDIUM_GLYPHS.length)];
  if (type === "light") return LIGHT_GLYPHS[Math.floor(Math.random() * LIGHT_GLYPHS.length)];
  if (type === "dust") return DUST_GLYPHS[Math.floor(Math.random() * DUST_GLYPHS.length)];
  return "·";
}

function getBaseColor(type: DensityType, rowIndex: number): string {
  if (rowIndex >= 32) return "#52525B";
  if (rowIndex >= 27) return "#71717A";
  if (rowIndex >= 20) return "#A1A1AA";
  if (type === "dense") return "#FFFFFF";
  if (type === "medium") return "#E4E4E7";
  if (type === "border") return "#D4D4D8";
  return "#8E8E93";
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

    const lines = compact ? COMPACT_TEMPLATE : CINEMATIC_LARGE_TEMPLATE;
    const rows = lines.length;
    const cols = Math.max(...lines.map((l) => l.length));

    // Initialize grid cells
    const grid: CellState[][] = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      const line = lines[r].padEnd(cols, " ");
      for (let c = 0; c < cols; c++) {
        const ch = line[c];
        const type = getDensityType(ch, r);
        grid[r][c] = {
          initialChar: ch,
          char: ch,
          type,
          intensity: 0,
          baseColor: getBaseColor(type, r),
        };
      }
    }

    const particles: Particle[] = [];
    let animationFrameId: number;
    let lastTime = performance.now();
    let lastShimmerTime = performance.now();
    let lastInteractionTime = performance.now();

    // Reticle & cursor position state
    let targetX = -999;
    let targetY = -999;
    let isPointerInside = false;

    // Autonomous sweep state
    let isSweeping = false;
    let sweepProgress = 0;
    let sweepStartTime = 0;

    const computeMetrics = () => {
      const containerWidth = container.clientWidth || (compact ? 240 : 800);
      let fontSize = compact ? 8 : 11;

      if (!compact) {
        if (containerWidth < 480) {
          fontSize = 4.8;
        } else if (containerWidth < 640) {
          fontSize = 6.4;
        } else if (containerWidth < 840) {
          fontSize = 8.5;
        } else if (containerWidth < 1024) {
          fontSize = 10.5;
        } else {
          fontSize = 11.5;
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

    // Mouse / Touch Interaction Handler (Hero only)
    const handlePointer = (clientX: number, clientY: number) => {
      if (compact) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x < -20 || x > metrics.totalWidth + 20 || y < -20 || y > metrics.totalHeight + 20) {
        isPointerInside = false;
        return;
      }

      isPointerInside = true;
      targetX = Math.max(0, Math.min(x, metrics.totalWidth));
      targetY = Math.max(0, Math.min(y, metrics.totalHeight));

      const touchedCol = targetX / metrics.charWidth;
      const touchedRow = targetY / metrics.charHeight;
      const radius = 3.2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (cell.type === "space") continue;

          const dist = Math.hypot(c - touchedCol, (r - touchedRow) * 1.2);
          if (dist <= radius) {
            const addedIntensity = 1.0 - (dist / radius) * 0.4;
            cell.intensity = Math.max(cell.intensity, addedIntensity);

            // Contact mutation
            if (Math.random() < 0.35) {
              cell.char = getRandomGlyph(cell.type);
            }

            // Spawn particle whispers along path
            if (Math.random() < 0.08 && particles.length < 40) {
              particles.push({
                x: c * metrics.charWidth + (Math.random() - 0.5) * 8,
                y: r * metrics.charHeight + (Math.random() - 0.5) * 8,
                vx: (Math.random() - 0.5) * 16,
                vy: -Math.random() * 18 - 6,
                char: [".", ":", "-", "·", "+", "="][Math.floor(Math.random() * 6)],
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

    const onPointerLeave = () => {
      isPointerInside = false;
    };

    if (!compact) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      canvas.addEventListener("mouseleave", onPointerLeave);
    }

    // Main render loop
    const render = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Shimmer engine: micro-mutate random cells periodically
      if (now - lastShimmerTime > 80) {
        lastShimmerTime = now;
        const shimmerCount = compact ? 2 : 5;
        for (let i = 0; i < shimmerCount; i++) {
          const randR = Math.floor(Math.random() * rows);
          const randC = Math.floor(Math.random() * cols);
          const cell = grid[randR][randC];
          if (cell.type !== "space") {
            if (Math.random() < 0.4) {
              cell.char = getRandomGlyph(cell.type);
            } else {
              cell.char = cell.initialChar;
            }
          }
        }
      }

      // 2. Autonomous Idle Sweep (Hero only)
      let activeScanY = -999;
      let activeScanX = -999;
      let drawScanReticle = false;

      if (!compact) {
        const idleDuration = now - lastInteractionTime;
        if (!isPointerInside && !isSweeping && idleDuration > 3800) {
          isSweeping = true;
          sweepProgress = 0;
          sweepStartTime = now;
        }

        if (isSweeping) {
          const sweepDuration = 2800; // ms
          const elapsed = now - sweepStartTime;
          sweepProgress = elapsed / sweepDuration;

          if (sweepProgress >= 1.0) {
            isSweeping = false;
            lastInteractionTime = now;
          } else {
            // Sweep coordinates across the matrix
            const sweepCol = sweepProgress * (cols + 20) - 10;
            const sweepRow = 14 + Math.sin(sweepProgress * Math.PI * 2.2) * 8;

            activeScanX = sweepCol * metrics.charWidth;
            activeScanY = sweepRow * metrics.charHeight;
            drawScanReticle = true;

            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const cell = grid[r][c];
                if (cell.type === "space") continue;

                const dist = Math.hypot(c - sweepCol, (r - sweepRow) * 1.3);
                if (dist <= 3.2) {
                  const added = 1.0 - (dist / 3.2) * 0.4;
                  cell.intensity = Math.max(cell.intensity, added);
                  if (Math.random() < 0.3) {
                    cell.char = getRandomGlyph(cell.type);
                  }
                  if (Math.random() < 0.06 && particles.length < 35) {
                    particles.push({
                      x: c * metrics.charWidth,
                      y: r * metrics.charHeight,
                      vx: (Math.random() - 0.5) * 10,
                      vy: -Math.random() * 14,
                      char: [".", "-", ":", "+"][Math.floor(Math.random() * 4)],
                      opacity: 0.9,
                    });
                  }
                }
              }
            }
          }
        } else if (isPointerInside) {
          activeScanX = targetX;
          activeScanY = targetY;
          drawScanReticle = true;
        }
      }

      // 3. Clear Canvas
      ctx.clearRect(0, 0, metrics.totalWidth, metrics.totalHeight);

      const { charWidth, charHeight, fontSize } = metrics;
      ctx.font = `${fontSize}px var(--font-ioskeley-mono), monospace`;

      // 4. Draw Horizontal Scanline Guideline Band (Ref: dashed lines across voids)
      if (!compact && drawScanReticle && activeScanY >= 0) {
        const scanRowIndex = Math.floor(activeScanY / charHeight);
        const bandRows = [scanRowIndex - 1, scanRowIndex, scanRowIndex + 1];

        for (const br of bandRows) {
          if (br < 0 || br >= rows) continue;
          const yPos = br * charHeight;

          for (let c = 0; c < cols; c++) {
            const cell = grid[br][c];
            if (cell.type === "space") {
              // Draw dashed / dotted guideline characters in empty space near scanline
              const distFromX = Math.abs(c * charWidth - activeScanX) / (charWidth * 16);
              if (distFromX < 2.5) {
                const alpha = Math.max(0, 0.45 - distFromX * 0.16);
                ctx.fillStyle = `rgba(234, 88, 12, ${alpha})`;
                const dashChar = br === scanRowIndex ? "-" : (c % 2 === 0 ? "=" : "+");
                ctx.fillText(dashChar, c * charWidth, yPos);
              }
            }
          }
        }
      }

      // 5. Render Grid Cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (cell.type === "space") continue;

          // Smooth exponential decay
          if (cell.intensity > 0) {
            cell.intensity = Math.max(0, cell.intensity - delta * 1.5);
          }

          const x = c * charWidth;
          const y = r * charHeight;

          if (cell.intensity > 0.02) {
            // Rich orange / ember glowing illumination (#FF4500 to #EA580C)
            const glowAlpha = Math.min(cell.intensity, 1.0);
            ctx.fillStyle = `rgba(255, 69, 0, ${glowAlpha})`;
            ctx.fillText(cell.char, x, y);

            if (cell.intensity > 0.5 && !compact) {
              ctx.shadowColor = "rgba(255, 69, 0, 0.6)";
              ctx.shadowBlur = 5;
              ctx.fillStyle = "#FF7A1A";
              ctx.fillText(cell.char, x, y);
              ctx.shadowBlur = 0;
            }
          } else {
            ctx.fillStyle = cell.baseColor;
            ctx.fillText(cell.char, x, y);
          }
        }
      }

      // 6. Draw Sci-Fi Crosshair Reticle & Status Tag (Ref: circle with ✕ prongs & label)
      if (!compact && drawScanReticle && activeScanX >= 0 && activeScanY >= 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.2;

        // Outer ring
        const reticleR = fontSize * 1.1;
        ctx.beginPath();
        ctx.arc(activeScanX, activeScanY, reticleR, 0, Math.PI * 2);
        ctx.stroke();

        // Diagonal cross prongs
        const prongLen = reticleR * 1.5;
        ctx.beginPath();
        ctx.moveTo(activeScanX - prongLen, activeScanY - prongLen);
        ctx.lineTo(activeScanX + prongLen, activeScanY + prongLen);
        ctx.moveTo(activeScanX - prongLen, activeScanY + prongLen);
        ctx.lineTo(activeScanX + prongLen, activeScanY - prongLen);
        ctx.strokeStyle = "rgba(234, 88, 12, 0.9)";
        ctx.stroke();

        // Center dot
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(activeScanX, activeScanY, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Label beside reticle (Ref: "BREATHE" / "EDS / ACTIVE")
        ctx.font = `bold ${Math.max(8, fontSize * 0.85)}px var(--font-ioskeley-mono), monospace`;
        ctx.fillStyle = "#E4E4E7";
        ctx.fillText("BREATHE", activeScanX + reticleR + 6, activeScanY - 4);

        ctx.restore();
      }

      // 7. Update & Render Trail Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.opacity -= delta * 1.2;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(234, 88, 12, ${p.opacity * 0.85})`;
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
        canvas.removeEventListener("mouseleave", onPointerLeave);
      }
    };
  }, [compact]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none overflow-hidden ${
        compact ? "w-full py-1 pointer-events-none" : "w-full max-w-full py-1 cursor-crosshair"
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
