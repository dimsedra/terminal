import { ProjectItem } from "./types";

export const projects: ProjectItem[] = [
  {
    id: "agentic-portfolio",
    name: "Terminal Portfolio (Agentic CLI)",
    tagline: "Modern agentic terminal interface with integrated AI assistant",
    description:
      "An interactive portfolio replicating modern developer CLI aesthetics with guardrailed AI, 3D ASCII rendering, and hybrid deterministic slash commands.",
    stack: ["Next.js", "Vercel AI SDK", "TypeScript", "Tailwind CSS"],
    github: "https://github.com/edra-dev/terminal-portfolio",
  },
  {
    id: "ai-workflow-engine",
    name: "Agentic Developer Workflow",
    tagline: "Context-aware subagent orchestration for coding pipelines",
    description:
      "Specialized workflows designed for pairing human systemic thinking with autonomous agents for testing, refactoring, and code review.",
    stack: ["TypeScript", "Vercel AI SDK", "Node.js"],
  },
  {
    id: "system-design-vault",
    name: "Systems & Architecture Blueprint",
    tagline: "Curated mental models and architectural design patterns",
    description:
      "Interactive documentation and visual maps exploring architectural patterns, modular state management, and edge-native paradigms.",
    stack: ["React", "Architecture", "Markdown"],
  },
];
