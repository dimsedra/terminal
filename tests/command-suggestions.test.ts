import test from "node:test";
import assert from "node:assert/strict";
import { getCommandSuggestions } from "../src/lib/commandSuggestions.ts";

test("Command Suggestions (Normal Path) - resolves slash command prefix to matching suggestions and ghost suffix", () => {
  const result = getCommandSuggestions("/th");

  assert.equal(result.isOpen, true);
  assert.equal(result.bestMatchFullText, "/themes");
  assert.equal(result.ghostSuffix, "emes");
  assert.ok(result.suggestions.length >= 1);
  assert.equal(result.suggestions[0].name, "/themes");
  assert.equal(result.suggestions[0].fullText, "/themes");
  assert.ok(result.suggestions[0].description.length > 0);
});

test("Command Suggestions (Normal Path) - handles multiple matches for short prefix", () => {
  const result = getCommandSuggestions("/c");

  assert.equal(result.isOpen, true);
  assert.ok(result.suggestions.length >= 2, "Should match /chat and /contact");
  const names = result.suggestions.map((s) => s.name);
  assert.ok(names.includes("/chat"));
  assert.ok(names.includes("/contact"));
  assert.equal(result.bestMatchFullText, "/chat");
  assert.equal(result.ghostSuffix, "hat");
});

test("Command Suggestions (Theme Arguments) - displays all available themes when typing '/themes '", () => {
  const result = getCommandSuggestions("/themes ");

  assert.equal(result.isOpen, true);
  assert.ok(result.suggestions.length >= 4, "Should list at least 4 registered themes");
  assert.equal(result.bestMatchFullText, "/themes default");
  assert.equal(result.ghostSuffix, "default");
});

test("Command Suggestions (Theme Arguments) - resolves theme aliases like 'neon' to full completion", () => {
  const result = getCommandSuggestions("/themes n");

  assert.equal(result.isOpen, true);
  assert.equal(result.bestMatchFullText, "/themes neon");
  assert.equal(result.ghostSuffix, "eon");
  assert.ok(result.suggestions.some((s) => s.name === "neon"));
});

test("Command Suggestions (Boundaries) - returns closed state and empty suggestions for non-command or empty inputs", () => {
  assert.deepEqual(getCommandSuggestions(""), {
    isOpen: false,
    query: "",
    ghostSuffix: "",
    bestMatchFullText: "",
    suggestions: [],
  });

  assert.deepEqual(getCommandSuggestions("   "), {
    isOpen: false,
    query: "   ",
    ghostSuffix: "",
    bestMatchFullText: "",
    suggestions: [],
  });

  assert.deepEqual(getCommandSuggestions("hello world"), {
    isOpen: false,
    query: "hello world",
    ghostSuffix: "",
    bestMatchFullText: "",
    suggestions: [],
  });
});

test("Command Suggestions (Boundaries) - lists all commands when input is solely '/'", () => {
  const result = getCommandSuggestions("/");

  assert.equal(result.isOpen, true);
  assert.ok(result.suggestions.length >= 8);
  assert.equal(result.bestMatchFullText, result.suggestions[0].name);
  assert.equal(result.ghostSuffix, result.suggestions[0].name.slice(1));
});

test("Command Suggestions (Error Path) - returns closed state when command or theme argument does not match", () => {
  const badCmd = getCommandSuggestions("/unknown");
  assert.equal(badCmd.isOpen, false);
  assert.equal(badCmd.ghostSuffix, "");
  assert.equal(badCmd.bestMatchFullText, "");
  assert.deepEqual(badCmd.suggestions, []);

  const badTheme = getCommandSuggestions("/themes non-existent-theme-xyz");
  assert.equal(badTheme.isOpen, false);
  assert.equal(badTheme.ghostSuffix, "");
  assert.equal(badTheme.bestMatchFullText, "");
  assert.deepEqual(badTheme.suggestions, []);
});

test("Command Suggestions (Error Path) - returns closed state for commands with spaces that do not take discrete sub-commands", () => {
  const chatPrompt = getCommandSuggestions("/chat what is your tech stack?");
  assert.equal(chatPrompt.isOpen, false);
  assert.equal(chatPrompt.ghostSuffix, "");
  assert.equal(chatPrompt.bestMatchFullText, "");
  assert.deepEqual(chatPrompt.suggestions, []);
});

test("Command Suggestions (Invariants) - is case-insensitive and resilient to regex symbols in user input", () => {
  const upper = getCommandSuggestions("/THEMES N");
  assert.equal(upper.isOpen, true);
  assert.equal(upper.bestMatchFullText, "/themes neon");
  assert.equal(upper.ghostSuffix, "eon");

  const regexInput = getCommandSuggestions("/[a-z]*");
  assert.equal(regexInput.isOpen, false);
  assert.equal(regexInput.ghostSuffix, "");
  assert.deepEqual(regexInput.suggestions, []);
});
