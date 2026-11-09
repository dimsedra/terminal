import test from "node:test";
import assert from "node:assert/strict";
import {
  formatContributionGrid,
  parseContributionsApiResponse,
  resolveMaxColumnsForViewport,
  type ContributionWeek,
} from "../src/content/contributions.ts";

function createFullWeek(
  weekIndex: number,
  level:
    | "NONE"
    | "FIRST_QUARTILE"
    | "SECOND_QUARTILE"
    | "THIRD_QUARTILE"
    | "FOURTH_QUARTILE" = "NONE",
  count = 0
): ContributionWeek {
  return {
    contributionDays: Array.from({ length: 7 }, (_, weekday) => ({
      contributionCount: count,
      date: `2026-01-${String(weekIndex * 7 + weekday + 1).padStart(2, "0")}`,
      weekday,
      contributionLevel: level,
    })),
  };
}

test("ASCII Contribution Grid - maps all five GitHub contribution levels to shaded ASCII glyphs and monochrome palette across 7 weekday rows", () => {
  const weeks: ContributionWeek[] = [
    createFullWeek(0, "NONE", 0),
    createFullWeek(1, "FIRST_QUARTILE", 2),
    createFullWeek(2, "SECOND_QUARTILE", 5),
    createFullWeek(3, "THIRD_QUARTILE", 9),
    createFullWeek(4, "FOURTH_QUARTILE", 15),
  ];

  const grid = formatContributionGrid({
    weeks,
    totalContributions: 217,
    maxColumns: 52,
  });

  assert.ok(grid, "Expected formatted grid for non-empty weeks");
  assert.equal(grid.summaryText, "217 contributions in the last year");
  assert.equal(grid.displayedWeeks, 5);
  assert.equal(grid.rows.length, 7);

  assert.equal(grid.rows[0].label, "   ");
  assert.equal(grid.rows[1].label, "Mon");
  assert.equal(grid.rows[2].label, "   ");
  assert.equal(grid.rows[3].label, "Wed");
  assert.equal(grid.rows[4].label, "   ");
  assert.equal(grid.rows[5].label, "Fri");
  assert.equal(grid.rows[6].label, "   ");

  const mondayCells = grid.rows[1].cells;
  assert.equal(mondayCells.length, 5);
  assert.deepEqual(
    mondayCells.map((c) => ({ glyph: c.glyph, colorHex: c.colorHex })),
    [
      { glyph: "·", colorHex: "#52525B" },
      { glyph: "░", colorHex: "#71717A" },
      { glyph: "▒", colorHex: "#A1A1AA" },
      { glyph: "▓", colorHex: "#D4D4D8" },
      { glyph: "█", colorHex: "#FFFFFF" },
    ]
  );
});

test("ASCII Contribution Grid - slices rightmost recent weeks when maxColumns is smaller than full calendar", () => {
  const fiftyTwoWeeks: ContributionWeek[] = Array.from({ length: 52 }, (_, idx) =>
    createFullWeek(
      idx,
      idx >= 38 ? "FOURTH_QUARTILE" : "NONE",
      idx >= 38 ? idx + 1 : 0
    )
  );

  const mobileGrid = formatContributionGrid({
    weeks: fiftyTwoWeeks,
    totalContributions: 1248,
    maxColumns: 14,
  });

  assert.ok(mobileGrid);
  assert.equal(mobileGrid.summaryText, "1,248 contributions in the last year");
  assert.equal(mobileGrid.displayedWeeks, 14);

  for (const row of mobileGrid.rows) {
    assert.equal(row.cells.length, 14);
    assert.equal(row.cells[0].count, 39, "First visible column should be week index 38 (count 39)");
    assert.equal(row.cells[13].count, 52, "Last visible column should be most recent week index 51 (count 52)");
    assert.equal(row.cells[13].glyph, "█");
  }
});

test("ASCII Contribution Grid - returns null when weeks array is empty or maxColumns is non-positive", () => {
  const emptyResult = formatContributionGrid({
    weeks: [],
    totalContributions: 0,
    maxColumns: 52,
  });
  assert.equal(emptyResult, null);

  const zeroColumnsResult = formatContributionGrid({
    weeks: [createFullWeek(0, "FIRST_QUARTILE", 1)],
    totalContributions: 7,
    maxColumns: 0,
  });
  assert.equal(zeroColumnsResult, null);
});

test("ASCII Contribution Grid - preserves uniform column width across all 7 rows even when trailing week is partial", () => {
  const partialWeek: ContributionWeek = {
    contributionDays: [
      {
        contributionCount: 1,
        date: "2026-11-01",
        weekday: 0,
        contributionLevel: "FIRST_QUARTILE",
      },
      {
        contributionCount: 6,
        date: "2026-11-03",
        weekday: 2,
        contributionLevel: "THIRD_QUARTILE",
      },
    ],
  };

  const grid = formatContributionGrid({
    weeks: [createFullWeek(0, "SECOND_QUARTILE", 3), partialWeek],
    totalContributions: 1,
    maxColumns: 10,
  });

  assert.ok(grid);
  assert.equal(grid.summaryText, "1 contribution in the last year");
  assert.equal(grid.legend.length, 5);

  for (const row of grid.rows) {
    assert.equal(row.cells.length, 2, `Weekday ${row.weekday} must have exactly 2 columns`);
  }

  assert.equal(grid.rows[0].cells[1].glyph, "░");
  assert.equal(grid.rows[1].cells[1].glyph, "·");
  assert.equal(grid.rows[2].cells[1].glyph, "▓");
  assert.equal(grid.rows[6].cells[1].glyph, "·");
});

test("Contributions API Boundary Parser - parses valid payload and maps error or malformed payloads to offline status", () => {
  const validParsed = parseContributionsApiResponse({
    totalContributions: 84,
    weeks: [createFullWeek(0, "SECOND_QUARTILE", 3)],
  });
  assert.equal(validParsed.status, "ok");
  if (validParsed.status === "ok") {
    assert.equal(validParsed.totalContributions, 84);
    assert.equal(validParsed.weeks.length, 1);
  }

  const offlineError = parseContributionsApiResponse({
    totalContributions: 0,
    weeks: [],
    error: "TOKEN_NOT_CONFIGURED",
  });
  assert.deepEqual(offlineError, {
    status: "offline",
    reason: "TOKEN_NOT_CONFIGURED",
  });

  const malformed = parseContributionsApiResponse({ unexpected: true });
  assert.deepEqual(malformed, {
    status: "offline",
    reason: "INVALID_RESPONSE",
  });

  assert.equal(resolveMaxColumnsForViewport(360), 16);
  assert.equal(resolveMaxColumnsForViewport(768), 28);
  assert.equal(resolveMaxColumnsForViewport(1280), 52);
});
