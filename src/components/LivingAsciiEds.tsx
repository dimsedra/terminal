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

// 12 rows x 44 cols clean template for Sidebar view
const COMPACT_TEMPLATE = [
  " .__________.   ._________.     .___###___. ",
  " |@@#%@@#%@@|   |@@#%@@#%@\\.   /@@#%@@@#%@\\",
  " |@#%@@#%@@%|   |@#%@@#%@@%\\  |@@#%@..%@#%%|",
  " |@#%|.......   |@#%|   \\@@|  |@@#%.   .\\@|",
  " |@#%|______.   |@#%|    |@|   \\@@#%@___.  ",
  " |@#%#%@@#%@|   |@#%|    |@|    \\@@@#%%@@\\ ",
  " |%#*#%#*%#%|   |%#%|    |%|     .\\*#%%#%@\\",
  " |%#%|.......   |%#%|    |%|  .____. \\*#%%#|",
  " |*#%|______.   |*#%|   /#%|  |+*=*#\\  |*#%|",
  " |+#%+=*#%#*|   |+#%+=+/#%#|  \\+#%+=*#+/#%#/",
  " |:=+-*+=+*+|   |:=+-*+=+*+.   \\:=+-*+=+*:. ",
  "  .:=-:..:-:     .:=-:..:-:      .:=-:..:.  ",
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

const ASCII_BASE_COLOR = "#FFFFFF";

function getBaseColor(): string {
  return ASCII_BASE_COLOR;
}

// ============================================================================
// SETTING RADIUS & ANIMASI HOVER (Ubah nilainya di sini sesuai seleramu)
// ============================================================================
export const HOVER_EFFECT_CONFIG = {
  // Seberapa jauh garis scanline menjalar ke kiri dan kanan di ruang kosong (dalam kolom)
  scanlineReachCols: 26,

  // Ketebalan vertikal sinar laser (1.35 = sekitar 1-2 baris, naikkan jika ingin lebih tebal)
  laserHeightRows: 1.75,

  // Batas baris utama yang mendapat pendaran oranye paling terang
  coreRowThreshold: 1,

  // Lebar pendaran efek saat mengenai huruf EDS (dalam kolom)
  letterGlowRadiusCols: 4.5,

  // Kecepatan pudarnya jejak trail (semakin besar nilainya, semakin cepat hilang)
  decaySpeed: 0.75,

  // Kecepatan interval pergantian karakter saat terkena hover (dalam milidetik, 45ms = ~22 fps mutation)
  mutationIntervalMs: 45,

  // Jumlah sel yang berkedip per siklus saat idle agar huruf terasa hidup dan berdenyut
  idleShimmerCount: 26,
};

const PAD_TOP_ROWS = 6;
const PAD_BOTTOM_ROWS = 6;
const PAD_SIDE_COLS = 16;

const PADDED_LARGE_TEMPLATE = [
  ...Array.from({ length: PAD_TOP_ROWS }, () => " ".repeat(126 + PAD_SIDE_COLS * 2)),
  ...CINEMATIC_LARGE_TEMPLATE.map(
    (line) => " ".repeat(PAD_SIDE_COLS) + line.padEnd(126, " ") + " ".repeat(PAD_SIDE_COLS)
  ),
  ...Array.from({ length: PAD_BOTTOM_ROWS }, () => " ".repeat(126 + PAD_SIDE_COLS * 2)),
];

export function LivingAsciiEds({ compact = false }: LivingAsciiEdsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lines = compact ? COMPACT_TEMPLATE : PADDED_LARGE_TEMPLATE;
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
          baseColor: getBaseColor(),
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
    interface SweepTrajectory {
      direction: 1 | -1;
      startRow: number;
      endRow: number;
      frequency: number;
      amplitude: number;
      phase: number;
      duration: number;
      nextIdleDelay: number;
      lastCol: number;
      lastRow: number;
    }

    let isSweeping = false;
    let sweepStartTime = 0;
    let nextIdleDelay = 3500;
    let activeTrajectory: SweepTrajectory | null = null;

    const createRandomTrajectory = (): SweepTrajectory => {
      const padTop = compact ? 0 : PAD_TOP_ROWS;
      const letterRows = 29;
      const minRow = padTop + 3;
      const maxRow = padTop + letterRows - 2;

      const startRow = minRow + Math.random() * (maxRow - minRow);
      const endRow = minRow + Math.random() * (maxRow - minRow);
      const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
      const frequency = 1.2 + Math.random() * 1.6;
      const amplitude = 2.5 + Math.random() * 4.5;
      const phase = Math.random() * Math.PI * 2;
      const duration = 2500 + Math.random() * 1100;
      const delay = 4000 + Math.random() * 3500;

      return {
        direction,
        startRow,
        endRow,
        frequency,
        amplitude,
        phase,
        duration,
        nextIdleDelay: delay,
        lastCol: direction === 1 ? -12 : cols + 12,
        lastRow: startRow,
      };
    };

    const computeMetrics = () => {
      const fontFamily = getResolvedFontFamily();
      const containerWidth = container.clientWidth || (compact ? 230 : 1150);

      const targetCharWidth = compact ? 5.2 : 7.25;
      const charWidth = Math.min(targetCharWidth, Math.max(2.2, (containerWidth - 8) / cols));
      // Use 1.42x charWidth for fontSize so each glyph has crisp horizontal breathing space
      const fontSize = charWidth * 1.42;
      const charHeight = charWidth * 1.78;
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
      const activeRadiusCols = HOVER_EFFECT_CONFIG.scanlineReachCols;
      const laserHeight = HOVER_EFFECT_CONFIG.laserHeightRows;
      const coreThreshold = HOVER_EFFECT_CONFIG.coreRowThreshold;
      const letterRadius = HOVER_EFFECT_CONFIG.letterGlowRadiusCols;

      for (let r = 0; r < rows; r++) {
        const rowDiff = Math.abs(r - rowCenter);
        if (rowDiff > laserHeight) continue;

        const isCoreRow = rowDiff <= coreThreshold;

        for (let c = 0; c < cols; c++) {
          const colDiff = Math.abs(c - colCenter);
          if (colDiff > activeRadiusCols) continue;

          const cell = grid[r][c];

          if (cell.type !== "space") {
            // Letter glyphs: contact illumination
            if (isCoreRow && colDiff <= letterRadius) {
              const addedIntensity = Math.max(0, 1.0 - (colDiff / letterRadius) * 0.45);
              cell.intensity = Math.max(cell.intensity, addedIntensity);

              if (cell.type !== "border" && Math.random() < 0.3) {
                cell.char = getRandomGlyph(cell.type, cell.initialChar);
              }

              if (Math.random() < 0.03 && particles.length < 25) {
                particles.push({
                  x: c * metrics.charWidth + (Math.random() - 0.5) * 6,
                  y: r * metrics.charHeight,
                  vx: (Math.random() - 0.5) * 12,
                  vy: -Math.random() * 14 - 4,
                  char: [".", ":", "·", "-"][Math.floor(Math.random() * 4)],
                  opacity: 0.85,
                });
              }
            } else if (!isCoreRow && colDiff <= 3.0) {
              // Subtle edge fringe on immediate adjacent row
              const fringeIntensity = Math.max(0, 0.38 - (colDiff / 3.0) * 0.25);
              cell.intensity = Math.max(cell.intensity, fringeIntensity);
            }
          } else {
            // Empty spaces: horizontal laser scanline (Ref: dashed lines across voids)
            if (isCoreRow) {
              const scanBoost = Math.max(0, 0.72 - (colDiff / activeRadiusCols) * 0.58);
              cell.scanIntensity = Math.max(cell.scanIntensity, scanBoost);

              // Distinctive laser scanline typography matching ATMOS
              if (colDiff < 4) {
                cell.scanChar = ["=", "+", "*", "-"][Math.floor(Math.random() * 4)];
              } else if (colDiff < 14) {
                cell.scanChar = ["-", "=", "+"][Math.floor(Math.random() * 3)];
              } else {
                cell.scanChar = ["-", "·", "."][Math.floor(Math.random() * 3)];
              }
            } else if (colDiff <= 14) {
              // Faint dotted fringe 1 row above/below
              const fringeScan = Math.max(0, 0.32 - (colDiff / 14) * 0.25);
              cell.scanIntensity = Math.max(cell.scanIntensity, fringeScan);
              cell.scanChar = ["·", "."][Math.floor(Math.random() * 2)];
            }
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

      if (x < -30 || x > metrics.totalWidth + 30 || y < -30 || y > metrics.totalHeight + 30) {
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

      // 1. Continuous real-time mutation engine
      if (now - lastShimmerTime > HOVER_EFFECT_CONFIG.mutationIntervalMs) {
        lastShimmerTime = now;

        // Keep refreshing wake when hovering in place so mutation stays continuous
        if (isPointerInside && targetX >= 0 && targetY >= 0) {
          applyWakeAt(targetX / metrics.charWidth, targetY / metrics.charHeight);
        }

        // Active trail cells constantly cycle glyphs in real-time
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cell = grid[r][c];
            if (cell.type === "space" || cell.type === "border") continue;

            if (cell.intensity > 0.06) {
              cell.char = getRandomGlyph(cell.type, cell.initialChar);
            }
          }
        }

        // Ambient shimmer: micro-mutate random cells so typography stays living
        const shimmerCount = compact ? 4 : HOVER_EFFECT_CONFIG.idleShimmerCount;
        for (let i = 0; i < shimmerCount; i++) {
          const randR = Math.floor(Math.random() * rows);
          const randC = Math.floor(Math.random() * cols);
          const cell = grid[randR][randC];
          if (cell.type !== "space" && cell.type !== "border" && cell.intensity <= 0.06) {
            if (Math.random() < 0.45) {
              cell.char = getRandomGlyph(cell.type, cell.initialChar);
            } else {
              cell.char = cell.initialChar;
            }
          }
        }
      }

      // 2. Autonomous Idle Sweep (Hero only - mathematically randomized continuous trail)
      if (!compact) {
        const idleDuration = now - lastInteractionTime;
        if (!isPointerInside && !isSweeping && idleDuration > nextIdleDelay) {
          isSweeping = true;
          sweepStartTime = now;
          activeTrajectory = createRandomTrajectory();
        }

        if (isSweeping && activeTrajectory) {
          const elapsed = now - sweepStartTime;
          const t = elapsed / activeTrajectory.duration;

          if (t >= 1.0) {
            isSweeping = false;
            nextIdleDelay = activeTrajectory.nextIdleDelay;
            activeTrajectory = null;
            lastInteractionTime = now;
          } else {
            const { direction, startRow, endRow, amplitude, frequency, phase } = activeTrajectory;

            // Parametric continuous column progress
            const col = direction === 1
              ? t * (cols + 24) - 12
              : (1 - t) * (cols + 24) - 12;

            // Parametric continuous row with harmonic wave
            const baseRow = startRow + (endRow - startRow) * t;
            const wave = amplitude * Math.sin(t * Math.PI * 2 * frequency + phase);
            const row = Math.max(2, Math.min(rows - 3, baseRow + wave));

            // Smooth interpolation between frames to guarantee an unbroken trail
            const dCol = col - activeTrajectory.lastCol;
            const dRow = row - activeTrajectory.lastRow;
            const dist = Math.hypot(dCol, dRow);
            const steps = Math.min(10, Math.max(1, Math.ceil(dist / 2.5)));

            for (let s = 1; s <= steps; s++) {
              const ic = activeTrajectory.lastCol + (dCol * s) / steps;
              const ir = activeTrajectory.lastRow + (dRow * s) / steps;
              applyWakeAt(ic, ir);
            }

            activeTrajectory.lastCol = col;
            activeTrajectory.lastRow = row;
          }
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
              cell.scanIntensity = Math.max(0, cell.scanIntensity - delta * HOVER_EFFECT_CONFIG.decaySpeed);
              if (cell.scanIntensity > 0.02) {
                ctx.fillStyle = `rgba(234, 88, 12, ${Math.min(0.65, cell.scanIntensity)})`;
                ctx.fillText(cell.scanChar, x, y);
              }
            }
            continue;
          }

          // Smooth exponential decay for letter trail
          if (cell.intensity > 0) {
            cell.intensity = Math.max(0, cell.intensity - delta * HOVER_EFFECT_CONFIG.decaySpeed);
            if (cell.intensity <= 0.02 && cell.type !== "border") {
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

      // 5. Update & Render Trail Particles
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
        compact ? "w-full py-1 pointer-events-none" : "w-full max-w-full py-1 cursor-default"
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
