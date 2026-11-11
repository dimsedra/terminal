# Project Documentation

Shared memory and architectural index for `eds-terminal-portfolio`.

## Intents

- [Bilingual Portfolio Support (EN & ID)](file:///home/eds/Code/terminal/docs/intent/20261110_bilingual_portfolio_support.md) (2026-11-10): Complete bilingual availability (English and Bahasa Indonesia) via unified `portfolio.json`, `/lang <en|id>` command with session persistence, localized deterministic outputs, and active language injection into `/chat` initialization.
- [Slash Command Auto-complete with Recommendations and Smart Shadow Prediction](file:///home/eds/Code/terminal/docs/intent/20261109_slash_command_autocomplete.md) (2026-11-09): Multi-level command & argument recommendations (e.g. `/themes <theme>`), inline shadow prediction (ghost text), floating recommendation chips across all viewports, and Shift-to-complete.
- [Carbon Black & Monochrome Theme with Ioskeley Mono & 2D Living ASCII](file:///home/eds/Code/terminal/docs/intent/20261109_monochrome_carbon_theme.md) (2026-11-09): Carbon Black background, Ioskeley Mono typography, neutral gray accents, dark-to-white monochrome contribution grid, and 2D living ASCII emblem with orange trail.
- [GitHub Contributions Visualization in /about](file:///home/eds/Code/terminal/docs/intent/20261105_github_contributions.md) (2026-11-05): Green ASCII contribution grid in `/about` with responsive mobile windowing and cached Vercel endpoint.
- [Animated ASCII Background Themes](file:///home/eds/Code/terminal/docs/intent/20261105_ascii_background_themes.md) (2026-11-05): Ambient animated ASCII backgrounds with live `/themes` switching.

## Decisions

- [ADR-001: Defer Generative UI and Tool-Based Context Fetching in the /chat Agent](file:///home/eds/Code/terminal/docs/decisions/adr_001_defer_chat_generative_ui_and_context_tools.md) (2026-11-12): Keep full-context system prompt injection with `streamText` on flash-lite; defer Generative UI and project-context tool fetching as unproven scope extension, with trigger conditions and the bundled-imports deployment rule for any future revisit.

## Blueprints

- [Bilingual Portfolio Support (EN & ID)](file:///home/eds/Code/terminal/docs/blueprint/20261110_bilingual_portfolio_support.md) (2026-11-10): Technical contracts for bilingual JSON data structure, localized markdown generators, `/lang <en|id>` command execution, multi-level autocomplete suggestions, and active language injection into `/chat` initialization.
- [Slash Command Multi-Level Autocomplete, Smart Shadow Prediction & Recommendation Popover](file:///home/eds/Code/terminal/docs/blueprint/20261109_slash_command_autocomplete.md) (2026-11-09): Contracts for pure suggestion engine, inline shadow prediction overlay, floating recommendation chips, and Shift key auto-complete interception.
- [Carbon Black Theme, Ioskeley Mono Typography & 2D Living ASCII](file:///home/eds/Code/terminal/docs/blueprint/20261109_monochrome_carbon_theme.md) (2026-11-09): Technical contracts for Carbon Black theme tokens, self-hosted Ioskeley Mono font, monochrome contributions grid, and living 2D ASCII emblem with orange trail.
- [GitHub Contributions Visualization in /about](file:///home/eds/Code/terminal/docs/blueprint/20261105_github_contributions.md) (2026-11-05): Contracts for GitHub GraphQL serverless route, ASCII grid formatter, and `/about` integration.
- [Animated ASCII Background Themes](file:///home/eds/Code/terminal/docs/blueprint/20261105_ascii_background_themes.md) (2026-11-05): Technical contracts for ambient background layer, theme registry, and `/themes` command integration.

## Design

- [Brand Design SOT: Terminal Portfolio](file:///home/eds/Code/terminal/docs/design/brand.md) (2026-11-09): Visual identity, Carbon Black color palette, Ioskeley Mono typography, monochrome contribution grid, and ambient background rules.
