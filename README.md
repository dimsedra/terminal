# terminal

Source code for an interactive browser terminal application built with Next.js. It pairs deterministic slash commands and bilingual content (`en` / `id`) with animated ASCII background themes, a GitHub contribution grid, and a streaming `/chat` AI session.

## Commands

- `/chat` — Enter interactive AI session
- `/projects` — View projects and repository links
- `/skills` — Inspect technical skills and stack
- `/about` — View profile details and GitHub contribution grid
- `/contact` — Show GitHub, LinkedIn, and email links
- `/lang <en|id>` — Switch terminal language
- `/themes` — Switch ambient ASCII background theme
- `/help` — List available commands
- `/exit` — Reset active session and return to landing view

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `GOOGLE_GENERATIVE_AI_API_KEY` (and optionally `AI_MODEL` and `GITHUB_TOKEN` for the `/about` contribution graph).
3. Start the development server with `npm run dev` and open `http://localhost:3000`.
4. Run `npm test` for unit tests or `npm run build` for a production build.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 and Streamdown
- Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/react`)
