import test from "node:test";
import assert from "node:assert/strict";
import { getCommandSuggestions, isRecognizedCommand } from "../src/lib/commandSuggestions.ts";

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

test("Command Suggestions (Language Command & Arguments) - resolves '/l' to /lang and lists language options on '/lang '", () => {
  const prefixResult = getCommandSuggestions("/lan");
  assert.equal(prefixResult.isOpen, true);
  assert.equal(prefixResult.bestMatchFullText, "/lang");
  assert.equal(prefixResult.ghostSuffix, "g");
  assert.ok(prefixResult.suggestions.some((s) => s.name === "/lang"));

  const argListResult = getCommandSuggestions("/lang ");
  assert.equal(argListResult.isOpen, true);
  assert.equal(argListResult.suggestions.length, 2);
  const argNames = argListResult.suggestions.map((s) => s.name);
  assert.deepEqual(argNames, ["en", "id"]);
  assert.equal(argListResult.bestMatchFullText, "/lang en");
  assert.equal(argListResult.ghostSuffix, "en");

  const idResult = getCommandSuggestions("/lang i");
  assert.equal(idResult.isOpen, true);
  assert.equal(idResult.bestMatchFullText, "/lang id");
  assert.equal(idResult.ghostSuffix, "d");
  assert.equal(idResult.suggestions[0].name, "id");

  const aliasResult = getCommandSuggestions("/lang indo");
  assert.equal(aliasResult.isOpen, true);
  assert.equal(aliasResult.bestMatchFullText, "/lang indonesia");
  assert.equal(aliasResult.ghostSuffix, "nesia");
  assert.equal(aliasResult.suggestions[0].name, "id");

  const invalidArg = getCommandSuggestions("/lang xyz");
  assert.equal(invalidArg.isOpen, false);
  assert.equal(invalidArg.suggestions.length, 0);

  const idCommandsResult = getCommandSuggestions("/about", "id");
  assert.equal(idCommandsResult.isOpen, true);
  assert.equal(idCommandsResult.suggestions[0].description, "Pelajari latar belakang Eds, peran, dan filosofi rekayasa");
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

test("isRecognizedCommand (Normal Path) - recognizes standalone slash commands", () => {
  assert.equal(isRecognizedCommand("/projects"), true);
  assert.equal(isRecognizedCommand("/project"), true);
  assert.equal(isRecognizedCommand("/about"), true);
  assert.equal(isRecognizedCommand("/skills"), true);
  assert.equal(isRecognizedCommand("/contact"), true);
  assert.equal(isRecognizedCommand("/help"), true);
  assert.equal(isRecognizedCommand("/exit"), true);
  assert.equal(isRecognizedCommand("/clear"), true);
  assert.equal(isRecognizedCommand("/cls"), true);
  assert.equal(isRecognizedCommand("/chat"), true);
  assert.equal(isRecognizedCommand("/themes"), true);
  assert.equal(isRecognizedCommand("/lang"), true);
});

test("isRecognizedCommand (Normal Path) - recognizes commands with valid sub-arguments", () => {
  assert.equal(isRecognizedCommand("/themes default"), true);
  assert.equal(isRecognizedCommand("/themes autumn"), true);
  assert.equal(isRecognizedCommand("/themes neon"), true);
  assert.equal(isRecognizedCommand("/themes 1"), true);
  assert.equal(isRecognizedCommand("/lang en"), true);
  assert.equal(isRecognizedCommand("/lang id"), true);
  assert.equal(isRecognizedCommand("/chat what projects have you built?"), true);
});

test("isRecognizedCommand (Boundaries & Errors) - rejects incomplete, invalid, or non-slash inputs", () => {
  assert.equal(isRecognizedCommand("/"), false);
  assert.equal(isRecognizedCommand("/p"), false);
  assert.equal(isRecognizedCommand("/proj"), false);
  assert.equal(isRecognizedCommand("/the"), false);
  assert.equal(isRecognizedCommand("/themes nonexistent123"), false);
  assert.equal(isRecognizedCommand("/lang japanese"), false);
  assert.equal(isRecognizedCommand("/chat "), false);
  assert.equal(isRecognizedCommand("hello world"), false);
  assert.equal(isRecognizedCommand(""), false);
});
