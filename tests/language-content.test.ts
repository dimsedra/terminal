import test from "node:test";
import assert from "node:assert/strict";
import {
  parseLanguageArgument,
  getAboutMarkdown,
  getProjectsMarkdown,
  getSkillsMarkdown,
  getContactMarkdown,
  getHelpMarkdown,
} from "../src/data/portfolioData.ts";

test("Language Parser (Normal Path) - parses canonical 'en' and 'id' codes", () => {
  const enResult = parseLanguageArgument("en");
  assert.equal(enResult.success, true);
  if (enResult.success) {
    assert.equal(enResult.lang, "en");
  }

  const idResult = parseLanguageArgument("id");
  assert.equal(idResult.success, true);
  if (idResult.success) {
    assert.equal(idResult.lang, "id");
  }
});

test("Language Parser (Aliases & Invariants) - handles aliases, casing, and surrounding whitespace", () => {
  const indonesiaResult = parseLanguageArgument("  indonesia  ");
  assert.equal(indonesiaResult.success, true);
  if (indonesiaResult.success) {
    assert.equal(indonesiaResult.lang, "id");
  }

  const indonesianResult = parseLanguageArgument("INDONESIAN");
  assert.equal(indonesianResult.success, true);
  if (indonesianResult.success) {
    assert.equal(indonesianResult.lang, "id");
  }

  const englishResult = parseLanguageArgument("English");
  assert.equal(englishResult.success, true);
  if (englishResult.success) {
    assert.equal(englishResult.lang, "en");
  }
});

test("Language Parser (Error Path) - rejects unsupported language with descriptive error", () => {
  const unsupported = parseLanguageArgument("japanese");
  assert.equal(unsupported.success, false);
  if (!unsupported.success) {
    assert.match(unsupported.error, /en.*id/i);
  }

  const empty = parseLanguageArgument("");
  assert.equal(empty.success, false);
  if (!empty.success) {
    assert.match(empty.error, /Usage: \/lang <en\|id>/i);
  }
});

test("Localized Markdown Generators - renders English content by default and for 'en'", () => {
  const defaultAbout = getAboutMarkdown();
  assert.match(defaultAbout, /undergraduate student in informatics engineering/i);
  assert.match(defaultAbout, /Education & Credentials/i);

  const enAbout = getAboutMarkdown("en");
  assert.match(enAbout, /undergraduate student in informatics engineering/i);

  const enProjects = getProjectsMarkdown("en");
  assert.match(enProjects, /Dialogue AI/i);
  assert.match(enProjects, /Local-first AI companion/i);

  const enSkills = getSkillsMarkdown("en");
  assert.match(enSkills, /Hard Skills & Core Engineering/i);

  const enHelp = getHelpMarkdown("en");
  assert.match(enHelp, /Available Commands/i);
  assert.match(enHelp, /Tip: Type `\/chat`/i);
});

test("Localized Markdown Generators - renders Indonesian content when 'id' is supplied", () => {
  const idAbout = getAboutMarkdown("id");
  assert.match(idAbout, /Mahasiswa Teknik Informatika/i);
  assert.match(idAbout, /Pendidikan & Kredensial/i);
  assert.match(idAbout, /Sertifikat Red Hat/i);

  const idProjects = getProjectsMarkdown("id");
  assert.match(idProjects, /Dialogue AI/i);
  assert.match(idProjects, /aplikasi pendamping AI desktop lokal/i);
  assert.match(idProjects, /Proyek Unggulan/i);

  const idSkills = getSkillsMarkdown("id");
  assert.match(idSkills, /Keahlian Teknis & Rekayasa Inti/i);

  const idHelp = getHelpMarkdown("id");
  assert.match(idHelp, /Daftar Perintah Terminal/i);
  assert.match(idHelp, /Mulai sesi AI interaktif/i);
  assert.match(idHelp, /Lihat proyek unggulan/i);
  assert.match(idHelp, /Pelajari latar belakang Eds/i);
  assert.match(idHelp, /Ketik `\/chat`/i);

  const idContact = getContactMarkdown("id");
  assert.match(idContact, /Kontak & Kolaborasi/i);
});
