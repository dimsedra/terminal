import portfolioData from "./portfolio.json" with { type: "json" };
import { commands } from "../content/commands.ts";
import type {
  ProjectItem,
  AuthorInfo,
  SkillCategory,
  CommandItem,
  EducationInfo,
  ExperienceItem,
  SupportedLanguage,
  PortfolioContent,
  BilingualPortfolio,
} from "../content/types.ts";

// Re-export types for backward compatibility across consumers
export type {
  ProjectItem,
  AuthorInfo,
  SkillCategory,
  CommandItem,
  EducationInfo,
  ExperienceItem,
  SupportedLanguage,
  PortfolioContent,
  BilingualPortfolio,
};

export const BILINGUAL_PORTFOLIO_DATA = portfolioData as unknown as BilingualPortfolio;

/**
 * Backward-compatible aggregated portfolio data object (defaults to English).
 * Consumed by TerminalInterface.tsx for local deterministic command execution.
 */
export const PORTFOLIO_DATA = {
  author: portfolioData.en.author as AuthorInfo,
  education: portfolioData.en.education as EducationInfo,
  experience: portfolioData.en.experience as ExperienceItem[],
  skills: portfolioData.en.skills as SkillCategory[],
  projects: portfolioData.en.projects as ProjectItem[],
  commands,
};

export function resolveLanguage(lang?: SupportedLanguage): SupportedLanguage {
  return lang === "id" ? "id" : "en";
}

export type ParseLanguageResult =
  | { success: true; lang: SupportedLanguage }
  | { success: false; error: string };

export function parseLanguageArgument(rawArg: string): ParseLanguageResult {
  if (!rawArg || !rawArg.trim()) {
    return {
      success: false,
      error: "Usage: /lang <en|id> — Select English or Bahasa Indonesia.",
    };
  }

  const clean = rawArg.trim().toLowerCase();

  if (clean === "en" || clean === "english") {
    return { success: true, lang: "en" };
  }

  if (clean === "id" || clean === "indonesia" || clean === "indonesian") {
    return { success: true, lang: "id" };
  }

  return {
    success: false,
    error: `Unsupported language: '${rawArg.trim()}'. Please choose 'en' (English) or 'id' (Bahasa Indonesia).`,
  };
}

export function getHelpMarkdown(lang?: SupportedLanguage): string {
  const isId = resolveLanguage(lang) === "id";
  const cmdList = PORTFOLIO_DATA.commands
    .map((c) => {
      const desc = isId && c.descId ? c.descId : c.desc;
      return `- \`${c.name}\` — ${desc}`;
    })
    .join("\n");

  if (isId) {
    return `### Daftar Perintah Terminal\n\n${cmdList}\n\n_Tip: Ketik \`/chat\` untuk memulai sesi AI interaktif, atau \`/exit\` untuk kembali ke beranda._`;
  }

  return `### Available Commands\n\n${cmdList}\n\n_Tip: Type \`/chat\` to launch an interactive AI session, or \`/exit\` to return home._`;
}

export function getChatPlaceholderMarkdown(query?: string, lang?: SupportedLanguage): string {
  const isId = resolveLanguage(lang) === "id";

  if (query && query.trim()) {
    if (isId) {
      return `### Asisten AI (Mode LLM)\n\nMenghubungkan prompt ke Gemini LLM...\n\n> Prompt: \`${query.trim()}\`\n\n_Koneksi asisten AI sedang diinisialisasi. Anda akan segera dapat mengobrol bebas dengan avatar virtual Eds yang didukung Google Gemini!_`;
    }
    return `### AI Assistant (LLM Mode)\n\nConnecting prompt to Gemini LLM...\n\n> Prompt: \`${query.trim()}\`\n\n_AI assistant connection is being initialized. You will soon be able to chat freely with Eds's virtual avatar powered by Google Gemini!_`;
  }

  if (isId) {
    return `### Asisten AI (Mode LLM)\n\nTerhubung ke antarmuka Asisten AI Eds.\n\nAnda dapat bertanya seputar latar belakang Eds, pola arsitektur sistem, alur kerja agentic, atau detail proyek tertentu.\n\n_Penggunaan: \`/chat <pertanyaan Anda di sini>\`_`;
  }

  return `### AI Assistant (LLM Mode)\n\nConnected to Eds's AI Assistant interface.\n\nYou can ask about Eds's background, system architecture patterns, agentic workflows, or specific projects.\n\n_Usage: \`/chat <your question here>\`_`;
}

export function getAboutMarkdown(lang?: SupportedLanguage): string {
  const resolved = resolveLanguage(lang);
  const data = BILINGUAL_PORTFOLIO_DATA[resolved];
  const { author: a, education } = data;
  const isId = resolved === "id";

  let bioText = `### ${a.name} (${a.callsign})\n**${a.role}**\n\n> ${isId ? "Lokasi" : "Location"}: ${a.location} · [GitHub](${a.links.github}) · [LinkedIn](${a.links.linkedin})\n\n${a.bio}`;

  if (education) {
    const certs = education.certifications.join(", ");
    if (isId) {
      bioText += `\n\n#### Pendidikan & Kredensial\n- **${education.institution}** (${education.period})\n  ${education.degree} (IPK: ${education.gpa})\n  _Sertifikasi:_ ${certs}`;
    } else {
      bioText += `\n\n#### Education & Credentials\n- **${education.institution}** (${education.period})\n  ${education.degree} (GPA: ${education.gpa})\n  _Certifications:_ ${certs}`;
    }
  }

  return bioText;
}

export function getProjectsMarkdown(lang?: SupportedLanguage): string {
  const resolved = resolveLanguage(lang);
  const data = BILINGUAL_PORTFOLIO_DATA[resolved];
  const isId = resolved === "id";

  const projList = data.projects
    .map((p) => {
      const stackBadges = p.stack.map((s) => `\`${s}\``).join(" ");
      const rolePeriod = p.role && p.period ? `\n  _${p.role} · ${p.period}_` : "";
      const links: string[] = [];
      if (p.github) {
        links.push(`[${isId ? "lihat repositori ↗" : "view repository ↗"}](${p.github})`);
      }
      if (p.link) {
        links.push(`[${isId ? "demo langsung ↗" : "live demo ↗"}](${p.link})`);
      }
      const linksLine = links.length > 0 ? `\n  ${links.join(" · ")}` : "";
      return `- **${p.name}**${rolePeriod}\n  ${p.description}\n  ${stackBadges}${linksLine}`;
    })
    .join("\n\n");

  const heading = isId ? "### Proyek Unggulan & Sistem" : "### Featured Projects & Systems";
  return `${heading}\n\n${projList}`;
}

export function getSkillsMarkdown(lang?: SupportedLanguage): string {
  const resolved = resolveLanguage(lang);
  const data = BILINGUAL_PORTFOLIO_DATA[resolved];
  const isId = resolved === "id";

  const skillsList = data.skills
    .map((cat) => {
      const items = cat.items.map((i) => `\`${i}\``).join(" ");
      return `- **${cat.category}**\n  ${items}`;
    })
    .join("\n\n");

  const heading = isId ? "### Kemampuan Teknis & Alat Kerja" : "### Technical Capabilities & Tools";
  return `${heading}\n\n${skillsList}`;
}

export function getContactMarkdown(lang?: SupportedLanguage): string {
  const resolved = resolveLanguage(lang);
  const data = BILINGUAL_PORTFOLIO_DATA[resolved];
  const isId = resolved === "id";
  const { links } = data.author;

  const cleanEmail = links.email.replace("mailto:", "");
  const phoneLine = links.phone ? `\n- **${isId ? "Telepon / WhatsApp" : "Phone / WhatsApp"}:** [${links.phone}](tel:${links.phone})` : "";
  const portfolioLine = links.portfolio ? `\n- **${isId ? "Portfolio Langsung" : "Live Portfolio"}:** [${links.portfolio.replace("https://", "")}](${links.portfolio})` : "";

  const heading = isId ? "### Kontak & Kolaborasi" : "### Contact & Touchpoints";
  const note = isId
    ? "_Silakan hubungi saya untuk kolaborasi, diskusi arsitektur sistem, atau eksperimen tooling agentic._"
    : "_Feel free to reach out for collaborations, system architecture discussions, or agentic tooling experiments._";

  return `${heading}\n\n- **GitHub:** [${links.github.replace("https://", "")}](${links.github})\n- **LinkedIn:** [${links.linkedin.replace("https://", "")}](${links.linkedin})\n- **Email:** [${cleanEmail}](${links.email})${phoneLine}${portfolioLine}\n\n${note}`;
}
