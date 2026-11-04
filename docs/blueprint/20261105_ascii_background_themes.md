---
title: "Blueprint: Animated ASCII Background Themes"
type: blueprint
parent_intent: docs/intent/20261105_ascii_background_themes.md
status: Approved
last_updated: 2026-11-05
---

# Blueprint: Animated ASCII Background Themes

This Blueprint translates the Intent in [docs/intent/20261105_ascii_background_themes.md](file:///home/eds/Code/terminal/docs/intent/20261105_ascii_background_themes.md) into concrete module contracts. We integrate `ascii-magic-art` landscape animations as a subtle, ambient background behind the existing terminal shell, wired to a new interactive `/themes` command with on-the-fly switching.

## Current Code

Currently, `src/app/page.tsx` renders `<TerminalInterface />` with a hardcoded dark background (`bg-[#0A0A0A]`). Within `src/components/TerminalInterface.tsx`:
- The landing screen (Fase 1) and active workspace (Fase 2) use opaque background classes (`bg-[#0A0A0A]`).
- Commands are dispatched deterministically in `handleCommandExecution` via `src/content/commands.ts` and `PORTFOLIO_DATA`.
- `StreamingTerminalOutput` renders markdown and automatically turns any code token starting with `/` into a clickable button that triggers command execution.

To support animated ASCII backgrounds:
1. We introduce a dedicated `AsciiBackground` component positioned in an ambient layer (`absolute inset-0 pointer-events-none select-none overflow-hidden z-0`).
2. We adjust surface backgrounds in `TerminalInterface.tsx` to semi-transparent (`bg-[#0A0A0A]/80` or `bg-transparent`) so the ambient art shines through subtly without reducing text contrast.
3. We add a theme state in `TerminalInterface` (with `sessionStorage` persistence) and register `/themes` in `commands.ts`.

## Design

```
+-------------------------------------------------------------+
| TerminalInterface (State: activeTheme)                      |
|                                                             |
|  +-------------------------------------------------------+  |
|  | AsciiBackground (z-0, absolute, pointer-events: none)  |  |
|  | [ plays piece via player.js: pagoda / karsts / neon ] |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Foreground Terminal Shell (z-10, readable contrast)   |  |
|  | - Title bar & Header                                  |  |
|  | - Fase 1 Landing / Fase 2 Chat History                |  |
|  | - Command Input (handles /themes [name])              |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

## Contracts

### BP-THEME-001: Theme Registry and Command Parser
- **Serves**: Intent "Selected Themes" and Intent "Natural CLI Integration"
- **Input**: Raw command string from terminal input (e.g. `/themes`, `/themes autumn`, `/themes 2`, `/themes default`).
- **Behavior**:
  - Defines the static theme roster:
    1. `default`: "Default Dark" (pitch-black minimal).
    2. `autumn-pagoda-maples`: "Autumn Pagoda Maples" (shorthands: `autumn`, `pagoda`, `1`).
    3. `bamboo-raft-karsts`: "Bamboo Raft Karsts" (shorthands: `karsts`, `bamboo`, `raft`, `2`).
    4. `harbour-neon-skyline`: "Harbour Neon Skyline" (shorthands: `neon`, `harbour`, `skyline`, `3`).
  - When called with no arguments, returns a formatted Markdown list of available themes containing clickable command tokens (e.g. `` `/themes autumn` ``).
  - When called with an argument, parses and resolves the argument against registered theme IDs and aliases.
- **Output**: Resolved `ThemeDefinition` or null when unrecognized. Formatted Markdown payload for terminal display.
- **Failure**: Unrecognized arguments return an explicit message listing valid options and guidance to run `/themes`.
- **Method**: `TDD`
- **Verification**: Run unit test verifying alias resolution, case-insensitivity, and fallback behavior for invalid inputs.
- **Commit**: `test(themes): add unit tests for theme registry and argument parser`, `feat(themes): implement theme registry and parser module`.

---

### BP-THEME-002: Ambient ASCII Background Layer (`AsciiBackground.tsx`)
- **Serves**: Intent "Readability First", "Non-Interfering Layer", and "Selected Themes"
- **Input**: `themeId: ThemeId` prop.
- **Behavior**:
  - When `themeId === "default"`, renders `null` (plain dark surface).
  - When a valid ASCII theme is active, mounts a preformatted `<pre>` element container.
  - Dynamically imports `ascii-magic-art/runtime/player.js` and the specific module from `ascii-magic-art/pieces/[themeId].js`.
  - Invokes `play(containerElement, pieceModule)` to start frame playback.
  - On cleanup (component unmount or `themeId` change), calls the returned `stop()` function to cancel animation timers and avoid memory leaks.
  - Enforces styling: `fixed inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center opacity-20 transition-opacity duration-500 z-0`.
- **Output**: Animated monospace text canvas positioned strictly behind all UI components.
- **Failure**: If dynamic piece import fails (e.g. package error), logs warning and renders `null` without throwing or crashing the parent UI.
- **Method**: `visual testing`
- **Verification**: Inspect live rendering in browser: confirm animation playback, verify zero pointer event interception, and evaluate text contrast in both Fase 1 and Fase 2 views.
- **Commit**: `feat(ui): add AsciiBackground component with dynamic piece loader and lifecycle cleanup`.

---

### BP-THEME-003: Terminal Command Routing & State Integration
- **Serves**: Intent "Seamless Switching" and "Natural CLI Integration"
- **Input**: Execution of `/themes` command via input bar, quick navigation shortcut, or clicking a rendered markdown code chip.
- **Behavior**:
  - Registers `/themes` in `src/content/commands.ts` with description "Switch ambient ASCII background theme".
  - In `src/components/TerminalInterface.tsx`:
    - Maintains `currentTheme` in React state, initialized from `sessionStorage` (key: `eds_terminal_theme`) or defaulting to `"default"`.
    - Updates `currentTheme` immediately when a valid theme is chosen, persisting to `sessionStorage`.
    - Appends user command and output to terminal history without resetting session or clearing messages.
    - Adjusts terminal surface backgrounds to semi-transparent so the ambient layer shows through while keeping text legible.
- **Output**: Terminal interaction output indicating active theme and immediate background change.
- **Failure**: Invalid theme argument outputs helpful feedback without altering the currently running theme.
- **Method**: `test-after` / `integration/e2e`
- **Verification**: Run dev server, execute `/themes`, click theme buttons, verify real-time background switch without page refresh or session reset.
- **Commit**: `feat(terminal): integrate /themes command handler and ambient background in TerminalInterface`.

## Non-Goals

- **No Full Package Bundling**: We will not import or bundle all 734 pieces of `ascii-magic-art`. Only the 3 chosen pieces are imported dynamically.
- **No Heavy Shaders or Canvases**: We will not introduce WebGL or complex graphics libraries; animation is rendered purely with monospace text characters via the lightweight player.
- **No Session Wipes**: Switching themes must never reload the page, clear chat messages, or reset active AI conversations.
- **No Obtrusive Contrast**: The background will not use bright saturated colors or high opacity that compete with portfolio text and code readability.
