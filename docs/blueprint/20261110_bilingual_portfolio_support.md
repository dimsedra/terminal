---
title: "Blueprint: Bilingual Portfolio Support (EN & ID)"
type: blueprint
parent_intent: docs/intent/20261110_bilingual_portfolio_support.md
status: Approved
last_updated: 2026-11-10
---

# Blueprint: Bilingual Portfolio Support (EN & ID)

Technical specification translating `docs/intent/20261110_bilingual_portfolio_support.md` into concrete module boundaries, data structures, terminal routing contracts, and verified verification strategies for bilingual (English & Bahasa Indonesia) portfolio support.

## Current Code

- Data currently resides in `src/data/portfolio.json` as a single flat English object imported by `src/content/author.ts`, `src/content/projects.ts`, `src/content/skills.ts`, and `src/data/portfolioData.ts`.
- `PORTFOLIO_DATA` in `src/data/portfolioData.ts` generates English-only markdown strings for `/about`, `/projects`, `/skills`, `/contact`, and `/help`.
- `TerminalInterface.tsx` maintains session state for `currentTheme` with `sessionStorage` persistence, but lacks language state tracking.
- Autocomplete in `src/lib/commandSuggestions.ts` handles `/themes <theme>` argument suggestions, but does not recognize `/lang`.
- `/chat` initialization in `TerminalInterface.tsx` dispatches a hardcoded English opening greeting, and `/api/chat/route.ts` prompts the Gemini LLM solely with English portfolio text.

## Design

```
+-------------------------------------------------------------+
|                   src/data/portfolio.json                   |
|       +---------------------+   +---------------------+     |
|       |     "en": { ... }   |   |     "id": { ... }   |     |
|       +---------------------+   +---------------------+     |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                  src/data/portfolioData.ts                  |
|  - parseLanguageArgument(arg) -> { success, lang }          |
|  - getAboutMarkdown(lang)                                   |
|  - getProjectsMarkdown(lang)                                |
|  - getSkillsMarkdown(lang)                                  |
|  - getContactMarkdown(lang)                                 |
|  - getHelpMarkdown(lang)                                    |
+------------------------------+------------------------------+
                               |
        +----------------------+----------------------+
        |                                             |
        v                                             v
+-----------------------+                 +-----------------------+
| TerminalInterface.tsx |                 | /api/chat/route.ts    |
| - currentLang state   |                 | - Bilingual prompt    |
| - /lang <en|id> router|                 |   grounding           |
| - Localized greeting  |                 | - Language preference |
+-----------------------+                 +-----------------------+
```

1. **Locality of Data**: `portfolio.json` holds both `"en"` and `"id"` objects with identical TypeScript schemas (`AuthorInfo`, `EducationInfo`, `ExperienceItem[]`, `SkillCategory[]`, `ProjectItem[]`).
2. **Deterministic State Resolution**: `TerminalInterface.tsx` tracks `currentLang: "en" | "id"` initialized from `sessionStorage` key `eds_terminal_lang` (defaulting to `"en"`).
3. **Pure Helper Utilities**: `src/data/portfolioData.ts` houses pure lookup and parsing functions testable without browser DOM dependencies.
4. **Context Injection**: `/chat` activation sends an opening prompt in the active language and passes `lang` to `/api/chat/route.ts` to instruct the Gemini LLM on tone and language preference.

## Contracts

### BP-I18N-001: Bilingual Schema Definition & Data Structure
- **Serves**: Intent Goal & Unified Bilingual JSON Schema.
- **Input**: `src/data/portfolio.json` containing top-level keys `"en"` and `"id"`, validated against TypeScript definitions in `src/content/types.ts`.
- **Behavior**: `src/content/types.ts` exports `SupportedLanguage = "en" | "id"` and `PortfolioSchema` representing `{ en: PortfolioContent, id: PortfolioContent }`.
- **Output**: Typed data access for both English and Indonesian datasets without runtime type coercion.
- **Failure**: Missing language key or mismatched fields trigger TypeScript compilation errors at build time.
- **Method**: Design by contract (`method/DESIGN_BY_CONTRACT.md`).
- **Verification**: `npx tsc --noEmit` and JSON schema validation test.
- **Commit**: `feat(data): structure portfolio.json with en and id datasets`

### BP-I18N-002: Localized Markdown Content Generators & Language Parser
- **Serves**: Intent Deterministic Output Localization.
- **Input**:
  - `lang?: SupportedLanguage` passed to `getAboutMarkdown(lang)`, `getProjectsMarkdown(lang)`, `getSkillsMarkdown(lang)`, `getContactMarkdown(lang)`, and `getHelpMarkdown(lang)`.
  - Raw string argument passed to `parseLanguageArgument(arg: string)`.
- **Behavior**:
  - `parseLanguageArgument` parses `"en"`, `"id"`, `"english"`, `"indonesia"`, `"indonesian"` (case-insensitive, trimmed). Returns `{ success: true, lang }` or `{ success: false, error }`.
  - Markdown generators extract text exclusively from `portfolioData[lang]`.
- **Output**:
  - Correct localized Markdown for valid language codes.
  - Informative error message specifying valid choices (`/lang <en|id>`) when invalid arguments are provided.
- **Failure**: Unrecognized language falls back safely to default `"en"`.
- **Method**: TDD (`method/TDD.md`).
- **Verification**: Unit tests covering normal paths (`en`, `id`), alias parsing (`indonesia`), case-insensitivity, and error fallbacks.
- **Commit**: `test(content): add tests for language parsing and localized markdown`, followed by `feat(content): implement localized markdown generators and parseLanguageArgument`

### BP-I18N-003: `/lang` Slash Command & Multi-Level Autocomplete
- **Serves**: Intent Autocomplete & Suggestions and `/lang` command specification.
- **Input**: User input string starting with `/lang` or `/lang ` in `src/lib/commandSuggestions.ts`.
- **Behavior**:
  - Registered `/lang` command in `src/content/commands.ts` with description `"Switch language / ganti bahasa (en/id)"`.
  - When typing `/lang `, suggest options `en` ("English (Default)") and `id` ("Bahasa Indonesia").
  - Inline ghost prediction computes matching suffix (e.g. typing `/lang e` shows `n`).
- **Output**: `CommandSuggestionResult` with open popover and matching suggestion chips.
- **Failure**: Empty query or non-matching sub-argument cleanly closes suggestions without throwing.
- **Method**: TDD (`method/TDD.md`).
- **Verification**: Unit tests in `tests/command-suggestions.test.ts` asserting on `/lang ` options and ghost text prediction.
- **Commit**: `test(cli): add autocomplete tests for /lang command`, followed by `feat(cli): register /lang and argument autocomplete`

### BP-I18N-004: Terminal Interface Language State & Deterministic Execution
- **Serves**: Intent Session Language Toggle (`/lang <en|id>`).
- **Input**: User command `/lang` or `/lang <target>` in `TerminalInterface.tsx`.
- **Behavior**:
  - If executed without argument: displays current language and usage hint (`Current language: English (en). Type /lang id to switch.`).
  - If executed with valid target (`/lang id` or `/lang en`): updates `currentLang` state, persists to `sessionStorage.setItem("eds_terminal_lang", lang)`, and prints a localized switch confirmation.
  - Subsequent execution of `/about`, `/projects`, `/skills`, `/contact`, `/help` uses `currentLang`.
- **Output**: Terminal output message reflecting updated language state.
- **Failure**: Invalid argument outputs clear error message without mutating existing language state.
- **Method**: Characterization / Integration (`method/CHARACTERIZATION.md`).
- **Verification**: Manual browser verification with Playwright screenshot asserting language switch persistence across commands.
- **Commit**: `feat(terminal): add language state tracking and /lang command execution`

### BP-I18N-005: Context-Aware AI Assistant (`/chat`) Bilingual Grounding
- **Serves**: Intent Context-Aware AI Assistant (`/chat`).
- **Input**: Active `currentLang` passed during `/chat` initialization in `TerminalInterface.tsx` and received by `src/app/api/chat/route.ts`.
- **Behavior**:
  - When user launches `/chat`:
    - If `currentLang === "id"`: opening greeting prompt is in Bahasa Indonesia ("Halo! Saya baru saja membuka sesi interaktif ini...").
    - If `currentLang === "en"`: opening greeting prompt is in English.
  - Synthesized slash commands inside AI session (`/projects`, `/skills`, `/about`, `/contact`) route localized query prompts according to `currentLang`.
  - API endpoint `src/app/api/chat/route.ts` receives `activeLang` in request payload and provides Gemini with localized grounding text and explicit instruction on primary response language.
- **Output**: Cohesive Indonesian or English AI chat greeting and conversation flow.
- **Failure**: Missing language parameter in chat API defaults to `"en"`.
- **Method**: Integration testing (`method/INTEGRATION_E2E.md`).
- **Verification**: Verification of API request payload and streaming greeting response in both `id` and `en` modes.
- **Commit**: `feat(ai): inject active language context into chat greeting and LLM system prompt`

## Non-Goals
- **No Translation Libraries**: Do not install external i18n libraries (no `react-intl`, `next-intl`, or `i18next`).
- **No Duplicate Slash Commands**: Do not add translated commands like `/tentang`, `/proyek`, `/keahlian`, or `/bantuan`. Command names stay universal.
- **No Hardcoded Component Text**: Do not hardcode localized project descriptions inside TSX render blocks.
- **No Database Persistence**: Do not use cookies or database models for language preferences; keep state purely in browser `sessionStorage`.
