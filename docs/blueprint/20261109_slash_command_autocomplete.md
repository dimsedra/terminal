---
title: "Blueprint: Slash Command Multi-Level Autocomplete, Smart Shadow Prediction & Recommendation Popover"
type: blueprint
parent_intent: docs/intent/20261109_slash_command_autocomplete.md
status: Approved
last_updated: 2026-11-09
---

# Blueprint: Slash Command Multi-Level Autocomplete, Smart Shadow Prediction & Recommendation Popover

Translates [docs/intent/20261109_slash_command_autocomplete.md](file:///home/eds/Code/terminal/docs/intent/20261109_slash_command_autocomplete.md) into concrete, testable technical contracts. Implements a zero-latency suggestion engine for slash commands and multi-level arguments (specifically `/themes <theme>`), an inline shadow prediction overlay (ghost text) using monospace typography alignment, a floating recommendation chips popover rendered across all viewports (desktop and mobile), and `Shift` key auto-complete interception in the terminal input.

## Current Code & Gap Analysis

1. **Input Handling (`src/components/TerminalInterface.tsx`)**:
   - `inputVal` is controlled by a raw `<input>` in two places: Fase 1 footer (line 472) and Fase 2 footer (line 644).
   - `handleKeyDown` currently only checks for `Enter`, `ArrowUp`, and `ArrowDown`.
   - Lacks ghost text rendering, suggestions popover, and `Shift` auto-complete interception.

2. **Command & Theme Registries (`src/content/commands.ts` & `src/content/themes.ts`)**:
   - Commands are defined in `commands: CommandItem[]`.
   - Themes are defined in `THEME_LIST: ThemeDefinition[]` with aliases (`neon`, `default`, `autumn`, `karsts`, etc.).
   - Lacks a unified pure function to resolve partial queries into structured suggestion states (matching items, best match full text, and ghost suffix).

---

## Design & Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │            User Types in Input Bar           │
                    │               (inputVal State)               │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │     src/lib/commandSuggestions.ts            │
                    │     getCommandSuggestions(inputVal)          │
                    └──────────────────────┬───────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
      ┌───────────────────────────────────┐ ┌───────────────────────────────────┐
      │   Tingkat 1: Base Slash Command   │ │   Tingkat 2: Argument Selection   │
      │   e.g. "/th" -> "/themes"         │ │   e.g. "/themes n" -> "neon"      │
      └─────────────────┬─────────────────┘ └─────────────────┬─────────────────┘
                        │                                     │
                        └──────────────────┬──────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │      CommandSuggestionResult State           │
                    │   - isOpen: boolean                          │
                    │   - ghostSuffix: string                      │
                    │   - bestMatchFullText: string                │
                    │   - suggestions: CommandSuggestion[]         │
                    └──────────────────────┬───────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
      ┌───────────────────────────────────┐ ┌───────────────────────────────────┐
      │   Inline Shadow (Ghost Text)      │ │   Floating Popover (Chips)        │
      │   - Underlay <div> with Ioskeley  │ │   - Desktop: Discovery + Click    │
      │   - Invisible typed text clone    │ │   - Mobile: Touch auto-complete   │
      │   - Gray (#71717A) ghost suffix   │ │   - Shows command & description   │
      └───────────────────────────────────┘ └───────────────────────────────────┘
```

---

## Contracts

### BP-AUTOCOMPLETE-001: Pure Suggestion & Argument Resolution Engine
- **Serves**: Intent Goal & Boundaries (Contextual multi-level suggestions, zero-latency local matching, extensible architecture).
- **Location**: `src/lib/commandSuggestions.ts`
- **Input**: `rawInput: string` (untrusted text from input field).
- **Behavior**:
  - If `!rawInput.startsWith("/")`: returns `{ isOpen: false, query: "", ghostSuffix: "", bestMatchFullText: "", suggestions: [] }`.
  - When query is single-token (no space or still within command name):
    - Matches case-insensitively against `commands` in `src/content/commands.ts`.
    - If match exists: `bestMatchFullText` is the first matching command name, `ghostSuffix` is `bestMatchFullText.slice(rawInput.length)`, and `suggestions` contains all matching commands.
  - When query is multi-token starting with `/themes`:
    - Reads the remaining argument string `argQuery = rawInput.slice("/themes ".length).trimStart()`.
    - Matches case-insensitively against `THEME_LIST` IDs and aliases (`default`, `neon`, `autumn`, `karsts`, etc.).
    - If match exists: `bestMatchFullText` is `/themes <theme-alias>`, `ghostSuffix` is `bestMatchFullText.slice(rawInput.length)`, and `suggestions` lists matching themes with human-readable titles and descriptions.
  - When query is any other command followed by space (e.g. `/chat prompt`): returns `isOpen: false` and empty suggestions.
- **Output**: `CommandSuggestionResult` interface:
  ```ts
  export interface CommandSuggestion {
    name: string;
    fullText: string;
    description: string;
  }

  export interface CommandSuggestionResult {
    isOpen: boolean;
    query: string;
    ghostSuffix: string;
    bestMatchFullText: string;
    suggestions: CommandSuggestion[];
  }
  ```
- **Failure**: Always returns safe defaults (`isOpen: false`, empty arrays/strings) on empty input, non-slash strings, or unknown queries. Never throws.
- **Method**: `tdd`
- **Verification**: `npm test` running `tests/command-suggestions.test.ts`.
- **Commit**:
  - `test: add unit tests for slash command and theme suggestion engine`
  - `feat: implement pure suggestion resolution engine for commands and themes`

---

### BP-AUTOCOMPLETE-002: Inline Shadow Prediction (Ghost Text) Display Layer
- **Serves**: Intent Goal & Boundaries (Pixel-perfect ghost text alignment using Ioskeley Mono typography without layout shifts).
- **Location**: `src/components/TerminalPromptInput.tsx` (or integrated in `TerminalInterface.tsx`).
- **Input**: `inputVal: string`, `ghostSuffix: string`.
- **Behavior**:
  - Implements a layered container with `relative flex items-center`.
  - An underlay `div` is placed at `absolute inset-0 pointer-events-none flex items-center font-mono text-sm` sharing exact line-height, padding, and font settings with `<input>`.
  - Contains `<span className="invisible select-none whitespace-pre">{inputVal}</span>` followed immediately by `<span className="text-[#71717A] select-none whitespace-pre">{ghostSuffix}</span>`.
  - Monospace character metric ensures the visible ghost text begins exactly at the user's current cursor position across all viewports.
- **Output**: Visual underlay displaying grey prediction text directly after user's cursor.
- **Failure**: If `ghostSuffix` is empty, no visible ghost text is rendered.
- **Method**: `visual testing`
- **Verification**: Browser visual QA across mobile and desktop viewports.
- **Commit**: `feat: add inline shadow prediction overlay to terminal input`

---

### BP-AUTOCOMPLETE-003: Floating Recommendation Chips Popover
- **Serves**: Intent Goal & Boundaries (Floating popover visible across all viewports, click/tap support, touch-friendly on mobile, keyboard navigation / discovery).
- **Location**: `src/components/TerminalPromptInput.tsx` (or integrated in `TerminalInterface.tsx`).
- **Input**: `suggestions: CommandSuggestion[]`, `isOpen: boolean`, `onSelect: (fullText: string) => void`.
- **Behavior**:
  - Positioned directly above input bar: `absolute bottom-full left-0 mb-2 z-30 w-full max-w-xl`.
  - Styled with Carbon Black tokens: `bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] rounded-lg p-1.5 shadow-2xl max-h-52 overflow-y-auto`.
  - Renders suggestion items as interactive touch/mouse chips:
    - Chip shows label (e.g. `/themes` or `neon`) in `#FFFFFF` and description in `#71717A`.
    - Clicking (desktop) or tapping (mobile) calls `onSelect(item.fullText)`, updating input value and refocusing the input.
  - Active across all viewports (desktop, tablet, mobile) and in both Fase 1 and Fase 2.
- **Output**: Interactive floating popover component.
- **Failure**: Renders `null` when `!isOpen` or `suggestions.length === 0`.
- **Method**: `visual testing`
- **Verification**: Browser visual check and tap/click interaction verification.
- **Commit**: `feat: add floating recommendation chips popover for commands and arguments`

---

### BP-AUTOCOMPLETE-004: Shift Key Auto-Complete Interception & Dismissal
- **Serves**: Intent Goal & Boundaries (`Shift` triggers auto-complete on physical keyboard without intercepting normal typing keys).
- **Location**: `src/components/TerminalPromptInput.tsx` / `TerminalInterface.tsx`.
- **Input**: `e: React.KeyboardEvent<HTMLInputElement>`.
- **Behavior**:
  - When `e.key === "Shift"`:
    - If `ghostSuffix` is non-empty:
      - `e.preventDefault()`.
      - Replaces `inputVal` with `bestMatchFullText`.
      - Moves cursor to the end of the text.
  - When `e.key === "Tab"`:
    - If `ghostSuffix` is non-empty, also completes `bestMatchFullText` and prevents losing focus.
  - When `e.key === "Escape"`:
    - Dismisses suggestion popover and clears ghost text until next keystroke.
  - Existing `Enter` and arrow key navigation (`ArrowUp` / `ArrowDown`) remain untouched.
- **Output**: Fast keyboard completion and popover dismissal.
- **Failure**: Pressing `Shift` when no prediction is active performs standard default behavior (zero side effects).
- **Method**: `integration/e2e`
- **Verification**: Terminal interaction test verifying `Shift` completes text and `Escape` dismisses.
- **Commit**: `feat: integrate Shift auto-complete and popover dismissal in terminal input`

---

## Non-Goals

- **Zero LOC for Space**: Tombol `Space` (spasi) tidak diberi handler atau logic khusus sama sekali (0 LOC). Perilaku bawaan input HTML dibiarkan alami apa adanya.
- **No Logic Modifications to Commands**: Core command execution in `handleCommandExecution`, AI chat endpoints, and themes switching remain untouched.
- **No Third-Party Autocomplete Libraries**: No heavy external combobox or autocomplete dependencies; implemented natively with Tailwind and React for optimal bundle size and zero runtime overhead.
- **No Desktop Hiding of Popover**: The floating recommendation chips must not be hidden on desktop viewports.
