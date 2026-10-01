export interface ProjectItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  link?: string;
  github?: string;
}

export const PORTFOLIO_DATA = {
  author: {
    name: "Dimas Edra Ar Rafi",
    callsign: "Eds",
    role: "AI-Assisted Software Engineer & Systems Thinker",
    bio: "Passionate about building refined developer experiences, agentic workflows, and modern web architectures. Focused on disciplined simplicity, pattern recognition, and bridging human intuition with intelligent systems.",
    location: "Indonesia",
    links: {
      github: "https://github.com/edra-dev",
      linkedin: "https://linkedin.com/in/dimas-edra",
      email: "mailto:edra.contact@example.com",
    },
  },
  skills: [
    {
      category: "AI & Agentic Workflows",
      items: ["Vercel AI SDK", "Prompt Engineering & Guardrails", "Agentic CLI Tools", "Tool Calling / Function Calling", "Context Grounding"],
    },
    {
      category: "Frontend & Architecture",
      items: ["Next.js (App Router)", "React", "TypeScript", "Tailwind CSS", "Design Systems"],
    },
    {
      category: "Backend & Systems",
      items: ["Node.js", "Serverless Edge Functions", "REST & Streaming APIs", "Systemic Architecture"],
    },
  ],
  projects: [
    {
      id: "agentic-portfolio",
      name: "Terminal Portfolio (Agentic CLI)",
      tagline: "Modern agentic terminal interface with integrated AI assistant",
      description: "An interactive portfolio replicating modern developer CLI aesthetics with guardrailed AI, 3D ASCII rendering, and hybrid deterministic slash commands.",
      stack: ["Next.js", "Vercel AI SDK", "TypeScript", "Tailwind CSS"],
      github: "https://github.com/edra-dev/terminal-portfolio",
    },
    {
      id: "ai-workflow-engine",
      name: "Agentic Developer Workflow",
      tagline: "Context-aware subagent orchestration for coding pipelines",
      description: "Specialized workflows designed for pairing human systemic thinking with autonomous agents for testing, refactoring, and code review.",
      stack: ["TypeScript", "Vercel AI SDK", "Node.js"],
    },
    {
      id: "system-design-vault",
      name: "Systems & Architecture Blueprint",
      tagline: "Curated mental models and architectural design patterns",
      description: "Interactive documentation and visual maps exploring architectural patterns, modular state management, and edge-native paradigms.",
      stack: ["React", "Architecture", "Markdown"],
    },
  ] as ProjectItem[],
  commands: [
    { name: "/chat", desc: "Enter interactive AI session" },
    { name: "/projects", desc: "View projects with live links and repository details" },
    { name: "/skills", desc: "Inspect technical skills, stack, and AI tooling" },
    { name: "/about", desc: "Learn about Eds, role, and engineering philosophy" },
    { name: "/contact", desc: "Get touchpoints (GitHub, LinkedIn, Email)" },
    { name: "/help", desc: "List all available terminal commands" },
    { name: "/exit", desc: "Exit session and return to home" },
  ],
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
  const { author } = PORTFOLIO_DATA;
  return `### ${author.name} (${author.callsign})\n**${author.role}**\n\n> Location: ${author.location} · [GitHub](${author.links.github}) · [LinkedIn](${author.links.linkedin})\n\n${author.bio}`;
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

