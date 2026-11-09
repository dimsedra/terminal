---
title: "Brand Design SOT: Terminal Portfolio & Ambient ASCII Background"
type: reference
status: active
last_updated: 2026-11-09
---

# Brand Design SOT: Terminal Portfolio & Ambient ASCII Background

## Brand & Positioning

The portfolio is built as an authentic developer terminal and agentic CLI interface. It embodies:
- **Disciplined & Restrained**: Clean, distraction-free aesthetics centered on engineering substance rather than visual spectacle.
- **Atmospheric & Immersive**: Evokes a classic dark terminal workspace with subtle modern polish (real-time word streaming, living 2D typographical ASCII emblem, and low-contrast ambient background textures).
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
  - Background base: `#161616` (Carbon Black).
  - Surface panels: `#1C1C1C` with subtle transparency (`bg-[#1C1C1C]/80` to `/85`) allowing the ambient ASCII layer to shine through as quiet texture.
  - Foreground text: `#FFFFFF` (headings and primary text), `#D4D4D8` (body and output text), `#8E8E93` / `#52525B` (subdued labels and borders).
  - Accent colors:
    - Neutral slate scale (`#A1A1AA` to `#E4E4E7`) for interactive command chips and subdued terminal borders (strictly no green accents).
    - Purposeful light terminal blue (`#5B9BF8`, hover: `#88B7FD`) for prompt chevrons (`❯`) and clickable Markdown links to provide crisp visual hierarchy and visual anchors against the dark carbon background.
- **Typography & Scale**:
  - Monospace font stack powered by Ioskeley Mono (`Ioskeley Mono`, `ui-monospace`, `monospace`).
  - Strict text scaling (`text-xs` to `text-sm` for commands and output, `text-base` for section headings).
- **Ambient ASCII Background**:
  - Positioned in `absolute inset-0 pointer-events-none select-none overflow-hidden z-0`.
  - Subdued opacity (`opacity-20`) so it never competes with foreground text.
  - Full-bleed `cover` behavior: dynamically scales `<pre>` font size via `ResizeObserver` to match the container's width and height and sizes the rendered `<canvas>` with `w-full h-full object-cover` so no dark borders appear around the edges.
- **2D Typographic ASCII Emblem & Orange Trail (`EDS`)**:
  - Replaces legacy 3D spinning voxels with high-density 2D typographic block characters forming "EDS", shaded with varied density glyphs (`%`, `@`, `#`, `|`, `/`, `\`, `+`, `*`, `:`, `.`, `-`, `=`) inspired by classic terminal block art.
  - **Living Matrix (Glyph Shimmering)**: The character grid is never completely static; subtle ambient micro-mutations occur at idle across scattered coordinates, shifting glyphs between similar density tiers to give a breathing, active CRT/terminal sensation.
  - **Hero View (Homepage - Full Interactive)**:
    - **Hover Trail**: Mouse movement across the ASCII letterforms illuminates the characters under and around the cursor in a warm glowing orange (`#FF6B00` / `#F97316` / `#EA580C`).
    - **Dynamic Glyph Mutation**: Characters touched by the cursor mutate on contact, maintaining organic vitality as the orange illumination decays smoothly back to the monochrome base color.
    - **Particle Whispers**: Faint trailing punctuation/dots (`.`, `:`, `-`) trace along the sweep path.
    - **Autonomous Idle Trail**: When no cursor movement is detected for an interval, an automated smooth horizontal/diagonal orange sweep gently traverses the letterforms, ensuring the hero emblem remains lively.
  - **Sidebar Variant (Compact & Non-Hover)**:
    - Scaled down cleanly to fit within the sidebar column without wrapping or clipping.
    - Retains the living matrix glyph shimmering and subtle ambient breathing, but omits the interactive mouse hover trail to keep sidebar navigation distraction-free.
- **Border & Corner Geometry (Strictly Sharp Terminal Edges)**:
  - All UI containers, buttons, popover panels, interactive chips, markdown code blocks, and toast notifications use strictly sharp, right-angle corners (`rounded-none` / 0px border-radius) to preserve an authentic, industrial, and disciplined CLI workstation aesthetic.
  - The only deliberate exception is circular indicator dots (such as the 3 decorative window control dots at the top left of the terminal header and status indicator lights), which retain `rounded-full`.
- **Interactive Command Chips**:
  - Formatted code blocks starting with `/` automatically render as clickable chips with border highlights on hover in neutral gray (`#A1A1AA`).
- **GitHub Contributions ASCII Grid (`/about`)**:
  - Rendered inside a dark terminal surface panel (`bg-[#1C1C1C]/90 border border-[#27272A] px-3.5 py-3`) directly below the author bio in `/about` to prevent background ASCII animations from colliding with the grid glyphs.
  - Uses character density paired with a clean monochrome gradient rising from base dark gray up to bright white (strictly no green):
    - `NONE`: `·` in `#52525B` (subdued zinc glyph)
    - `FIRST_QUARTILE`: `░` in `#71717A` (light-subdued zinc for 25% density)
    - `SECOND_QUARTILE`: `▒` in `#A1A1AA` (medium-bright slate for 50% density)
    - `THIRD_QUARTILE`: `▓` in `#D4D4D8` (bright zinc for 75% density)
    - `FOURTH_QUARTILE`: `█` in `#FFFFFF` (pure solid white for 100% density)
  - Weekday and metadata labels (`Mon`, `Wed`, `Fri`, `last 52 weeks`, `Less / More`) use `#8E8E93` for clear contrast inside the dark panel.
  - Responsive windowing: slices weeks from the right so mobile viewports display the most recent weeks that fit cleanly (e.g. 16 weeks on `<640px`, 28 weeks on tablet, 52 weeks on desktop) without horizontal scrolling.

## Non-Goals

- No bright saturated colors or flashing animations.
- No interaction interception (mouse and touch events pass directly through the background layer).
- No blocking page transitions or full-screen modal overlays for theme switching.
