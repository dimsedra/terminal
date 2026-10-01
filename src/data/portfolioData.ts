import {
  author,
  skills,
  projects,
  commands,
  ProjectItem,
  AuthorInfo,
  SkillCategory,
  CommandItem,
} from "@/content";

// Re-export types for backward compatibility across consumers
export type { ProjectItem, AuthorInfo, SkillCategory, CommandItem };

/**
 * Backward-compatible aggregated portfolio data object.
 * Consumers like /api/chat/route.ts and TerminalInterface.tsx continue to import PORTFOLIO_DATA cleanly.
 */
export const PORTFOLIO_DATA = {
  author,
  skills,
  projects,
  commands,
};

export function getHelpMarkdown(): string {
  const cmdList = PORTFOLIO_DATA.commands
    .map((c) => `- \`${c.name}\` — ${c.desc}`)
    .join("\n");

  return `### Available Commands\n\n${cmdList}\n\n_Tip: Type \`/chat\` to launch an interactive AI session, or \`/exit\` to return home._`;
}

export function getChatPlaceholderMarkdown(query?: string): string {
  if (query && query.trim()) {
    return `### AI Assistant (LLM Mode)\n\nConnecting prompt to Gemini LLM...\n\n> Prompt: \`${query.trim()}\`\n\n_AI assistant connection is being initialized. You will soon be able to chat freely with Eds's virtual avatar powered by Google Gemini!_`;
  }
  return `### AI Assistant (LLM Mode)\n\nConnected to Eds's AI Assistant interface.\n\nYou can ask about Eds's background, system architecture patterns, agentic workflows, or specific projects.\n\n_Usage: \`/chat <your question here>\`_`;
}

export function getAboutMarkdown(): string {
  const { author: a } = PORTFOLIO_DATA;
  return `### ${a.name} (${a.callsign})\n**${a.role}**\n\n> Location: ${a.location} · [GitHub](${a.links.github}) · [LinkedIn](${a.links.linkedin})\n\n${a.bio}`;
}

export function getProjectsMarkdown(): string {
  const projList = PORTFOLIO_DATA.projects
    .map((p) => {
      const stackBadges = p.stack.map((s) => `\`${s}\``).join(" ");
      const repoLink = p.github ? `\n  [view repository ↗](${p.github})` : "";
      return `- **${p.name}**\n  ${p.description}\n  ${stackBadges}${repoLink}`;
    })
    .join("\n\n");

  return `### Featured Projects & Systems\n\n${projList}`;
}

export function getSkillsMarkdown(): string {
  const skillsList = PORTFOLIO_DATA.skills
    .map((cat) => {
      const items = cat.items.map((i) => `\`${i}\``).join(" ");
      return `- **${cat.category}**\n  ${items}`;
    })
    .join("\n\n");

  return `### Technical Capabilities & Tools\n\n${skillsList}`;
}

export function getContactMarkdown(): string {
  const { links } = PORTFOLIO_DATA.author;
  const cleanEmail = links.email.replace("mailto:", "");
  return `### Contact & Touchpoints\n\n- **GitHub:** [${links.github.replace("https://", "")}](${links.github})\n- **LinkedIn:** [${links.linkedin.replace("https://", "")}](${links.linkedin})\n- **Email:** [${cleanEmail}](${links.email})\n\n_Feel free to reach out for collaborations, system architecture discussions, or agentic tooling experiments._`;
}
