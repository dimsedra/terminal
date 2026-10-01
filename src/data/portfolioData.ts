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
    { name: "/help", desc: "List all available terminal commands" },
    { name: "/about", desc: "Learn about Eds, role, and engineering philosophy" },
    { name: "/projects", desc: "View projects with live links and repository details" },
    { name: "/skills", desc: "Inspect technical skills, stack, and AI tooling" },
    { name: "/contact", desc: "Get touchpoints (GitHub, LinkedIn, Email)" },
    { name: "/clear", desc: "Clear terminal history" },
  ],
};
