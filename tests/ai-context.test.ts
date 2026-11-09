import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_AUTHOR_DATA,
  AI_EDUCATION_DATA,
  AI_EXPERIENCE_DATA,
  AI_SKILLS_DATA,
  AI_PROJECTS_DATA,
  buildAiSystemPrompt,
} from "../src/data/aiContext.ts";

test("AI Context (Invariants) - contains author, education, skills, and 4 architectural project records", () => {
  assert.equal(AI_AUTHOR_DATA.name, "Dimas Edra Ar Rafi");
  assert.equal(AI_AUTHOR_DATA.callsign, "Eds");
  assert.ok(AI_AUTHOR_DATA.links.github.startsWith("https://github.com/"));
  assert.ok(AI_AUTHOR_DATA.links.email.startsWith("mailto:"));

  assert.ok(AI_EDUCATION_DATA.institution.length > 0);
  assert.ok(AI_EXPERIENCE_DATA.length > 0);
  assert.ok(AI_SKILLS_DATA.length > 0);
  assert.equal(AI_PROJECTS_DATA.length, 4);

  const expectedIds = [
    "dialogue-ai",
    "atmos-ecommerce",
    "gemstone-classification",
    "exifsense",
  ];

  for (const id of expectedIds) {
    const project = AI_PROJECTS_DATA.find((p) => p.id === id);
    assert.ok(project, `Missing project context for: ${id}`);
    assert.ok(project.name.length > 0);
    assert.ok(project.role.length > 0);
    assert.ok(project.github?.startsWith("https://github.com/dimsedra/"));
    assert.ok(project.stack.length > 0);
    assert.ok(project.summary.length > 0);
    assert.ok(project.architecturalPillars.length > 0);
    for (const pillar of project.architecturalPillars) {
      assert.ok(pillar.title.length > 0);
      assert.ok(pillar.description.length > 0);
    }
    assert.ok(project.technicalHighlights.length > 0);
    assert.ok(project.systemTradeoffsAndDecisions.length > 0);
  }
});

test("buildAiSystemPrompt (Normal Path) - injects English directive for default and 'en'", () => {
  const promptDefault = buildAiSystemPrompt();
  assert.match(promptDefault, /ENGLISH TERMINAL MODE ACTIVE/);
  assert.match(promptDefault, /Dialogue AI/);
  assert.match(promptDefault, /Chat vs\. Observer Decoupling/);
  assert.match(promptDefault, /https:\/\/github\.com\/dimsedra\/dialogue-ai/);
  assert.match(promptDefault, /ExifSense/);
  assert.match(promptDefault, /https:\/\/exif-sense\.vercel\.app\//);
  assert.match(promptDefault, /STRICT BOUNDARY & SCOPE DIRECTIVE/);

  const promptEn = buildAiSystemPrompt("en");
  assert.match(promptEn, /ENGLISH TERMINAL MODE ACTIVE/);
});

test("buildAiSystemPrompt (Normal Path) - injects Indonesian translation directive for 'id'", () => {
  const promptId = buildAiSystemPrompt("id");
  assert.match(promptId, /INDONESIAN TERMINAL MODE ACTIVE/);
  assert.match(promptId, /MUST respond, explain, and converse entirely in natural, fluent, and professional Bahasa Indonesia/);
  assert.match(promptId, /Gemstone/);
  assert.match(promptId, /ResNet50/);
  assert.match(promptId, /ATMOS/);
  assert.match(promptId, /Convex/);
});
