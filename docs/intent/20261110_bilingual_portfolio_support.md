---
title: "Intent: Bilingual Portfolio Support (EN & ID)"
type: intent
last_updated: 2026-11-10
---

# Intent: Bilingual Portfolio Support (EN & ID)

## Goal
Enable complete bilingual support (English and Bahasa Indonesia) across the terminal portfolio. Visitors can seamlessly view portfolio content in their preferred language through a dedicated `/lang` command, and interact with the AI assistant (`/chat`) starting with an opening greeting and conversation tone that immediately matches the active language.

## Rationale
The portfolio owner (Eds) is bilingual and works across both international and Indonesian engineering contexts. While technical resumes often default to English, offering a native Bahasa Indonesia experience creates a more personalized, accessible, and authentic representation of his background, projects, and systems thinking.

## What We Want
- **Unified Bilingual JSON Schema**: A single `src/data/portfolio.json` containing two top-level blocks: `"en"` and `"id"`, with identical structural schemas (author, education, experience, skills, projects).
- **Session Language Toggle (`/lang <en|id>`)**: A clean slash command to switch active languages (`/lang en` and `/lang id`), persisted in browser `sessionStorage` alongside the existing theme preference.
- **Deterministic Output Localization**: Terminal commands (`/about`, `/projects`, `/skills`, `/contact`) immediately output markdown generated from the currently active language block.
- **Context-Aware AI Assistant (`/chat`)**: The active language state is injected into `/chat` initialization, ensuring the model's opening greeting and default response language match the user's selected language (`en` or `id`), while retaining the flexibility to adapt if the user switches languages mid-chat.
- **Autocomplete & Suggestions**: Multi-level autocomplete recommendations for `/lang`, suggesting `en` and `id` arguments with description hints.

## What We Do NOT Want
- **No Heavy i18n Libraries or Runtimes**: Avoid bloated client-side translation frameworks (e.g. `next-intl`, `react-i18next`). Content is static and serverless.
- **No Duplicate Slash Commands**: Avoid cluttering the terminal command registry with translated aliases (e.g., avoid `/tentang`, `/proyek`, `/keahlian`). The command names remain unified under standard CLI conventions.
- **No Database Overhead**: Keep data 100% serverless and statically bundlable within Next.js.
- **No Hardcoded Component Strings**: Narrative content must reside strictly within `portfolio.json`, preserving locality of data.
