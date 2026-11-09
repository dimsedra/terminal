import type { ProjectItem } from "./types.ts";
import portfolioData from "../data/portfolio.json" with { type: "json" };

export const projects: ProjectItem[] = portfolioData.en.projects as ProjectItem[];
