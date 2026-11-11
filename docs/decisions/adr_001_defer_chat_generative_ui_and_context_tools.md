---
title: "ADR-001: Defer Generative UI and Tool-Based Context Fetching in the /chat Agent"
type: adr
status: Accepted
date: 2026-11-12
deciders: [Eds (project owner)]
tags: [ai, chat, ux, vercel, scope]
parent_prd: null
parent_srs: null
supersedes: null
superseded_by: null
---

# ADR-001: Defer Generative UI and Tool-Based Context Fetching in the /chat Agent

## Context

The portfolio's `/chat` agent currently answers visitors through a single `streamText` call with the full portfolio context inlined into the system prompt (`buildAiSystemPrompt` in `src/data/aiContext.ts`), rendered as terminal markdown via Streamdown. The agent runs on `gemini-3.5-flash-lite` with `maxDuration = 30` on a Vercel serverless function.

Two related ideas were evaluated against this setup. First, Vercel AI SDK Generative UI (mapping tool results to inline React components in the chat stream) as a way to give viewers and HR a richer experience. Second, moving project deep context out of the system prompt behind a tool call, so the agent fetches context (for example a project's README.md) only when needed.

Measured facts that shaped the evaluation:

- The full injected system prompt is ~16.6k characters (~4.1k tokens) per request.
- The deep-dive block for all four projects is only ~6.7k characters (~1.7k tokens) of that; the remaining ~60% is persona, skills, education, tone rules, and guardrails that no tool can remove.
- The heaviest candidate for doc ingestion, the ExifSense repository, has a README of 8 KB and a total `docs/` tree of 148 KB across 15 markdown files — trivially small for both a serverless bundle and a model context window.

A hard constraint applies to any future change: the chat API route must always work on Vercel deployment.

## Decision

We will not implement Generative UI or tool-based context fetching in the `/chat` agent now. We keep the current architecture: full-context injection through the system prompt, plain `streamText`, and the flash-lite model. This is treated as a scope extension whose need is not yet proven, even though it would plausibly give HR richer context.

This decision is deferred, not rejected permanently. We revisit it when any of these trigger conditions are met:

- The portfolio context grows substantially (roughly 10+ projects, or added blog posts, case studies, or a CV pipeline), so that inline injection stops being cheap.
- Real visitor behavior shows a concrete chat failure that structured tool responses would fix (for example a role-fit comparison against a job description).
- We want genuinely interactive chat artifacts (such as a downloadable CV button or side-by-side project comparison) that markdown output cannot express.

## Alternatives Considered

**Implement Generative UI as a visitor-facing showpiece.** The model would select from pre-authored tool components rendered inline in chat. Rejected: the model adds no facts we did not already write, the terminal aesthetic already makes markdown the near-ideal medium, the content is static so there is no dynamic data to visualize, and `flash-lite` is the weakest reasoning tier, raising the risk of wrong tool selection. It was judged to be a UI show-off rather than a user-experience gain at this stage.

**Fetch project context on demand via a tool, sourced from each project's README.md.** Rejected for now: the deep-dive content it would remove is only ~1.7k of ~4.1k tokens; a deep question pays two model round trips instead of one, so total tokens and latency do not improve and are merely redistributed from shallow to deep questions; and READMEs are written for repository visitors (install steps, badges, licenses), making them noisy, uncurated context compared to the curated `architecturalPillars`, `technicalHighlights`, and `systemTradeoffsAndDecisions` already in `AI_PROJECTS_DATA`. It would also likely push us toward a larger reasoning model, which spends thinking tokens on every answer including trivial ones.

**The cheap version: overview inline plus one curated-data tool.** Strip `formatProjectsDeepDive()` from the prompt and add a single `getProjectDeepDive(id)` tool that returns the existing curated data (literally `AI_PROJECTS_DATA.find((p) => p.id === id)` serialized), keeping flash-lite. Accepted as the shape to build if and when a trigger condition fires. Prompt caching for the static system prompt (Gemini) was noted as an even cheaper first check, not yet verified against the installed `@ai-sdk/google` version.

## Consequences

Positive: the chat path stays simple, fast to reason about, and free of new failure modes (tool selection errors, extra round trips, model upgrade pressure). The always-works-on-Vercel constraint is preserved by default because nothing new is added.

Constraints we accept for the future: if doc ingestion is ever built, content must be bundled into the deployment as TypeScript or JSON imports (the existing `AI_PROJECTS_DATA` pattern), never read from the filesystem at runtime (which fails on Vercel unless `outputFileTracingIncludes` is configured) and never fetched live from the GitHub API at request time (which adds rate limits and downtime to every deep question). Visitor-facing knowledge must also be curated: internal engineering artifacts such as blueprints, lessons, and thesis contracts are never ingested wholesale; only explicitly visitor-facing documents (README, case studies) qualify.

Risks: this evaluation goes stale as the portfolio grows, and the deferred idea may be forgotten or re-litigated from scratch. Mitigation: the trigger conditions above are the standing checklist, and any revisit starts from this record rather than a blank page.

## Verification & Related Context

- The measured baseline to compare against on any revisit: ~16.6k characters (~4.1k tokens) full prompt, ~6.7k characters deep-dive share, computed via `buildAiSystemPrompt("en")`.
- Any future change to chat context should re-measure the prompt size with the same method before and after.
- No code changes are part of this decision; `src/app/api/chat/route.ts`, `src/data/aiContext.ts`, and `src/config/ai.ts` remain as-is.
