"use client";

import React, { useEffect, useRef } from "react";

interface LivingAsciiEdsProps {
  compact?: boolean;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
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

  // Jangkauan fringe titik-titik samar di baris atas dan bawah laser
  fringeColReach: 14,
};

const PAD_TOP_ROWS = 6;
const PAD_BOTTOM_ROWS = 6;
const LETTER_BLOCK_WIDTH = 122;

export function LivingAsciiEds({ compact = false, anchorRef }: LivingAsciiEdsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    const computeMetrics = () => {
      const fontFamily = getResolvedFontFamily();

      if (compact) {
        const containerWidth = container.clientWidth || 230;
        const targetCharWidth = 5.2;
        const charWidth = Math.min(targetCharWidth, Math.max(2.2, (containerWidth - 8) / 44));
        const fontSize = charWidth * 1.42;
        const charHeight = charWidth * 1.78;
        const totalWidth = Math.ceil(44 * charWidth);
        const totalHeight = Math.ceil(12 * charHeight);

        const dpr = window.devicePixelRatio || 1;
        canvas.width = totalWidth * dpr;
        canvas.height = totalHeight * dpr;
        canvas.style.width = `${totalWidth}px`;
        canvas.style.height = `${totalHeight}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textBaseline = "top";

        return {
          fontSize,
          fontFamily,
          charWidth,
          charHeight,
          totalWidth,
          totalHeight,
          cols: 44,
          rows: 12,
          edsStartRow: 0,
          edsStartCol: 0,
        };
      }

      // Hero Full Screen mode (spans full workspace, behind text, above background)
      const containerWidth = container.clientWidth || window.innerWidth;
      const containerHeight = container.clientHeight || (window.innerHeight - 97);

      const maxColsNeeded = LETTER_BLOCK_WIDTH + 8; // 130
      const charWidth = Math.min(7.25, Math.max(2.2, (containerWidth - 16) / maxColsNeeded));
      const fontSize = charWidth * 1.42;
      const charHeight = charWidth * 1.78;
      const totalWidth = containerWidth;
      const totalHeight = containerHeight;

      const cols = Math.ceil(containerWidth / charWidth);
      const rows = Math.ceil(containerHeight / charHeight);

      // Reserve exact vertical space in the foreground flex flow
      const totalEdsRows = 29 + PAD_TOP_ROWS + PAD_BOTTOM_ROWS;
      const placeholderHeight = Math.ceil(totalEdsRows * charHeight);
      if (anchorRef?.current) {
        anchorRef.current.style.height = `${placeholderHeight}px`;
      }

      // Determine where the EDS letter block sits on the full-screen grid
      let edsStartRow = Math.max(0, Math.round((rows - 29) / 2));
      let edsStartCol = Math.max(0, Math.round((cols - LETTER_BLOCK_WIDTH) / 2));

      if (anchorRef?.current) {
        const anchorRect = anchorRef.current.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const anchorRelTop = anchorRect.top - containerRect.top;
        edsStartRow = Math.max(0, Math.round((anchorRelTop + PAD_TOP_ROWS * charHeight) / charHeight));
        const anchorCenterX = (anchorRect.left + anchorRect.right) / 2 - containerRect.left;
        edsStartCol = Math.max(0, Math.round((anchorCenterX - (LETTER_BLOCK_WIDTH * charWidth) / 2) / charWidth));
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.ceil(containerWidth * dpr);
      canvas.height = Math.ceil(containerHeight * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textBaseline = "top";

      return {
        fontSize,
        fontFamily,
        charWidth,
        charHeight,
        totalWidth,
        totalHeight,
        cols,
        rows,
        edsStartRow,
        edsStartCol,
      };
    };

    let metrics = computeMetrics();

    const buildGrid = (m: ReturnType<typeof computeMetrics>) => {
      const { cols, rows, edsStartRow, edsStartCol } = m;
      const g: CellState[][] = [];

      for (let r = 0; r < rows; r++) {
        g[r] = [];
        const templateRow = r - edsStartRow;
        const isWithinEds =
          templateRow >= 0 &&
          templateRow < (compact ? COMPACT_TEMPLATE.length : CINEMATIC_LARGE_TEMPLATE.length);
        const templateLine = isWithinEds
          ? compact
            ? COMPACT_TEMPLATE[templateRow]
            : CINEMATIC_LARGE_TEMPLATE[templateRow]
          : null;

        for (let c = 0; c < cols; c++) {
          const templateCol = c - edsStartCol;
          let ch = " ";
          if (templateLine && templateCol >= 0 && templateCol < templateLine.length) {
            ch = templateLine[templateCol];
          }

          const type = getDensityType(ch, templateRow >= 0 ? templateRow : 0, compact ? 12 : 29);
          g[r][c] = {
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
      return g;
    };

    let grid = buildGrid(metrics);

    const particles: Particle[] = [];
    let animationFrameId: number;
    let lastTime = performance.now();
    let lastShimmerTime = performance.now();
    let lastInteractionTime = performance.now();

    // Reticle & cursor position state
    let targetX = -999;
    let targetY = -999;
    let isPointerInside = false;

    // Autonomous sweep state (Shooting star trajectory)
    interface SweepTrajectory {
      direction: 1 | -1;
      startRow: number;
      endRow: number;
      bowHeight: number;
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
      const { rows, cols, edsStartRow } = metrics;
      const minRow = Math.max(2, edsStartRow - 3);
      const maxRow = Math.min(rows - 3, edsStartRow + 29 + 4);

      const startRow = minRow + Math.random() * (maxRow - minRow);
      const endRow = minRow + Math.random() * (maxRow - minRow);
      const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
      // Gentle subtle curvature (-3.0 to +3.0 rows)
      const bowHeight = (Math.random() - 0.5) * 6.0;
      // Swift shooting star streak: 1500ms to 2200ms
      const duration = 1500 + Math.random() * 700;
      // Random cadence: 3800ms to 7000ms
      const delay = 3800 + Math.random() * 3200;

      return {
        direction,
        startRow,
        endRow,
        bowHeight,
        duration,
        nextIdleDelay: delay,
        lastCol: direction === 1 ? -16 : cols + 16,
        lastRow: startRow,
      };
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        metrics = computeMetrics();
        grid = buildGrid(metrics);
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      metrics = computeMetrics();
      grid = buildGrid(metrics);
    });
    resizeObserver.observe(container);
    if (anchorRef?.current) {
      resizeObserver.observe(anchorRef.current);
    }

    const applyWakeAt = (colCenter: number, rowCenter: number) => {
      const activeRadiusCols = HOVER_EFFECT_CONFIG.scanlineReachCols;
      const laserHeight = HOVER_EFFECT_CONFIG.laserHeightRows;
      const coreThreshold = HOVER_EFFECT_CONFIG.coreRowThreshold;
      const letterRadius = HOVER_EFFECT_CONFIG.letterGlowRadiusCols;

      const { rows, cols } = metrics;

      for (let r = 0; r < rows; r++) {
        const rowDiff = Math.abs(r - rowCenter);
        if (rowDiff > laserHeight) continue;

        const isCoreRow = rowDiff <= coreThreshold;

        for (let c = 0; c < cols; c++) {
          const colDiff = Math.abs(c - colCenter);
          if (colDiff > activeRadiusCols) continue;

          const cell = grid[r]?.[c];
          if (!cell) continue;

          if (cell.type !== "space") {
            // Letter glyphs: contact illumination
            if (isCoreRow && colDiff <= letterRadius) {
              const addedIntensity = Math.max(0, 1.0 - (colDiff / letterRadius) * 0.45);
              cell.intensity = Math.max(cell.intensity, addedIntensity);

              if (cell.type !== "border" && Math.random() < 0.3) {
                cell.char = getRandomGlyph(cell.type, cell.initialChar);
              }

              if (Math.random() < 0.03 && particles.length < 35) {
                particles.push({
                  x: c + (Math.random() - 0.5) * 1.5,
                  y: r,
                  vx: (Math.random() - 0.5) * 2.5,
                  vy: -Math.random() * 2.2 - 0.5,
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
            } else if (colDiff <= HOVER_EFFECT_CONFIG.fringeColReach) {
              // Faint dotted fringe 1 row above/below
              const fringeScan = Math.max(0, 0.32 - (colDiff / HOVER_EFFECT_CONFIG.fringeColReach) * 0.25);
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
      document.addEventListener("mouseleave", onPointerLeave);
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
        for (let r = 0; r < metrics.rows; r++) {
          for (let c = 0; c < metrics.cols; c++) {
            const cell = grid[r]?.[c];
            if (!cell || cell.type === "space" || cell.type === "border") continue;

            if (cell.intensity > 0.06) {
              cell.char = getRandomGlyph(cell.type, cell.initialChar);
            }
          }
        }

        // Ambient shimmer: micro-mutate random cells on EDS letters so typography stays living
        const shimmerCount = compact ? 4 : HOVER_EFFECT_CONFIG.idleShimmerCount;
        for (let i = 0; i < shimmerCount; i++) {
          const randR = compact
            ? Math.floor(Math.random() * metrics.rows)
            : metrics.edsStartRow + Math.floor(Math.random() * 29);
          const randC = compact
            ? Math.floor(Math.random() * metrics.cols)
            : metrics.edsStartCol + Math.floor(Math.random() * LETTER_BLOCK_WIDTH);
          const cell = grid[randR]?.[randC];
          if (cell && cell.type !== "space" && cell.type !== "border" && cell.intensity <= 0.06) {
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
            const { direction, startRow, endRow, bowHeight } = activeTrajectory;

            // Parametric continuous column progress from off-screen edge to off-screen edge
            const col = direction === 1
              ? t * (metrics.cols + 32) - 16
              : (1 - t) * (metrics.cols + 32) - 16;

            // Straightforward shooting star streak with a single gentle bow curvature
            const baseRow = startRow + (endRow - startRow) * t;
            const bow = bowHeight * Math.sin(t * Math.PI);
            const row = Math.max(2, Math.min(metrics.rows - 3, baseRow + bow));

            // Smooth interpolation between frames to guarantee an unbroken trail
            const dCol = col - activeTrajectory.lastCol;
            const dRow = row - activeTrajectory.lastRow;
            const dist = Math.hypot(dCol, dRow);
            const steps = Math.min(12, Math.max(1, Math.ceil(dist / 2.5)));

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
      for (let r = 0; r < metrics.rows; r++) {
        const y = r * charHeight;
        for (let c = 0; c < metrics.cols; c++) {
          const cell = grid[r]?.[c];
          if (!cell) continue;
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

        if (p.opacity <= 0 || p.x < 0 || p.x > metrics.cols || p.y < 0 || p.y > metrics.rows) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(234, 88, 12, ${p.opacity * 0.85})`;
        ctx.fillText(p.char, p.x * metrics.charWidth, p.y * metrics.charHeight);
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
        document.removeEventListener("mouseleave", onPointerLeave);
      }
    };
  }, [compact, anchorRef]);

  if (compact) {
    return (
      <div
        ref={containerRef}
        className="relative flex items-center justify-center select-none overflow-hidden font-mono w-full py-1 pointer-events-none"
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

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden font-mono z-[5]"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="EDS 2D Typographical ASCII Emblem"
        className="block w-full h-full"
      />
    </div>
  );
}
