import type { AuthorInfo } from "./types.ts";
import portfolioData from "../data/portfolio.json" with { type: "json" };

export const author: AuthorInfo = portfolioData.en.author as AuthorInfo;
