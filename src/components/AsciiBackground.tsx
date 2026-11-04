"use client";

import React, { useEffect, useRef } from "react";
import { ThemeId, THEME_LIST } from "@/content/themes";

interface AsciiBackgroundProps {
  themeId: ThemeId;
}

export function AsciiBackground({ themeId }: AsciiBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const stopFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Stop any previous running animation
    if (stopFnRef.current) {
      stopFnRef.current();
      stopFnRef.current = null;
    }

    if (themeId === "default") {
      return;
    }

    const currentTheme = THEME_LIST.find((t) => t.id === themeId);
    const pieceSlug = currentTheme?.pieceSlug;
    if (!pieceSlug) {
      return;
    }

    let isCancelled = false;

    async function startPlayback() {
      try {
        const { play } = await import("ascii-magic-art/runtime/player.js");

        let pieceModule: any;
        if (pieceSlug === "autumn-pagoda-maples") {
          pieceModule = await import("ascii-magic-art/pieces/autumn-pagoda-maples.js");
        } else if (pieceSlug === "bamboo-raft-karsts") {
          pieceModule = await import("ascii-magic-art/pieces/bamboo-raft-karsts.js");
        } else if (pieceSlug === "harbour-neon-skyline") {
          pieceModule = await import("ascii-magic-art/pieces/harbour-neon-skyline.js");
        }

        if (isCancelled || !preRef.current || !pieceModule) {
          return;
        }

        // Clean any existing canvas before starting
        const preEl = preRef.current as any;
        if (preEl._canvas) {
          preEl._canvas.remove();
          preEl._canvas = null;
        }

        const stop = play(preRef.current, pieceModule, {
          speed: 1,
        });

        stopFnRef.current = () => {
          stop();
          if (preRef.current && (preRef.current as any)._canvas) {
            (preRef.current as any)._canvas.remove();
            (preRef.current as any)._canvas = null;
          }
        };
      } catch (err) {
        console.warn("Failed to load ASCII art background piece:", err);
      }
    }

    startPlayback();

    return () => {
      isCancelled = true;
      if (stopFnRef.current) {
        stopFnRef.current();
        stopFnRef.current = null;
      }
    };
  }, [themeId]);

  if (themeId === "default") {
    return null;
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 flex items-center justify-center opacity-25 transition-opacity duration-700"
    >
      <pre
        ref={preRef}
        className="font-mono text-[9px] sm:text-[11px] md:text-[12px] leading-none m-0 p-0 text-center"
      />
    </div>
  );
}
