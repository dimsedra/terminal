---
title: "Intent: GitHub Contributions Visualization in /about"
type: intent
last_updated: 2026-11-05
---

# Intent: GitHub Contributions Visualization in /about

## Goal

Add a GitHub contribution graph visualization directly into the `/about` command output in Eds's terminal portfolio. 

The output should celebrate real engineering activity and ongoing projects while preserving the portfolio's focused, retro command-line interface.

## Visual Aesthetic & Experience

- **Green ASCII Shading**: Render the contribution grid using textured monospace ASCII / Unicode characters (`·`, `░`, `▒`, `▓`, `█`) styled with GitHub's signature green color hierarchy (from subtle dark green to vibrant neon green).
- **Responsive Mobile Windowing**: A full contribution year spans 52 weeks. On mobile or narrow viewports, the grid must default to the rightmost view (the most recent weeks that cleanly fit the screen) rather than overflowing or forcing a horizontal scrollbar.
- **Natural CLI Continuity**: The contribution visualization sits directly underneath Eds's bio and role details when running `/about`, streaming in cleanly like standard terminal text.

## Architecture & Secret Management

- **Vercel Serverless Caching**: The portfolio is hosted on Vercel. Contribution data will be retrieved through a server-side route handler using GitHub's GraphQL API.
- **Edge Cache Layer**: The server route will cache GitHub's response using Next.js time-based revalidation (e.g. 1 hour). Visitors will receive fast cached responses, and GitHub API requests will remain well below rate limits.
- **Protected Credentials**: The personal access token (`GITHUB_TOKEN`) lives exclusively on the server in `.env.local` and Vercel environment variables. It will never be exposed to the client browser. Document its format in `.env.example`.

## Boundaries (What We Do NOT Want)

- **No Horizontal Overflow**: Do not force users on mobile devices to scroll horizontally or let the terminal layout break.
- **No Client-Side Token Exposure**: Never bundle or query GitHub API credentials from the browser.
- **No Fragile Failures**: If `GITHUB_TOKEN` is not configured, or if GitHub's API is temporarily unreachable, the `/about` command must never crash. It must display an honest, subtle terminal notice (e.g. `[github contributions offline]`) while displaying the rest of the author bio normally.
- **No Heavy External Chart Libraries**: Avoid bloated third-party charting packages. Keep the parsing and ASCII formatting simple, explicit, and lightweight.
