import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  themeColor: "#050505",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ioskeleyMono.variable} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased min-h-[100dvh] bg-[#050505] text-[#D4D4D8] font-mono selection:bg-[#222222] selection:text-[#E2E8F0]"
      >
        {children}
      </body>
    </html>
  );
}
