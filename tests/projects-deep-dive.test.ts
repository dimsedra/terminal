import test from "node:test";
import assert from "node:assert/strict";
import {
  PROJECTS_DEEP_DIVE,
  formatProjectsDeepDivePrompt,
} from "../src/data/projectsDeepDive.ts";

test("Projects Deep Dive (Invariants) - contains all 4 key projects with complete architectural data", () => {
  assert.equal(PROJECTS_DEEP_DIVE.length, 4);

  const expectedIds = [
    "dialogue-ai",
    "atmos-ecommerce",
    "gemstone-classification",
    "exifsense",
  ];

  for (const id of expectedIds) {
    const project = PROJECTS_DEEP_DIVE.find((p) => p.id === id);
    assert.ok(project, `Missing deep dive context for project: ${id}`);
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

test("Projects Deep Dive Prompt Formatter - formats markdown containing deep architecture and links", () => {
  const prompt = formatProjectsDeepDivePrompt();
  assert.match(prompt, /Dialogue AI/);
  assert.match(prompt, /Chat vs\. Observer Decoupling/);
  assert.match(prompt, /3-Tier Auditable Privacy Memory Pipeline/);
  assert.match(prompt, /ExifSense/);
  assert.match(prompt, /https:\/\/exif-sense\.vercel\.app\//);
  assert.match(prompt, /Gemstone/);
  assert.match(prompt, /ResNet50/);
  assert.match(prompt, /ATMOS/);
  assert.match(prompt, /Convex/);
});
