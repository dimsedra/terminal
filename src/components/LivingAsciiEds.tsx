"use client";

import React, { useEffect, useRef } from "react";

interface LivingAsciiEdsProps {
  compact?: boolean;
}

const DENSE_GLYPHS = ["@", "#", "%"];
const MEDIUM_GLYPHS = ["%", "#", "*", "+", "="];
const LIGHT_GLYPHS = ["+", "=", "-", ":"];
const DUST_GLYPHS = [".", ":", "-"];
const BORDER_GLYPHS = ["/", "\\", "|", "_"];

// 29 rows x 126 columns clean typographical template modeled on the ATMOS reference
// E (30 cols) + 6 spaces + D (38 cols) + 8 spaces + S (44 cols) = 126 cols
const CINEMATIC_LARGE_TEMPLATE = [
  ".____________________________.      .____________________________.                         ...._...                 ",
  "|@%@@#%@%%@@@#%%%@@@#%#@@#%@@|      |%@@@#=%#%#@#%%#%@@@@##%@@#%@\\.                  .____%###%@#%#%@%____.        ",
  "|@@%#@#%%@%%@@@#%@@#%#%%#%@%%|      |@#%@#@@%%%@%@@%@@#%@@%%#@@#%@\\\\.              /_%##@#%#%%@@#@##%%#@#%%#@__.   ",
  "|%@#@%#%#%#@@#@#%#%%#@@#@@#%@|      |@#%@#%#%##@%%@%#%@%#%@@#%#@@#%@\\\\           ./@@#%#@@#@@@%%@@@%@#%%#@@##@@\\\\  ",
  "|#@#@#%%%@%@%#@@%@@@@@@%@%@%%|      |@#%@@@##%#%@%@#%#@%@@#%@@#%%@#%@@\\         /#@%@#%@#@@#%%@#%@@#%@%%#%@@#%#@\\. ",
  "|%%%@%@@#%%@%#%#%@@@%@#@@#%%%|      |%@%@#%@@#%#%@#%#%%@%%@#@%@@#%@@#%@\\       /#%#%%@@%@%#%@%#%@@#%@@#%%@%%@@@%#@@\\",
  "|@%@@#%#%@%@@#%#@#@%#%%%#%@#%|      |#%#@@#%@%%%@##@@@@@@#@@%#%%@%%@@#%@\\     |%%#%@%@@%#%@#@#%------\\%#%@%@@@##@#%%.",
  "|%%#@@%%%%%@#.................      |##@#@@@#@@##%/--------\\%##@@#%@@#%%@|    #%%%@@%@@%#%@@%/ .       \\##@%#%%@#%@%|",
  "|%%#%#%#%%%#@|                      |@@%#@@@#@##%/          \\@@#%#%#@@%%@|   |#%%@@@%%#%@%%@@           |@%@%%#@@@%%@|",
  "|%#%%#%%@#%@#|                      |#%@%@#@%%@#/            \\##@@#%%@@%#|   |%#@@@@#@@%%#%#%\\.         .-----------/ ",
  "|%#%%#%#%%#@@|                      |@%%#@#%%%%#|            |%%##@@#@@%%|   |%@%%#@#%#%%#%#@%_____.                 ",
  "|%%#%@#%#%%#%|______________.       |@#%#@#%#%%#|            |%%#@#%%#@%%|    %@%%%%#%#@#@%%%@@#%##%%_____.          ",
  "|%%#%#%#%%%#%%@@#%#%%#@@#%@@|       |=%#%%@%#%#%|            |%%#%#%#%%#%|    \\##%%#@@%%%#%#@#%#%%#%#%%%%#%@__\\      ",
  "|%%#%#%#%%#%%@%%#@#%%@%%#%@@|       |%%#%#%#%%#%|            |*%%#%#%%#%#|     \\%%#%#%%%%#%%#%###%%#%@%%@#%#%%\\\\     ",
  "|%*#%+#%%*%#%%#%#%%%#%%%#%@@|       |#%%%#%%*%#*|            |%%*#%%*#%#%|      .=#%#%#####%#%%%###%#%%#%%#%%#%%#\\.  ",
  "|%%*#*%#%#*#%#--------------.       |#%%#%%%*#%*|            |#%#%%#*%#%#|        :\\%##%%%*%*%#%#%%*#%%***%%%#%#%##- ",
  "|#%#%#%#+%#%#|                      |=%#**%*#*%+|            |%+#%##**#%#|          \\--%#%%#%#%+*%%*%*#%%*%%**#%%+%**|",
  "|*#%##+*=*#%#|                      |#%#%%#+%#+%|            |%+*=*%*%#+%|              .--:--+=###%###***%#%%#+%#%*%+%*",
  "|*#%##=+%*#%#|                      |=#**%##=%%#+\\          /#%#=%*#%#%%/    .____.____.__.      .---+%+%####*%##**%##+.",
  "|#%#-***#%%**|________________.     |=+%+++=##=#*%\\        /=#%=*%#%#%%/    |=%+=#++=*#+%#=%            \\\\*+=#%*#+#=##%%+",
  "|-*#=%=+%#%#=-%#%*=+%#=#==#*#%|     |-++%+-%%*%#*=+\\______/+=*#--**#%#/     +##-#==%++-#=%*\\             .%#+++%%=+*==%**=",
  "|#*+-%%%%#=%=#%#%%+#%=+##%--%#|     |-*#--=*#%#%#%+=*#+=#%*#%==+*#%#%/      *=#%+%+%-%%%#-#=.           :*#-#*#%==+#%**+--",
  "|+%*+#+#=%+++:%#+-=+%-+-#%#+#+|     |:%+#+=--#-=-:#*%+#+-*%#%#+-=#%#.       |-*=#+-*#%#*:%#%#++:-*:--###*=***:+=%%%%%=*=.",
  "|*=:%-#%=-#==%-:+:=--#-#%#*--%|     |:=%%-#+--#=-:--*#%*-+#%#*--*#*.         \\+#+#%%-%=##*:#::-*%+-=##:%:--%*::+#-%::**%.",
  "|*:%#+:==:+:-*:%=--:+#+%+=:::#|     |.++-##-**-+:+:-=+%+-*#%#+--#:            --:+#+%+=:::#*:%:#:=%+-=+-++#=*:::++:--.  ",
  "|.*..:*+:-*::.#..:.:=%--+++-:%|     |.#=:##+..+.-=-.:+*=:+##+=--:               .:.=%--+++-:%**+-*+%=:*%=#-**++=:...    ",
  "|-+.:..--+-.:-:-..==.:.==.*=..|     |.:=..-:+=.=-:..:+=:-+*+=-:.                    .==.:.==.*=..=.=+*+--=#---:###*:.    ",
  " . . ..  . .  . .  .::=:-+*=*+       . .  .  . .  .  . . . .                           .::=:-+*=*+:+==...:.:*+...       ",
  "                     . . . .                                                                  . . . . .                   ",
];

// 11 rows x 43 cols clean template for Sidebar view
const COMPACT_TEMPLATE = [
  " .__________.   ._________.     .___###___. ",
  " |@@#%@@#%@@|   |@@#%@@#%@\\.   /@@#%@@@#%@\\",
  " |@#%@@#|....   |@#%@@|  \\@\\  |@@#%.   .\\@|",
  " |@#%@@#|___    |@#%@@|   |@|  \\@@#%@___   ",
  " |@#%#%@@#%@|   |@#%@@|   |@|   \\@@@#%%@\\  ",
  " |%#*#%#|...    |%#*#%|   |%|     .\\*#%%#\\ ",
  " |*#%#*%+===.   |*#%#%|  /#%| .____. \\*#%#|",
  " |+#%+=*#%#*|   |+#%+=+/#%#%| |+*=*#+/+#%#/",
  " |:=+-*+=+*+|   |:=+-*+=+*+.   \\+=*+-=*+:. ",
  "  .:=-:..:-:     .:=-:..:-:     .:=-:..:.  ",
  "    .  ..          .  ..          .  ..    ",
];

type DensityType = "space" | "border" | "dense" | "medium" | "light" | "dust";

interface CellState {
  initialChar: string;
  char: string;
  type: DensityType;
  intensity: number; // 0..1 (orange glyph trail glow)
  scanIntensity: number; // 0..1 (horizontal scanline trail across voids)
  scanChar: string;
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

function getDensityType(ch: string, rowIndex: number, totalRows: number): DensityType {
  if (ch === " ") return "space";
  if (BORDER_GLYPHS.includes(ch)) return "border";
  const ratio = rowIndex / totalRows;
  if (ratio >= 0.88) return "dust";
  if (ratio >= 0.75) return "light";
  if (DENSE_GLYPHS.includes(ch)) return "dense";
  if (MEDIUM_GLYPHS.includes(ch)) return "medium";
  if (LIGHT_GLYPHS.includes(ch)) return "light";
  return "dust";
}

function getRandomGlyph(type: DensityType, fallback: string): string {
  if (type === "dense") return DENSE_GLYPHS[Math.floor(Math.random() * DENSE_GLYPHS.length)];
  if (type === "medium") return MEDIUM_GLYPHS[Math.floor(Math.random() * MEDIUM_GLYPHS.length)];
  if (type === "light") return LIGHT_GLYPHS[Math.floor(Math.random() * LIGHT_GLYPHS.length)];
  if (type === "dust") return DUST_GLYPHS[Math.floor(Math.random() * DUST_GLYPHS.length)];
  return fallback;
}

function getBaseColor(type: DensityType, rowIndex: number, totalRows: number): string {
  const ratio = rowIndex / totalRows;
  if (ratio >= 0.9) return "#52525B";
  if (ratio >= 0.78) return "#71717A";
  if (ratio >= 0.62) return "#A1A1AA";
  if (type === "dense") return "#FFFFFF";
  if (type === "medium") return "#E4E4E7";
  if (type === "border") return "#E4E4E7";
  return "#A1A1AA";
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

    const getResolvedFontFamily = () => {
      const cssVar = window.getComputedStyle(document.body).getPropertyValue("--font-ioskeley-mono").trim();
      if (cssVar) {
        return `${cssVar}, monospace`;
      }
      const computed = window.getComputedStyle(container).fontFamily;
      if (computed && !computed.includes("var(")) {
        return computed;
      }
      return "monospace";
    };

    // Initialize grid cells
    const grid: CellState[][] = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      const line = lines[r].padEnd(cols, " ");
      for (let c = 0; c < cols; c++) {
        const ch = line[c];
        const type = getDensityType(ch, r, rows);
        grid[r][c] = {
          initialChar: ch,
          char: ch,
          type,
          intensity: 0,
          scanIntensity: 0,
          scanChar: r % 2 === 0 ? "-" : c % 3 === 0 ? "=" : ".",
          baseColor: getBaseColor(type, r, rows),
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
      const fontFamily = getResolvedFontFamily();
      const containerWidth = container.clientWidth || (compact ? 230 : 900);

      const maxCharWidth = compact ? 5.2 : 7.4;
      const charWidth = Math.min(maxCharWidth, Math.max(2.4, (containerWidth - 8) / cols));
      // Use 1.42x charWidth for fontSize so each glyph (~0.85 * charWidth) has crisp horizontal breathing space
      const fontSize = charWidth * 1.42;
      const charHeight = charWidth * 1.82;
      const totalWidth = Math.ceil(cols * charWidth);
      const totalHeight = Math.ceil(rows * charHeight);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = totalWidth * dpr;
      canvas.height = totalHeight * dpr;
      canvas.style.width = `${totalWidth}px`;
      canvas.style.height = `${totalHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textBaseline = "top";

      return { fontSize, fontFamily, charWidth, charHeight, totalWidth, totalHeight };
    };

    let metrics = computeMetrics();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        metrics = computeMetrics();
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      metrics = computeMetrics();
    });
    resizeObserver.observe(container);

    const applyWakeAt = (colCenter: number, rowCenter: number) => {
      const glyphRadius = 6.2;
      const scanHalfRows = 2.6;
      const scanHalfCols = 32;

      for (let r = 0; r < rows; r++) {
        const rowDiff = Math.abs(r - rowCenter);
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          const colDiff = Math.abs(c - colCenter);

          if (cell.type !== "space") {
            const dist = Math.hypot((c - colCenter) * 0.85, (r - rowCenter) * 1.35);
            if (dist <= glyphRadius) {
              const addedIntensity = Math.max(0, 1.0 - (dist / glyphRadius) * 0.65);
              cell.intensity = Math.max(cell.intensity, addedIntensity);

              if (cell.type !== "border" && Math.random() < 0.35) {
                cell.char = getRandomGlyph(cell.type, cell.initialChar);
              }

              if (Math.random() < 0.05 && particles.length < 40) {
                particles.push({
                  x: c * metrics.charWidth + (Math.random() - 0.5) * 8,
                  y: r * metrics.charHeight + (Math.random() - 0.5) * 8,
                  vx: (Math.random() - 0.5) * 14,
                  vy: -Math.random() * 16 - 4,
                  char: [".", ":", "-", "+", "="][Math.floor(Math.random() * 5)],
                  opacity: 0.9,
                });
              }
            } else if (rowDiff <= scanHalfRows && colDiff <= scanHalfCols) {
              // Subtle horizontal scanline illumination across letter rows too
              const scanBoost = Math.max(0, 0.55 - (colDiff / scanHalfCols) * 0.45 - rowDiff * 0.12);
              cell.intensity = Math.max(cell.intensity, scanBoost);
            }
          } else if (rowDiff <= scanHalfRows && colDiff <= scanHalfCols) {
            // Persistent horizontal dashed scanline trail in empty spaces
            const scanBoost = Math.max(0, 0.62 - (colDiff / scanHalfCols) * 0.52 - rowDiff * 0.15);
            cell.scanIntensity = Math.max(cell.scanIntensity, scanBoost);
          }
        }
      }
    };

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
      const nextX = Math.max(0, Math.min(x, metrics.totalWidth));
      const nextY = Math.max(0, Math.min(y, metrics.totalHeight));

      // Interpolate intermediate steps if pointer moved fast so the trail never has gaps
      if (targetX >= 0 && targetY >= 0) {
        const dx = nextX - targetX;
        const dy = nextY - targetY;
        const stepDist = Math.hypot(dx, dy);
        const steps = Math.min(12, Math.max(1, Math.ceil(stepDist / (metrics.charWidth * 2))));
        for (let s = 1; s <= steps; s++) {
          const ix = targetX + (dx * s) / steps;
          const iy = targetY + (dy * s) / steps;
          applyWakeAt(ix / metrics.charWidth, iy / metrics.charHeight);
        }
      } else {
        applyWakeAt(nextX / metrics.charWidth, nextY / metrics.charHeight);
      }

      targetX = nextX;
      targetY = nextY;
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
      targetX = -999;
      targetY = -999;
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

      // 1. Shimmer engine: micro-mutate random interior cells periodically
      if (now - lastShimmerTime > 90) {
        lastShimmerTime = now;
        const shimmerCount = compact ? 2 : 5;
        for (let i = 0; i < shimmerCount; i++) {
          const randR = Math.floor(Math.random() * rows);
          const randC = Math.floor(Math.random() * cols);
          const cell = grid[randR][randC];
          if (cell.type !== "space" && cell.type !== "border") {
            if (Math.random() < 0.35) {
              cell.char = getRandomGlyph(cell.type, cell.initialChar);
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
        if (!isPointerInside && !isSweeping && idleDuration > 3500) {
          isSweeping = true;
          sweepProgress = 0;
          sweepStartTime = now;
        }

        if (isSweeping) {
          const sweepDuration = 3200; // ms
          const elapsed = now - sweepStartTime;
          sweepProgress = elapsed / sweepDuration;

          if (sweepProgress >= 1.0) {
            isSweeping = false;
            lastInteractionTime = now;
          } else {
            const sweepCol = sweepProgress * (cols + 16) - 8;
            const sweepRow = rows * 0.48 + Math.sin(sweepProgress * Math.PI * 2.1) * (rows * 0.24);

            activeScanX = sweepCol * metrics.charWidth;
            activeScanY = sweepRow * metrics.charHeight;
            drawScanReticle = true;

            applyWakeAt(sweepCol, sweepRow);
          }
        } else if (isPointerInside) {
          activeScanX = targetX;
          activeScanY = targetY;
          drawScanReticle = true;
        }
      }

      // 3. Clear Canvas
      ctx.clearRect(0, 0, metrics.totalWidth, metrics.totalHeight);

      const { charWidth, charHeight, fontSize, fontFamily } = metrics;
      ctx.font = `${fontSize}px ${fontFamily}`;

      // 4. Render Grid Cells (both letter glyphs and horizontal scanline trails)
      for (let r = 0; r < rows; r++) {
        const y = r * charHeight;
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          const x = c * charWidth;

          if (cell.type === "space") {
            if (cell.scanIntensity > 0) {
              cell.scanIntensity = Math.max(0, cell.scanIntensity - delta * 0.55);
              if (cell.scanIntensity > 0.02) {
                ctx.fillStyle = `rgba(234, 88, 12, ${Math.min(0.65, cell.scanIntensity)})`;
                ctx.fillText(cell.scanChar, x, y);
              }
            }
            continue;
          }

          // Smooth exponential decay for letter trail
          if (cell.intensity > 0) {
            cell.intensity = Math.max(0, cell.intensity - delta * 0.65);
            if (cell.intensity === 0 && cell.type !== "border") {
              cell.char = cell.initialChar;
            }
          }

          if (cell.intensity > 0.02) {
            const glowAlpha = Math.min(cell.intensity, 1.0);
            ctx.fillStyle = `rgba(255, 69, 0, ${Math.max(0.35, glowAlpha)})`;
            ctx.fillText(cell.char, x, y);

            if (cell.intensity > 0.55 && !compact) {
              ctx.shadowColor = "rgba(255, 69, 0, 0.55)";
              ctx.shadowBlur = 4;
              ctx.fillStyle = "#FF6B1A";
              ctx.fillText(cell.char, x, y);
              ctx.shadowBlur = 0;
            }
          } else {
            ctx.fillStyle = cell.baseColor;
            ctx.fillText(cell.char, x, y);
          }
        }
      }

      // 5. Draw Sci-Fi Crosshair Reticle & Status Tag (Ref: circle with ✕ prongs & label)
      if (!compact && drawScanReticle && activeScanX >= 0 && activeScanY >= 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.2;

        // Outer ring
        const reticleR = fontSize * 1.05;
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

        // Label beside reticle (Ref: "BREATHE")
        ctx.font = `bold ${Math.max(8, fontSize * 0.85)}px ${fontFamily}`;
        ctx.fillStyle = "#E4E4E7";
        ctx.fillText("BREATHE", activeScanX + reticleR + 6, activeScanY - 4);

        ctx.restore();
      }

      // 6. Update & Render Trail Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.opacity -= delta * 1.1;

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
      className={`relative flex items-center justify-center select-none overflow-hidden font-mono ${
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
