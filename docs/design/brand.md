---
title: "Brand Design SOT: Terminal Portfolio & Ambient ASCII Background"
type: reference
status: active
last_updated: 2026-11-05
---

# Brand Design SOT: Terminal Portfolio & Ambient ASCII Background

## Brand & Positioning

The portfolio is built as an authentic developer terminal and agentic CLI interface. It embodies:
- **Disciplined & Restrained**: Clean, distraction-free aesthetics centered on engineering substance rather than visual spectacle.
- **Atmospheric & Immersive**: Evokes a classic dark terminal workspace with subtle modern polish (real-time word streaming, 3D ASCII logo, and low-contrast ambient background textures).
- **What it is NOT**: It is not a generic SaaS landing page, not a flashy gaming website, and not a high-saturation neon gimmick.

## Target User & Context

- **Users**: Software engineers, tech leads, and hiring managers exploring Eds' projects, engineering philosophy, and background.
- **Job to get done**: Quickly inspect projects, verify technical depth, or interact with the AI assistant without cognitive strain or eye fatigue.
- **Constraints**: Desktop and mobile screens, varied ambient lighting conditions, and short attention spans requiring instant legibility of text and commands.

## Generic Baseline to Avoid

- **AI Design Clichés**: Bright purple-blue gradients, glassmorphism cards, acid-green blurs, or distracting animations that steal focus from actual content.
- **Readability Traps**: High-opacity animated backdrops that wash out text contrast or create visual noise behind paragraphs.
- **Interaction Clichés**: Scroll-jacking, custom cursor replacements, or intrusive modals.

## Design Decisions

- **Color Palette**:
  - Background base: `#050505` (deep pitch dark).
  - Surface panels: `#0A0A0A` with subtle transparency (`bg-[#0A0A0A]/80` to `/85`) allowing the ambient ASCII layer to shine through as quiet texture.
  - Foreground text: `#F4F4F5` (headings), `#D4D4D8` (body text), `#8E8E93` / `#52525B` (subdued labels and borders).
  - Accent color: `#9AE6B4` (mint terminal green) for interactive prompt cursors, active command chips, and key links.
- **Typography & Scale**:
  - Pure monospace font stack (`JetBrains Mono`, `ui-monospace`, `monospace`).
  - Strict text scaling (`text-xs` to `text-sm` for commands and output, `text-base` for section headings).
- **Ambient ASCII Background**:
  - Positioned in `absolute inset-0 pointer-events-none select-none overflow-hidden z-0`.
  - Subdued opacity (`opacity-20`) so it never competes with foreground text.
  - Full-bleed `cover` behavior: dynamically scales `<pre>` font size via `ResizeObserver` to match the container's width and height and sizes the rendered `<canvas>` with `w-full h-full object-cover` so no dark borders appear around the edges.
- **Interactive Command Chips**:
  - Formatted code blocks starting with `/` automatically render as clickable chips with border highlights on hover.
- **GitHub Contributions ASCII Grid (`/about`)**:
  - Rendered inside a dark terminal surface panel (`bg-[#0A0A0A]/90 border border-[#1F1F1F] rounded-md px-3.5 py-3`) directly below the author bio in `/about` to prevent background ASCII animations from colliding with the grid glyphs.
  - Uses character density paired with brightness-compensated GitHub greens so stippled glyphs (`░`, `▒`) remain clearly visible:
    - `NONE`: `·` in `#52525B` (muted terminal zinc)
    - `FIRST_QUARTILE`: `░` in `#1f883d` (compensated emerald green for 25% glyph density)
    - `SECOND_QUARTILE`: `▒` in `#26a641` (medium-bright GitHub green for 50% glyph density)
    - `THIRD_QUARTILE`: `▓` in `#39d353` (bright GitHub green for 75% glyph density)
    - `FOURTH_QUARTILE`: `█` in `#56f06f` (vibrant neon green for 100% solid block)
  - Weekday and metadata labels (`Mon`, `Wed`, `Fri`, `last 52 weeks`, `Less / More`) use `#8E8E93` for clear contrast inside the dark panel.
  - Responsive windowing: slices weeks from the right so mobile viewports display the most recent weeks that fit cleanly (e.g. 16 weeks on `<640px`, 28 weeks on tablet, 52 weeks on desktop) without horizontal scrolling.

## Non-Goals

- No bright saturated colors or flashing animations.
- No interaction interception (mouse and touch events pass directly through the background layer).
- No blocking page transitions or full-screen modal overlays for theme switching.
