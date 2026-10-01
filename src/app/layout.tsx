import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eds | AI-Assisted Software Engineer",
  description: "Interactive modern terminal portfolio of Dimas Edra Ar Rafi (Eds)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-[#040502] text-[#D3D7CE] font-mono selection:bg-[#273024] selection:text-[#E2E8F0]"
      >
        {children}
      </body>
    </html>
  );
}
