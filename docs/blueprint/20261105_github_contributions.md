---
title: "Blueprint: GitHub Contributions Visualization in /about"
type: blueprint
parent_intent: docs/intent/20261105_github_contributions.md
status: Approved
last_updated: 2026-11-05
---

# Blueprint: GitHub Contributions Visualization in /about

This Blueprint translates the Intent in [docs/intent/20261105_github_contributions.md](file:///home/eds/Code/terminal/docs/intent/20261105_github_contributions.md) into concrete technical contracts. We implement a cached serverless API route to query GitHub's GraphQL API, format the contribution calendar into a green ASCII character grid, adapt the columns for mobile screens (rightmost recent weeks), and integrate the output into the `/about` command.

## Current Code

Currently, `/about` is triggered in `src/components/TerminalInterface.tsx` and resolved via `src/data/portfolioData.ts`:
- `getAboutMarkdown()` returns static markdown: author name, callsign, role, location, social links, and bio text.
- `src/components/StreamingTerminalOutput.tsx` receives `{ type: "about" }` and streams the markdown word-by-word into the terminal window.
- The environment configuration in `.env.example` contains AI keys (`GEMINI_API_KEY`, etc.), but does not include any GitHub API configuration.

To incorporate the contribution visualization:
1. We introduce a cached API route handler `src/app/api/github-contributions/route.ts` that runs on Vercel and queries GitHub's GraphQL API.
2. We build a formatter function that transforms raw calendar week data into an ASCII grid with level-based styling and windowing (slicing rightmost weeks for narrow viewports).
3. We connect the `/about` command flow so that the contribution grid renders alongside the bio, with an unobtrusive fallback message if data is unavailable.
4. We document `GITHUB_TOKEN` in `.env.example`.

## Design

```
+-------------------------------------------------------------------------+
| Client Terminal Shell (/about)                                          |
|                                                                         |
|  1. Streams author bio & contact links (portfolioData.ts)               |
|  2. Fetches /api/github-contributions (SWR or client fetch)             |
|  3. Formatter calculates visible columns (e.g. last 14 weeks on mobile, |
|     last 52 weeks on desktop)                                           |
|  4. Renders 7 rows of ASCII blocks with green level classes             |
+-------------------------------------------------------------------------+
                                   |
                                   v  HTTP GET /api/github-contributions
+-------------------------------------------------------------------------+
| Next.js Server Route (app/api/github-contributions/route.ts)            |
|                                                                         |
|  - Reads process.env.GITHUB_TOKEN                                       |
|  - fetch("https://api.github.com/graphql", { revalidate: 3600 })        |
|  - Caches response at Vercel Edge Cache                                 |
|  - Returns compact { totalContributions, weeks, error }                 |
+-------------------------------------------------------------------------+
```

## Contracts

### BP-GH-001: GitHub Contributions API Route & Cache
- Serves: Intent "Vercel Serverless Caching" and "Protected Credentials"
- Input: HTTP GET to `/api/github-contributions`.
- Behavior:
  - Validates presence of `GITHUB_TOKEN`. If missing, returns `{ totalContributions: 0, weeks: [], error: "TOKEN_NOT_CONFIGURED" }` with HTTP 200 to allow graceful fallback rendering on client.
  - Executes GitHub GraphQL query for user `dimsedra` (from `author.links.github`):
    `user(login: "dimsedra") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { contributionCount date weekday contributionLevel } } } } }`.
  - Configures `next: { revalidate: 3600 }` to cache the upstream response in Vercel Edge for 1 hour.
- Output: JSON `{ totalContributions: number, weeks: Array<{ contributionDays: Array<{ contributionCount: number, date: string, weekday: number, contributionLevel: string }> }>, error?: string }`.
- Failure: Network errors or GitHub API errors return `{ totalContributions: 0, weeks: [], error: "UPSTREAM_ERROR" }` without throwing unhandled exceptions.
- Method: `integration/e2e`
- Verification: Automated integration test verifying route response format and fallback when token is unset.
- Commit: `feat(api): add cached github contributions route handler`

### BP-GH-002: ASCII Grid Formatter & Mobile Windowing
- Serves: Intent "Green ASCII Shading" and "Responsive Mobile Windowing"
- Input: `weeks` array from calendar API, and desired maximum column count `maxColumns` (e.g. 52 on desktop, 14-16 on mobile).
- Behavior:
  - Slices `weeks` from the end (`weeks.slice(-maxColumns)`) to prioritize the most recent contributions on the right side.
  - Maps GitHub `contributionLevel` to character glyphs and brightness-compensated green styles:
    - `NONE`: `·` (`#52525B`)
    - `FIRST_QUARTILE`: `░` (`#1f883d`)
    - `SECOND_QUARTILE`: `▒` (`#26a641`)
    - `THIRD_QUARTILE`: `▓` (`#39d353`)
    - `FOURTH_QUARTILE`: `█` (`#56f06f`)
  - Generates 7 weekday rows with weekday abbreviations (`Mon`, `Wed`, `Fri`) for clear orientation.
- Output: Structured ASCII grid ready for terminal rendering, plus summary line (e.g. `1,248 contributions in the last year`).
- Failure: If `weeks` is empty, returns null or a fallback string so the UI can handle display gracefully.
- Method: `tdd`
- Verification: Unit tests covering slice logic, character mapping, and handling of edge cases (empty weeks, short arrays).
- Commit: `feat(contributions): add ascii contribution grid formatter`

### BP-GH-003: Terminal /about Output Integration
- Serves: Intent "Goal", "Natural CLI Continuity", and "No Fragile Failures"
- Input: Execution of `/about` command in `TerminalInterface.tsx`.
- Behavior:
  - Renders the author bio, location, role, and touchpoints as normal.
  - Queries `/api/github-contributions` (client fetch with local state).
  - Displays the rendered green ASCII contribution grid directly below the bio.
  - On mobile screens, dynamically restricts column count to the viewport-fitting recent weeks.
  - If API returns an error or empty data, displays a subtle dimmed note: `[github contributions offline]` without disturbing the rest of `/about`.
- Output: Integrated `/about` terminal output featuring profile information and live green ASCII activity grid.
- Failure: Handled silently with fallback note; never throws or disrupts command history.
- Method: `visual testing`
- Verification: Browser visual test confirming desktop 52-week view, mobile truncated recent-weeks view, and green color contrast against terminal themes.
- Commit: `feat(terminal): integrate github contributions into /about output`

### BP-GH-004: Environment Variable Documentation
- Serves: Intent "Protected Credentials"
- Input: `.env.example`
- Behavior: Adds `GITHUB_TOKEN=` entry with inline explanation for setting a fine-grained or classic public read-only token.
- Output: Clean `.env.example` update.
- Failure: N/A.
- Method: `test-after`
- Verification: File diff inspection.
- Commit: `docs(env): document GITHUB_TOKEN in .env.example`

## Non-Goals

- No horizontal scrolling UI on mobile (only show the most recent weeks that fit).
- No client-side GitHub API requests (must always route through the serverless endpoint).
- No external heavy charting libraries or SVG rendering dependencies.
- No editing of GitHub contribution data or mock data generation when in production.
