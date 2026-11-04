---
title: "Intent: Animated ASCII Background Themes"
type: intent
last_updated: 2026-11-05
---

# Intent: Animated ASCII Background Themes

## Goal

Replace the solid dark background across both the landing view (Fase 1) and active terminal/chat workspace (Fase 2) with an ambient, animated ASCII art backdrop. 

Provide a `/themes` terminal command that opens an interactive selector directly inside the CLI shell, letting visitors switch background themes on-the-fly (in real time without reloading the page).

## Selected Themes

We are featuring three specific animated ASCII scenes from `ascii-magic-art`, alongside the original baseline:

1. `autumn-pagoda-maples`: Autumn scenery with pagoda architecture and falling maple leaves.
2. `bamboo-raft-karsts`: River landscape featuring a bamboo raft floating past karst limestone mountains.
3. `harbour-neon-skyline`: Atmospheric waterfront cityscape featuring a neon-lit harbor and skyline.
4. `default`: The classic pitch-black terminal background, allowing visitors to return to the minimal layout at any time.

## User Experience & Invariants

- **Readability First**: The background ASCII animation serves as atmospheric texture. It must remain subdued (low opacity and restrained contrast) so that terminal command output and conversational chat text are effortless to read.
- **Non-Interfering Layer**: The ASCII background sits behind all UI elements and never captures mouse clicks or scroll events (`pointer-events: none`).
- **Seamless Switching**: Selecting a theme updates the background immediately without resetting the terminal session, clearing command history, or refreshing the browser.
- **Natural CLI Integration**: The `/themes` command fits naturally alongside existing portfolio commands (`/projects`, `/skills`, `/about`, `/contact`), offering both interactive selection and direct shortcut support (e.g. `/themes autumn` or `/themes karsts`).

## What We Do NOT Want (Boundaries)

- **No Visual Clutter**: Do not use bright, high-opacity ASCII frames that distract from reading project details or chatting with the AI assistant.
- **No Heavy Runtime Overhead**: Do not load the entire library of 700+ animations all at once. Only import or bundle the specific animations selected.
- **No State Resets**: Do not reload the page or wipe the user's active session history when changing themes.
