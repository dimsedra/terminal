import test from "node:test";
import assert from "node:assert/strict";
import { GET } from "../src/app/api/github-contributions/route.ts";

test("GitHub Contributions API - returns parsed totalContributions and weeks with 1-hour edge cache when GITHUB_TOKEN is configured", async () => {
  const originalToken = process.env.GITHUB_TOKEN;
  const originalFetch = globalThis.fetch;

  let capturedUrl = "";
  let capturedOptions: RequestInit & { next?: { revalidate?: number } } = {};

  process.env.GITHUB_TOKEN = "ghp_test_token_123";
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedOptions = (init ?? {}) as RequestInit & { next?: { revalidate?: number } };
    return new Response(
      JSON.stringify({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 412,
                weeks: [
                  {
                    contributionDays: [
                      {
                        contributionCount: 4,
                        date: "2026-11-01",
                        weekday: 0,
                        contributionLevel: "SECOND_QUARTILE",
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const response = await GET();
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.totalContributions, 412);
    assert.equal(payload.weeks.length, 1);
    assert.equal(payload.weeks[0].contributionDays[0].contributionLevel, "SECOND_QUARTILE");
    assert.equal(payload.error, undefined);

    assert.equal(capturedUrl, "https://api.github.com/graphql");
    assert.equal(capturedOptions.next?.revalidate, 3600);
    const requestBody = JSON.parse(String(capturedOptions.body));
    assert.equal(requestBody.variables.login, "dimsedra");
  } finally {
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalToken;
    }
    globalThis.fetch = originalFetch;
  }
});

test("GitHub Contributions API - trims surrounding whitespace on GITHUB_TOKEN and handles empty calendar weeks", async () => {
  const originalToken = process.env.GITHUB_TOKEN;
  const originalFetch = globalThis.fetch;

  let capturedAuthHeader = "";

  process.env.GITHUB_TOKEN = "   ghp_trimmed_secret   ";
  globalThis.fetch = async (_input: string | URL | Request, init?: RequestInit) => {
    const headers = init?.headers as Record<string, string> | undefined;
    capturedAuthHeader = headers?.Authorization ?? "";
    return new Response(
      JSON.stringify({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 0,
                weeks: [],
              },
            },
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const response = await GET();
    const payload = await response.json();
    assert.equal(capturedAuthHeader, "Bearer ghp_trimmed_secret");
    assert.equal(payload.totalContributions, 0);
    assert.deepEqual(payload.weeks, []);
    assert.equal(payload.error, undefined);
  } finally {
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalToken;
    }
    globalThis.fetch = originalFetch;
  }
});

test("GitHub Contributions API - returns TOKEN_NOT_CONFIGURED fallback when GITHUB_TOKEN is missing or blank", async () => {
  const originalToken = process.env.GITHUB_TOKEN;
  const originalFetch = globalThis.fetch;

  let fetchCalled = false;
  delete process.env.GITHUB_TOKEN;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("Should not call fetch when token is missing");
  };

  try {
    const responseMissing = await GET();
    assert.equal(responseMissing.status, 200);
    const payloadMissing = await responseMissing.json();
    assert.deepEqual(payloadMissing, {
      totalContributions: 0,
      weeks: [],
      error: "TOKEN_NOT_CONFIGURED",
    });

    process.env.GITHUB_TOKEN = "   ";
    const responseBlank = await GET();
    const payloadBlank = await responseBlank.json();
    assert.equal(payloadBlank.error, "TOKEN_NOT_CONFIGURED");
    assert.equal(fetchCalled, false);
  } finally {
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalToken;
    }
    globalThis.fetch = originalFetch;
  }
});

test("GitHub Contributions API - returns UPSTREAM_ERROR fallback on HTTP failure, invalid schema, or network error without leaking credentials", async () => {
  const originalToken = process.env.GITHUB_TOKEN;
  const originalFetch = globalThis.fetch;

  const secretToken = "ghp_super_secret_token_999";
  process.env.GITHUB_TOKEN = secretToken;

  try {
    globalThis.fetch = async () => new Response("Unauthorized", { status: 401 });
    const httpErrorRes = await GET();
    const httpErrorPayload = await httpErrorRes.json();
    assert.equal(httpErrorRes.status, 200);
    assert.equal(httpErrorPayload.error, "UPSTREAM_ERROR");
    assert.equal(JSON.stringify(httpErrorPayload).includes(secretToken), false);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ errors: [{ message: "Bad credentials" }] }), {
        status: 200,
      });
    const schemaErrorRes = await GET();
    const schemaErrorPayload = await schemaErrorRes.json();
    assert.equal(schemaErrorPayload.error, "UPSTREAM_ERROR");

    globalThis.fetch = async () => {
      throw new Error("Socket hang up");
    };
    const networkErrorRes = await GET();
    const networkErrorPayload = await networkErrorRes.json();
    assert.equal(networkErrorPayload.error, "UPSTREAM_ERROR");
    assert.equal(JSON.stringify(networkErrorPayload).includes(secretToken), false);
  } finally {
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalToken;
    }
    globalThis.fetch = originalFetch;
  }
});
