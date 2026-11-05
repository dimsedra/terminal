import { z } from "zod";

export type ContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

export interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday: number;
  contributionLevel: ContributionLevel;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionGridCell {
  glyph: "·" | "░" | "▒" | "▓" | "█";
  colorHex: string;
  level: ContributionLevel;
  count: number;
  date: string;
}

export interface ContributionGridRow {
  weekday: number;
  label: string;
  cells: ContributionGridCell[];
}

export interface FormattedContributionGrid {
  summaryText: string;
  displayedWeeks: number;
  rows: ContributionGridRow[];
  legend: Array<{
    level: ContributionLevel;
    glyph: "·" | "░" | "▒" | "▓" | "█";
    colorHex: string;
  }>;
}

export interface FormatContributionGridOptions {
  weeks: ContributionWeek[];
  totalContributions: number;
  maxColumns?: number;
}

export type ParsedContributionsResponse =
  | {
      status: "ok";
      totalContributions: number;
      weeks: ContributionWeek[];
    }
  | {
      status: "offline";
      reason: string;
    };

const ApiContributionDaySchema = z.object({
  contributionCount: z.number().int().nonnegative(),
  date: z.string(),
  weekday: z.number().int().min(0).max(6),
  contributionLevel: z.enum([
    "NONE",
    "FIRST_QUARTILE",
    "SECOND_QUARTILE",
    "THIRD_QUARTILE",
    "FOURTH_QUARTILE",
  ]),
});

const ApiContributionsResponseSchema = z.object({
  totalContributions: z.number().int().nonnegative(),
  weeks: z.array(
    z.object({
      contributionDays: z.array(ApiContributionDaySchema),
    })
  ),
  error: z.string().optional(),
});

export function parseContributionsApiResponse(
  rawPayload: unknown
): ParsedContributionsResponse {
  const parsed = ApiContributionsResponseSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return { status: "offline", reason: "INVALID_RESPONSE" };
  }

  if (parsed.data.error || parsed.data.weeks.length === 0) {
    return {
      status: "offline",
      reason: parsed.data.error ?? "EMPTY_CALENDAR",
    };
  }

  return {
    status: "ok",
    totalContributions: parsed.data.totalContributions,
    weeks: parsed.data.weeks,
  };
}

export function resolveMaxColumnsForViewport(viewportWidth: number): number {
  if (viewportWidth < 640) {
    return 16;
  }
  if (viewportWidth < 1100) {
    return 28;
  }
  return 52;
}

const LEVEL_STYLES: Record<
  ContributionLevel,
  { glyph: "·" | "░" | "▒" | "▓" | "█"; colorHex: string }
> = {
  NONE: { glyph: "·", colorHex: "#3F3F46" },
  FIRST_QUARTILE: { glyph: "░", colorHex: "#0e4429" },
  SECOND_QUARTILE: { glyph: "▒", colorHex: "#006d32" },
  THIRD_QUARTILE: { glyph: "▓", colorHex: "#26a641" },
  FOURTH_QUARTILE: { glyph: "█", colorHex: "#39d353" },
};

const WEEKDAY_LABELS = ["   ", "Mon", "   ", "Wed", "   ", "Fri", "   "];

const CONTRIBUTION_LEVEL_ORDER: ContributionLevel[] = [
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
];

function resolveDayCell(
  week: ContributionWeek,
  weekday: number
): ContributionGridCell {
  const matchedDay = week.contributionDays.find((day) => day.weekday === weekday);
  if (!matchedDay) {
    return {
      glyph: LEVEL_STYLES.NONE.glyph,
      colorHex: LEVEL_STYLES.NONE.colorHex,
      level: "NONE",
      count: 0,
      date: "",
    };
  }

  const levelStyle = LEVEL_STYLES[matchedDay.contributionLevel] ?? LEVEL_STYLES.NONE;
  return {
    glyph: levelStyle.glyph,
    colorHex: levelStyle.colorHex,
    level: matchedDay.contributionLevel,
    count: matchedDay.contributionCount,
    date: matchedDay.date,
  };
}

function buildGridRow(
  weekday: number,
  label: string,
  visibleWeeks: ContributionWeek[]
): ContributionGridRow {
  return {
    weekday,
    label,
    cells: visibleWeeks.map((week) => resolveDayCell(week, weekday)),
  };
}

export function formatContributionGrid(
  options: FormatContributionGridOptions
): FormattedContributionGrid | null {
  const { weeks, totalContributions, maxColumns = 52 } = options;
  if (!Array.isArray(weeks) || weeks.length === 0 || maxColumns <= 0) {
    return null;
  }

  const visibleWeeks = weeks.slice(-Math.floor(maxColumns));
  if (visibleWeeks.length === 0) {
    return null;
  }

  const formattedTotal = Math.max(0, Math.floor(totalContributions)).toLocaleString("en-US");
  const noun = totalContributions === 1 ? "contribution" : "contributions";

  return {
    summaryText: `${formattedTotal} ${noun} in the last year`,
    displayedWeeks: visibleWeeks.length,
    rows: WEEKDAY_LABELS.map((label, weekday) =>
      buildGridRow(weekday, label, visibleWeeks)
    ),
    legend: CONTRIBUTION_LEVEL_ORDER.map((level) => ({
      level,
      glyph: LEVEL_STYLES[level].glyph,
      colorHex: LEVEL_STYLES[level].colorHex,
    })),
  };
}
