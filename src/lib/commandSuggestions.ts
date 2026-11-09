import { commands } from "../content/commands.ts";
import { THEME_LIST, parseThemeArgument, type ThemeDefinition } from "../content/themes.ts";
import { parseLanguageArgument } from "../data/portfolioData.ts";

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

interface ThemeSuggestionOption {
  key: string;
  fullText: string;
  label: string;
  description: string;
  aliases: string[];
}

// Canonical quick-access theme options
const THEME_OPTIONS: ThemeSuggestionOption[] = THEME_LIST.map((t) => {
  const primaryAlias = t.id === "default" 
    ? "default" 
    : (t.aliases.find((a) => !/^\d+$/.test(a)) || t.id);
  
  return {
    key: primaryAlias,
    fullText: `/themes ${primaryAlias}`,
    label: primaryAlias,
    description: t.name,
    aliases: [t.id, ...t.aliases],
  };
});

interface LanguageSuggestionOption {
  key: string;
  fullText: string;
  label: string;
  description: string;
  aliases: string[];
}

const LANGUAGE_OPTIONS: LanguageSuggestionOption[] = [
  {
    key: "en",
    fullText: "/lang en",
    label: "en",
    description: "English (Default)",
    aliases: ["en", "english"],
  },
  {
    key: "id",
    fullText: "/lang id",
    label: "id",
    description: "Bahasa Indonesia",
    aliases: ["id", "indonesia", "indonesian"],
  },
];

function getEmptyResult(query: string): CommandSuggestionResult {
  return {
    isOpen: false,
    query,
    ghostSuffix: "",
    bestMatchFullText: "",
    suggestions: [],
  };
}

export function getCommandSuggestions(
  rawInput: string,
  lang: "en" | "id" = "en"
): CommandSuggestionResult {
  if (!rawInput.startsWith("/")) {
    return getEmptyResult(rawInput);
  }

  const isId = lang === "id";
  const trimmed = rawInput.trimStart();
  const lower = trimmed.toLowerCase();

  // Multi-token command: /themes with arguments
  if (lower.startsWith("/themes ")) {
    const argQuery = lower.slice("/themes ".length).trimStart();
    const rawPrefix = rawInput.slice(0, rawInput.length - argQuery.length);

    const matchingThemes = THEME_OPTIONS.filter((opt) => {
      if (argQuery.length === 0) return true;
      return opt.aliases.some((alias) => alias.toLowerCase().startsWith(argQuery));
    }).sort((a, b) => {
      const aExactKey = a.key.toLowerCase().startsWith(argQuery);
      const bExactKey = b.key.toLowerCase().startsWith(argQuery);
      if (aExactKey && !bExactKey) return -1;
      if (!aExactKey && bExactKey) return 1;
      return 0;
    });

    if (matchingThemes.length === 0) {
      return getEmptyResult(rawInput);
    }

    const bestOption = matchingThemes[0];
    const matchingAlias = bestOption.key.toLowerCase().startsWith(argQuery)
      ? bestOption.key
      : (bestOption.aliases.find((alias) => alias.toLowerCase().startsWith(argQuery)) || bestOption.key);

    const bestMatchFullText = `/themes ${matchingAlias}`;
    const ghostSuffix = bestMatchFullText.slice(rawInput.length);

    const suggestions: CommandSuggestion[] = matchingThemes.map((opt) => ({
      name: opt.label,
      fullText: opt.fullText,
      description: opt.description,
    }));

    return {
      isOpen: true,
      query: rawInput,
      ghostSuffix,
      bestMatchFullText,
      suggestions,
    };
  }

  // Multi-token command: /lang with arguments
  if (lower.startsWith("/lang ")) {
    const argQuery = lower.slice("/lang ".length).trimStart();

    const matchingLangs = LANGUAGE_OPTIONS.filter((opt) => {
      if (argQuery.length === 0) return true;
      return opt.aliases.some((alias) => alias.toLowerCase().startsWith(argQuery));
    }).sort((a, b) => {
      const aExactKey = a.key.toLowerCase().startsWith(argQuery);
      const bExactKey = b.key.toLowerCase().startsWith(argQuery);
      if (aExactKey && !bExactKey) return -1;
      if (!aExactKey && bExactKey) return 1;
      return 0;
    });

    if (matchingLangs.length === 0) {
      return getEmptyResult(rawInput);
    }

    const bestOption = matchingLangs[0];
    const matchingAlias = bestOption.key.toLowerCase().startsWith(argQuery)
      ? bestOption.key
      : (bestOption.aliases.find((alias) => alias.toLowerCase().startsWith(argQuery)) || bestOption.key);

    const bestMatchFullText = `/lang ${matchingAlias}`;
    const ghostSuffix = bestMatchFullText.slice(rawInput.length);

    const suggestions: CommandSuggestion[] = matchingLangs.map((opt) => ({
      name: opt.label,
      fullText: opt.fullText,
      description: opt.description,
    }));

    return {
      isOpen: true,
      query: rawInput,
      ghostSuffix,
      bestMatchFullText,
      suggestions,
    };
  }

  // Any other command followed by space does not have command-level suggestions
  if (lower.includes(" ")) {
    return getEmptyResult(rawInput);
  }

  // Single-token command matching (e.g. "/", "/th", "/themes")
  const matchingCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().startsWith(lower)
  );

  if (matchingCommands.length === 0) {
    return getEmptyResult(rawInput);
  }

  const bestCmd = matchingCommands[0];
  const bestMatchFullText = bestCmd.name;
  const ghostSuffix = bestMatchFullText.slice(rawInput.length);

  const suggestions: CommandSuggestion[] = matchingCommands.map((cmd) => ({
    name: cmd.name,
    fullText: cmd.name,
    description: isId && cmd.descId ? cmd.descId : cmd.desc,
  }));

  return {
    isOpen: true,
    query: rawInput,
    ghostSuffix,
    bestMatchFullText,
    suggestions,
  };
}

/**
 * Evaluates whether a raw user input represents a fully formed and recognized command
 * (either a standalone slash command or a command with valid sub-arguments).
 * Used for dynamic syntax highlighting across the input bar and history logs.
 */
export function isRecognizedCommand(rawInput: string): boolean {
  if (!rawInput) return false;
  const trimmedStart = rawInput.trimStart();
  if (!trimmedStart.startsWith("/")) return false;

  const spaceIdx = trimmedStart.indexOf(" ");

  // Case A: Single token command (no space)
  if (spaceIdx === -1) {
    const cmd = trimmedStart.toLowerCase();
    const standaloneCommands = [
      "/help",
      "/about",
      "/projects",
      "/project",
      "/skills",
      "/contact",
      "/exit",
      "/clear",
      "/cls",
      "/chat",
      "/themes",
      "/lang",
    ];
    return standaloneCommands.includes(cmd);
  }

  // Case B: Multi-token command (has space)
  const cmd = trimmedStart.slice(0, spaceIdx).toLowerCase();
  const rawArg = trimmedStart.slice(spaceIdx + 1).trim();

  // If there is a space, but the argument is completely empty, it is incomplete
  if (!rawArg) {
    return false;
  }

  if (cmd === "/chat") {
    return rawArg.length > 0;
  }

  if (cmd === "/themes") {
    return parseThemeArgument(rawArg).success;
  }

  if (cmd === "/lang") {
    return parseLanguageArgument(rawArg).success;
  }

  return false;
}
