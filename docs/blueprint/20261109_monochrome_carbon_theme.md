---
title: "Blueprint: Carbon Black Theme, Ioskeley Mono Typography & 2D Living ASCII"
type: blueprint
parent_intent: docs/intent/20261109_monochrome_carbon_theme.md
status: Approved
last_updated: 2026-11-09
---

# Blueprint: Carbon Black Theme, Ioskeley Mono Typography & 2D Living ASCII

Translates [docs/intent/20261109_monochrome_carbon_theme.md](file:///home/eds/Code/terminal/docs/intent/20261109_monochrome_carbon_theme.md) and [docs/design/brand.md](file:///home/eds/Code/terminal/docs/design/brand.md) into concrete, testable technical contracts. Replaces legacy `#050505` and `#0A0A0A` surfaces with Carbon Black (`#161616`), loads self-hosted Ioskeley Mono web fonts via Next.js local font loader, shifts green accents and GitHub contribution tiles to a refined neutral monochrome scale, and replaces spinning 3D voxels with a canvas-based 2D living typographic ASCII emblem featuring live glyph shimmers, smooth orange hover trails, and a compact non-hover sidebar variant.

## Current Code & Gap Analysis

1. **Color Palette & Accents**:
   - `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/TerminalInterface.tsx`, and `src/components/StreamingTerminalOutput.tsx` contain hardcoded `#050505`, `#0A0A0A`, and mint green `#9AE6B4` classes (such as prompt symbol `❯`, kursor, chips, status badges).
   - Needs migration to Carbon Black (`#161616`), surface (`#1C1C1C`), border (`#27272A`), and neutral gray/white accents (`#E4E4E7` / `#A1A1AA` / `#FFFFFF`).

2. **Typography**:
   - `src/app/layout.tsx` currently imports `JetBrains_Mono` from `next/font/google`.
   - Needs transition to self-hosted WOFF2 assets of `Ioskeley Mono` using `next/font/local` with variable `--font-ioskeley-mono`.

3. **Contribution Grid**:
   - `src/content/contributions.ts` and `tests/github-contributions-grid.test.ts` define contribution quartile colors using GitHub greens (`#1f883d`, `#26a641`, `#39d353`, `#56f06f`).
   - Needs migration to monochrome scale (`#52525B`, `#71717A`, `#A1A1AA`, `#D4D4D8`, `#FFFFFF`) with updated unit test assertions.

4. **ASCII Emblem**:
   - `src/components/SpinningAsciiEds.tsx` renders rotating 3D voxels with green gradient faces (`FACE = gradient(["#1C4532", ...])`).
   - Needs replacement with `src/components/LivingAsciiEds.tsx` rendering high-density 2D typographic letters "EDS" matching the reference style with character-level orange trail illumination, live micro-shimmering, idle autonomous sweep, and compact sidebar adaptation.

---

## Design & Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │                 Root Layout                  │
                  │   - Carbon Black (#161616)                   │
                  │   - next/font/local (Ioskeley Mono)          │
                  └──────────────────────┬───────────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
            ┌──────────────────────────┐    ┌──────────────────────────┐
            │   TerminalInterface      │    │  StreamingTerminalOutput │
            │ - Neutral Gray Accents   │    │ - Monochrome Markdown    │
            │ - Header / Footer Border │    │ - Neutral Code Chips     │
            └────────────┬─────────────┘    └──────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ LivingAsciiEds (compact=f)  │ │ LivingAsciiEds (compact=t)  │
│ - Hero View                 │ │ - Sidebar Panel             │
│ - 2D Typographical "EDS"    │ │ - Compact scaled grid       │
│ - Living Shimmering Glyphs  │ │ - Living Shimmering Glyphs  │
│ - Interactive Orange Trail  │ │ - Pointer events disabled   │
│ - Autonomous Idle Sweep     │ │ - No hover trail            │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## Contracts

### BP-THEME-001: Carbon Black Theme & Global Neutral Color Tokens
- **Serves**: Intent boundary to eliminate all green accents, shift base background to Carbon Black (`#161616`), and preserve sharp contrast with pure white/gray text.
- **Input**: Tailwind utility classes and CSS variables in `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/TerminalInterface.tsx`, `src/components/StreamingTerminalOutput.tsx`, and `src/components/AiNoticeToast.tsx`.
- **Behavior**:
  - Updates root variables: `--background: #161616`, `--surface: #1C1C1C`, `--border: #27272A`, `--accent: #E4E4E7`.
  - Replaces all hardcoded `#050505` and `#0A0A0A` with `#161616` (background) and `#1C1C1C` (surfaces).
  - Replaces all `#9AE6B4` green accents (prompt `❯`, active badges, links, borders, cursor) with neutral slate/zinc (`#E4E4E7` / `#A1A1AA` / `#FFFFFF`).
- **Output**: Clean, cohesive dark carbon terminal UI completely devoid of green elements.
- **Failure**: Missing token or unstyled element leaving contrast lower than 4.5:1 against `#161616`.
- **Method**: `visual testing`
- **Verification**: Browser verification across hero view, active command output, `/about`, `/projects`, and AI chat session; contrast verification.
- **Commit**: `feat(theme): transition global surfaces and accents to carbon black and neutral gray`

---

### BP-FONT-002: Ioskeley Mono Web Font Integration
- **Serves**: Intent requirement to replace JetBrains Mono with self-hosted Ioskeley Mono across all terminal interface text and canvas glyphs.
- **Input**: WOFF2 font files (`IoskeleyMono-Regular.woff2`, `IoskeleyMono-Medium.woff2`, `IoskeleyMono-Bold.woff2`) copied into `src/fonts/`.
- **Behavior**:
  - Configures `next/font/local` in `src/app/layout.tsx` with `display: "swap"` and `variable: "--font-ioskeley-mono"`.
  - Updates `font-family` declaration in `src/app/globals.css` to use `var(--font-ioskeley-mono), monospace`.
  - Removes Google Fonts network dependency for JetBrains Mono.
- **Output**: Pure self-hosted Ioskeley Mono typography rendering consistently across desktop and mobile.
- **Failure**: Font file path resolution error causing Next.js build failure or fallback to system monospace.
- **Method**: `visual testing`
- **Verification**: `npm run build` succeeds; font inspection in browser confirms `@font-face` renders Ioskeley Mono glyph shapes with zero external Google font network requests.
- **Commit**: `feat(typography): integrate self-hosted ioskeley mono web font`

---

### BP-GRID-003: Monochrome GitHub Contributions ASCII Grid
- **Serves**: Intent specification to replace green GitHub contribution calendar tiers with a stepped monochrome gradient from base dark zinc to solid white.
- **Input**: GitHub contribution levels (`NONE`, `FIRST_QUARTILE`, `SECOND_QUARTILE`, `THIRD_QUARTILE`, `FOURTH_QUARTILE`).
- **Behavior**:
  - Maps tiers in `src/content/contributions.ts`:
    - `NONE`: `·` in `#52525B`
    - `FIRST_QUARTILE`: `░` in `#71717A`
    - `SECOND_QUARTILE`: `▒` in `#A1A1AA`
    - `THIRD_QUARTILE`: `▓` in `#D4D4D8`
    - `FOURTH_QUARTILE`: `█` in `#FFFFFF`
  - Updates `tests/github-contributions-grid.test.ts` to assert the monochrome palette and glyphs.
- **Output**: Formatted ASCII contribution calendar rendered in neutral monochrome tones.
- **Failure**: Mismatched color mapping or missing quartile fallback.
- **Method**: `TDD`
- **Verification**: Run `npm test` to verify `tests/github-contributions-grid.test.ts` passes; visual check of `/about` command output.
- **Commit**: `test(contributions): assert monochrome contribution tiers` -> `feat(contributions): map contribution tiers to monochrome gradient`

---

### BP-ASCII-004: 2D Living Typographical ASCII Emblem with Orange Trail
- **Serves**: Intent requirement to replace 3D voxel animation with high-density 2D typographic "EDS" (matching the ATMOS reference), featuring living matrix micro-shimmering, interactive smooth orange trail on hover in hero view, autonomous idle sweep, and a compact non-hover version for the sidebar.
- **Input**:
  - Component props: `{ compact?: boolean }`.
  - 2D Typographical ASCII template matrix for letters "E", "D", "S" composed of density-tiered glyphs (`%`, `@`, `#`, `|`, `/`, `\`, `+`, `*`, `:`, `.`, `-`, `=`).
- **Behavior**:
  - Implements `LivingAsciiEds` using high-performance HTML5 `<canvas>` rendering:
    - **Glyph Shimmer**: At ~8-12 ticks/sec, randomly mutates a small subset (0.3% - 0.5%) of glyphs between similar density tiers to create a live, breathing CRT matrix sensation.
    - **Interactive Orange Trail (Hero: `compact=false`)**:
      - Listens to mouse/touch coordinates over the canvas.
      - Illuminates touched character cells with warm glowing orange (`#FF6B00` / `#F97316` / `#FF9E0B`) with radial distance falloff.
      - Triggers instantaneous glyph mutation on touched cells.
      - Decays trail intensity smoothly to zero via exponential decay (~0.6s half-life), returning cells to base monochrome color.
      - Spawns subtle trailing particle dots (`.`, `:`, `-`) along the cursor trajectory.
    - **Autonomous Idle Sweep**:
      - If no pointer interaction occurs for >3.5 seconds, triggers an autonomous smooth orange sweep wave traversing the letterforms, then pauses before the next cycle.
    - **Sidebar Variant (`compact=true`)**:
      - Renders scaled-down compact grid (~26-30 columns wide, ~9-11 rows high) sized to fit inside the sidebar container without clipping.
      - Retains living matrix micro-shimmering and subtle ambient breathing.
      - Disables pointer event listeners and hover trail (`pointer-events-none`).
- **Output**: Highly authentic, performant, living 2D ASCII emblem in both hero and sidebar.
- **Failure**: Canvas resize desynchronization, font loading race condition causing incorrect character width measurements, or mouse coordinate misalignment.
- **Method**: `visual testing`
- **Verification**: Browser verification of hero mouse hover trail, idle autonomous wave sweep, sidebar compact rendering, mobile viewport responsiveness, and 60fps frame rate without CPU spikes.
- **Commit**: `feat(ascii): implement 2d living typographical ascii emblem with smooth orange trail`

---

## Non-Goals

- No green colors anywhere in the application.
- No heavy WebGL 3D libraries or external physics engines (canvas 2D context is strictly used for deterministic cell rendering).
- No changes to CLI command routing, markdown parsing, AI system prompt guardrails, or GitHub API caching behavior.
- No blocking modal transitions or intrusive hover animations outside the designated ASCII emblem canvas.

---

## Planned Commit Sequence

1. `test(contributions): assert monochrome contribution tiers`
2. `feat(contributions): map contribution tiers to monochrome gradient`
3. `feat(typography): integrate self-hosted ioskeley mono web font`
4. `feat(theme): transition global surfaces and accents to carbon black and neutral gray`
5. `feat(ascii): implement 2d living typographical ascii emblem with smooth orange trail`
6. `docs(blueprint): mark monochrome carbon theme blueprint as approved and verified`
