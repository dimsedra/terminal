import { z } from "zod";
import { author } from "../../../content/author.ts";

const ContributionLevelSchema = z.enum([
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
]);

const ContributionDaySchema = z.object({
  contributionCount: z.number().int().nonnegative(),
  date: z.string(),
  weekday: z.number().int().min(0).max(6),
  contributionLevel: ContributionLevelSchema,
});

const ContributionWeekSchema = z.object({
  contributionDays: z.array(ContributionDaySchema),
});

const GitHubGraphqlResponseSchema = z.object({
  data: z.object({
    user: z.object({
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          totalContributions: z.number().int().nonnegative(),
          weeks: z.array(ContributionWeekSchema),
        }),
      }),
    }),
  }),
});

const CONTRIBUTIONS_QUERY = `
  query GetUserContributions($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              weekday
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

function extractGitHubUsername(profileUrl: string): string {
  const parsedUrl = new URL(profileUrl);
  return parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
}

function buildJsonResponse(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(): Promise<Response> {
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  if (!githubToken) {
    return buildJsonResponse({
      totalContributions: 0,
      weeks: [],
      error: "TOKEN_NOT_CONFIGURED",
    });
  }

  try {
    const githubUsername = extractGitHubUsername(author.links.github);
    const upstreamResponse = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: CONTRIBUTIONS_QUERY,
        variables: { login: githubUsername },
      }),
      next: { revalidate: 3600 },
    });

    if (!upstreamResponse.ok) {
      return buildJsonResponse({
        totalContributions: 0,
        weeks: [],
        error: "UPSTREAM_ERROR",
      });
    }

    const rawGraphqlPayload: unknown = await upstreamResponse.json();
    const parsedGraphql = GitHubGraphqlResponseSchema.safeParse(rawGraphqlPayload);
    if (!parsedGraphql.success) {
      return buildJsonResponse({
        totalContributions: 0,
        weeks: [],
        error: "UPSTREAM_ERROR",
      });
    }

    const calendar =
      parsedGraphql.data.data.user.contributionsCollection.contributionCalendar;

    return buildJsonResponse({
      totalContributions: calendar.totalContributions,
      weeks: calendar.weeks,
    });
  } catch {
    return buildJsonResponse({
      totalContributions: 0,
      weeks: [],
      error: "UPSTREAM_ERROR",
    });
  }
}
