export interface AuthorLinks {
  github: string;
  linkedin: string;
  email: string;
  phone?: string;
  portfolio?: string;
}

export interface AuthorInfo {
  name: string;
  callsign: string;
  role: string;
  bio: string;
  location: string;
  links: AuthorLinks;
}

export interface EducationInfo {
  institution: string;
  location: string;
  period: string;
  degree: string;
  gpa: string;
  certifications: string[];
  scores?: string;
}

export interface ExperienceItem {
  organization: string;
  role: string;
  period: string;
  location?: string;
  description: string;
  highlights?: string[];
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  link?: string;
  github?: string;
  period?: string;
  role?: string;
  highlights?: string[];
}

export interface CommandItem {
  name: string;
  desc: string;
  descId?: string;
}

export type SupportedLanguage = "en" | "id";

export interface PortfolioContent {
  author: AuthorInfo;
  education: EducationInfo;
  experience: ExperienceItem[];
  skills: SkillCategory[];
  projects: ProjectItem[];
}

export interface BilingualPortfolio {
  en: PortfolioContent;
  id: PortfolioContent;
}
