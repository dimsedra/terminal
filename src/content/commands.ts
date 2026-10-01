import { CommandItem } from "./types";

export const commands: CommandItem[] = [
  { name: "/chat", desc: "Enter interactive AI session" },
  { name: "/projects", desc: "View projects with live links and repository details" },
  { name: "/skills", desc: "Inspect technical skills, stack, and AI tooling" },
  { name: "/about", desc: "Learn about Eds, role, and engineering philosophy" },
  { name: "/contact", desc: "Get touchpoints (GitHub, LinkedIn, Email)" },
  { name: "/help", desc: "List all available terminal commands" },
  { name: "/exit", desc: "Exit session and return to home" },
];
