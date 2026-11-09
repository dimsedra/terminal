import type { CommandItem } from "./types.ts";

export const commands: CommandItem[] = [
  {
    name: "/chat",
    desc: "Enter interactive AI session",
    descId: "Mulai sesi AI interaktif",
  },
  {
    name: "/projects",
    desc: "View projects with live links and repository details",
    descId: "Lihat proyek unggulan, tautan langsung, dan repositori",
  },
  {
    name: "/skills",
    desc: "Inspect technical skills, stack, and AI tooling",
    descId: "Lihat keahlian teknis, stack teknologi, dan AI tooling",
  },
  {
    name: "/about",
    desc: "Learn about Eds, role, and engineering philosophy",
    descId: "Pelajari latar belakang Eds, peran, dan filosofi rekayasa",
  },
  {
    name: "/contact",
    desc: "Get touchpoints (GitHub, LinkedIn, Email)",
    descId: "Dapatkan kontak langsung (GitHub, LinkedIn, Email)",
  },
  {
    name: "/lang",
    desc: "Switch language / ganti bahasa (en/id)",
    descId: "Ganti bahasa terminal (en/id)",
  },
  {
    name: "/themes",
    desc: "Switch ambient ASCII background theme",
    descId: "Ganti tema latar belakang animasi ASCII",
  },
  {
    name: "/help",
    desc: "List all available terminal commands",
    descId: "Daftar semua perintah terminal yang tersedia",
  },
  {
    name: "/exit",
    desc: "Exit session and return to home",
    descId: "Keluar dari sesi AI dan kembali ke beranda",
  },
];
