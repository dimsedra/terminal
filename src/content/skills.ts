import type { SkillCategory } from "./types.ts";
import portfolioData from "../data/portfolio.json" with { type: "json" };

export const skills: SkillCategory[] = portfolioData.en.skills as SkillCategory[];
