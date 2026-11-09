import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Bodoni_Moda } from "next/font/google";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-bodoni-moda",
  display: "swap",
});

const ioskeleyMono = localFont({
  src: [
    {
      path: "../fonts/IoskeleyMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/IoskeleyMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/IoskeleyMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-ioskeley-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eds | AI-Assisted Software Engineer",
  description: "Interactive modern terminal portfolio of Dimas Edra Ar Rafi (Eds)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#161616",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ioskeleyMono.variable} ${bodoniModa.variable}`} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased min-h-[100dvh] bg-[#161616] text-[#D4D4D8] font-mono selection:bg-[#27272A] selection:text-[#FFFFFF]"
      >
        {children}
      </body>
    </html>
  );
}
