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
  - Positioned in `fixed inset-0 pointer-events-none select-none overflow-hidden z-0`.
  - Subdued opacity (`opacity-20`) so it never competes with foreground text.
  - Centered monospace `<pre>` container cycling through character frames.
- **Interactive Command Chips**:
  - Formatted code blocks starting with `/` automatically render as clickable chips with border highlights on hover.

## Non-Goals

- No bright saturated colors or flashing animations.
- No interaction interception (mouse and touch events pass directly through the background layer).
- No blocking page transitions or full-screen modal overlays for theme switching.
