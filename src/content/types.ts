export interface AuthorLinks {
  github: string;
  linkedin: string;
  email: string;
}

export interface AuthorInfo {
  name: string;
  callsign: string;
  role: string;
  bio: string;
  location: string;
  links: AuthorLinks;
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
}

export interface CommandItem {
  name: string;
  desc: string;
}
