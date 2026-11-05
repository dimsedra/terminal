"use client";

import React, { useEffect, useRef } from "react";
import { ThemeId, THEME_LIST } from "@/content/themes";

interface AsciiBackgroundProps {
  themeId: ThemeId;
}

const ASCII_CELL_WIDTH_RATIO = 0.6;

function syncCoverFontSize(
  containerEl: HTMLElement,
  preEl: HTMLPreElement,
  cols: number,
  rows: number
) {
  const rect = containerEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const minPxForWidth = rect.width / (cols * ASCII_CELL_WIDTH_RATIO);
  const minPxForHeight = rect.height / (rows * ASCII_CELL_WIDTH_RATIO);
  const coverFontSizePx = Math.max(10, Math.ceil(Math.max(minPxForWidth, minPxForHeight)));

  preEl.style.fontSize = `${coverFontSizePx}px`;
}

async function loadPieceModule(pieceSlug: string) {
  if (pieceSlug === "autumn-pagoda-maples") {
    return import("ascii-magic-art/pieces/autumn-pagoda-maples.js");
  }
  if (pieceSlug === "bamboo-raft-karsts") {
    return import("ascii-magic-art/pieces/bamboo-raft-karsts.js");
  }
  if (pieceSlug === "harbour-neon-skyline") {
    return import("ascii-magic-art/pieces/harbour-neon-skyline.js");
  }
  return null;
}

export function AsciiBackground({ themeId }: AsciiBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const stopFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (stopFnRef.current) {
      stopFnRef.current();
      stopFnRef.current = null;
    }

    if (themeId === "default") return;

    const currentTheme = THEME_LIST.find((t) => t.id === themeId);
    const pieceSlug = currentTheme?.pieceSlug;
    if (!pieceSlug) return;

    let isCancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function startPlayback(slug: string) {
      try {
        const [{ play }, pieceModule] = await Promise.all([
          import("ascii-magic-art/runtime/player.js"),
          loadPieceModule(slug),
        ]);

        const containerEl = containerRef.current;
        const preEl = preRef.current as (HTMLPreElement & { _canvas?: HTMLCanvasElement | null }) | null;
        if (isCancelled || !containerEl || !preEl || !pieceModule) return;

        if (preEl._canvas) {
          preEl._canvas.remove();
          preEl._canvas = null;
        }

        const cols = pieceModule.meta?.cols ?? 192;
        const rows = pieceModule.meta?.rows ?? 108;

        syncCoverFontSize(containerEl, preEl, cols, rows);

        resizeObserver = new ResizeObserver(() => {
          syncCoverFontSize(containerEl, preEl, cols, rows);
        });
        resizeObserver.observe(containerEl);

        const stop = play(preEl, pieceModule, { speed: 1 });

        stopFnRef.current = () => {
          stop();
          resizeObserver?.disconnect();
          if (preEl._canvas) {
            preEl._canvas.remove();
            preEl._canvas = null;
          }
        };
      } catch (err) {
        console.warn("Failed to load ASCII art background piece:", err);
      }
    }

    startPlayback(pieceSlug);

    return () => {
      isCancelled = true;
      resizeObserver?.disconnect();
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
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 flex items-center justify-center opacity-20 transition-opacity duration-500 [&_canvas]:!w-full [&_canvas]:!h-full [&_canvas]:!max-w-none [&_canvas]:object-cover"
    >
      <pre
        ref={preRef}
        className="font-mono leading-none m-0 p-0 text-center"
      />
    </div>
  );
}
