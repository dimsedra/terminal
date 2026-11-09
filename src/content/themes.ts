import type { SupportedLanguage } from "./types.ts";

export type ThemeId =
  | "default"
  | "autumn-pagoda-maples"
  | "bamboo-raft-karsts"
  | "harbour-neon-skyline";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  descriptionId?: string;
  pieceSlug?: string;
  aliases: string[];
}

export const THEME_LIST: ThemeDefinition[] = [
  {
    id: "default",
    name: "Default Dark",
    description: "Minimal pitch-black developer terminal",
    descriptionId: "Terminal pengembang minimalis serba hitam",
    aliases: ["default", "0", "dark", "reset", "none"],
  },
  {
    id: "autumn-pagoda-maples",
    name: "Autumn Pagoda Maples",
    description: "Five-tier pagoda with swaying maples and pond ripples",
    descriptionId: "Pagoda lima tingkat dengan pohon mapel dan riak kolam",
    pieceSlug: "autumn-pagoda-maples",
    aliases: ["autumn", "pagoda", "maples", "1"],
  },
  {
    id: "bamboo-raft-karsts",
    name: "Bamboo Raft Karsts",
    description: "Bamboo raft drifting past misty limestone karst peaks",
    descriptionId: "Rakit bambu melintasi tebing karst berkabut",
    pieceSlug: "bamboo-raft-karsts",
    aliases: ["karsts", "bamboo", "raft", "2"],
  },
  {
    id: "harbour-neon-skyline",
    name: "Harbour Neon Skyline",
    description: "Neon waterfront city skyline over a night harbor",
    descriptionId: "Pemandangan cakrawala kota neon di atas pelabuhan malam",
    pieceSlug: "harbour-neon-skyline",
    aliases: ["neon", "harbour", "skyline", "city", "3"],
  },
];

export type ParseThemeResult =
  | { success: true; theme: ThemeDefinition }
  | { success: false; error: string };

export function parseThemeArgument(rawInput: string): ParseThemeResult {
  const clean = rawInput.trim().toLowerCase();
  if (!clean) {
    return {
      success: false,
      error: "No theme specified. Run `/themes` to see available options.",
    };
  }

  const matchedTheme = THEME_LIST.find((theme) => {
    if (theme.id.toLowerCase() === clean) return true;
    return theme.aliases.some((alias) => alias.toLowerCase() === clean);
  });

  if (matchedTheme) {
    return {
      success: true,
      theme: matchedTheme,
    };
  }

  return {
    success: false,
    error: `Theme not recognized: "${rawInput}". Run \`/themes\` to view all available themes.`,
  };
}

export function getThemesMarkdown(
  currentThemeId: ThemeId = "default",
  lang?: SupportedLanguage
): string {
  const isId = lang === "id";
  const lines: string[] = [
    isId ? "### Tema Latar Belakang ASCII" : "### Ambient Background Themes",
    "",
    isId
      ? "Ubah animasi seni ASCII secara real-time. Klik shortcut atau masukkan perintah:"
      : "Switch ambient animated ASCII art in real-time. Click a shortcut or enter the command:",
    "",
  ];

  for (const theme of THEME_LIST) {
    const isActive = theme.id === currentThemeId;
    const activeBadge = isActive ? (isId ? " **(aktif)**" : " **(active)**") : "";
    const primaryShortcut = theme.aliases[0] || theme.id;
    const desc = isId && theme.descriptionId ? theme.descriptionId : theme.description;
    lines.push(
      `- \`/themes ${primaryShortcut}\` — **${theme.name}**${activeBadge}: ${desc}`
    );
  }

  lines.push("");
  lines.push(
    isId
      ? "_Tema diperbarui secara langsung dan tersimpan selama sesi browsing Anda._"
      : "_Themes update on-the-fly and persist for your current browsing session._"
  );

  return lines.join("\n");
}
