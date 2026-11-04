import test from "node:test";
import assert from "node:assert/strict";
import {
  THEME_LIST,
  parseThemeArgument,
  getThemesMarkdown,
  type ThemeId,
} from "../src/content/themes.ts";

test("Theme Registry - Core Invariants", () => {
  assert.ok(THEME_LIST.length >= 4, "Should have at least 4 registered themes");
  
  const defaultTheme = THEME_LIST.find((t) => t.id === "default");
  assert.ok(defaultTheme, "Must include a default theme");
  assert.equal(defaultTheme.pieceSlug, undefined, "Default theme does not have an ascii piece slug");

  for (const theme of THEME_LIST) {
    assert.ok(theme.id, "Theme must have an id");
    assert.ok(theme.name, "Theme must have a readable name");
    assert.ok(theme.description, "Theme must have a description");
    assert.ok(Array.isArray(theme.aliases) && theme.aliases.length > 0, "Theme must have at least one alias");
  }
});

test("Theme Parser - Normal Path", () => {
  // Exact ID
  const r1 = parseThemeArgument("autumn-pagoda-maples");
  assert.equal(r1.success, true);
  if (r1.success) {
    assert.equal(r1.theme.id, "autumn-pagoda-maples");
  }

  // Common aliases
  const r2 = parseThemeArgument("autumn");
  assert.equal(r2.success, true);
  if (r2.success) {
    assert.equal(r2.theme.id, "autumn-pagoda-maples");
  }

  const r3 = parseThemeArgument("karsts");
  assert.equal(r3.success, true);
  if (r3.success) {
    assert.equal(r3.theme.id, "bamboo-raft-karsts");
  }

  const r4 = parseThemeArgument("neon");
  assert.equal(r4.success, true);
  if (r4.success) {
    assert.equal(r4.theme.id, "harbour-neon-skyline");
  }

  const r5 = parseThemeArgument("default");
  assert.equal(r5.success, true);
  if (r5.success) {
    assert.equal(r5.theme.id, "default");
  }
});

test("Theme Parser - Boundaries and Edge Cases", () => {
  // Case-insensitivity & whitespace trimming
  const r1 = parseThemeArgument("   PAGODA   ");
  assert.equal(r1.success, true);
  if (r1.success) {
    assert.equal(r1.theme.id, "autumn-pagoda-maples");
  }

  // Number shortcuts
  const r2 = parseThemeArgument("1");
  assert.equal(r2.success, true);
  if (r2.success) {
    assert.equal(r2.theme.id, "autumn-pagoda-maples");
  }

  const r3 = parseThemeArgument("2");
  assert.equal(r3.success, true);
  if (r3.success) {
    assert.equal(r3.theme.id, "bamboo-raft-karsts");
  }

  const r4 = parseThemeArgument("3");
  assert.equal(r4.success, true);
  if (r4.success) {
    assert.equal(r4.theme.id, "harbour-neon-skyline");
  }
});

test("Theme Parser - Error Path", () => {
  const r = parseThemeArgument("matrix-super-rain-404");
  assert.equal(r.success, false);
  if (!r.success) {
    assert.ok(r.error.includes("matrix-super-rain-404"), "Error should mention the invalid argument");
    assert.ok(r.error.includes("/themes"), "Error should suggest running /themes");
  }
});

test("Themes Markdown Output - Formatting & Interactive Chips", () => {
  const md = getThemesMarkdown("default");
  assert.ok(md.includes("### Ambient Background Themes"), "Should have title");
  assert.ok(md.includes("`/themes autumn`"), "Should contain clickable command chip for autumn");
  assert.ok(md.includes("`/themes karsts`"), "Should contain clickable command chip for karsts");
  assert.ok(md.includes("`/themes neon`"), "Should contain clickable command chip for neon");
  assert.ok(md.includes("`/themes default`"), "Should contain clickable command chip for default");
  assert.ok(md.includes("(active)"), "Should indicate active theme");
});
