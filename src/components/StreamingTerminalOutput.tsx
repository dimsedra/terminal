"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Streamdown } from "streamdown";
import {
  PORTFOLIO_DATA,
  getHelpMarkdown,
  getAboutMarkdown,
  getProjectsMarkdown,
  getSkillsMarkdown,
  getContactMarkdown,
  getChatPlaceholderMarkdown,
} from "@/data/portfolioData";
import {
  formatContributionGrid,
  parseContributionsApiResponse,
  resolveMaxColumnsForViewport,
  type ParsedContributionsResponse,
} from "@/content/contributions";

type ContributionsViewState =
  | { status: "loading" }
  | ParsedContributionsResponse;

function renderAboutContributions(
  contributionsState: ContributionsViewState,
  maxColumns: number
): React.ReactNode {
  if (contributionsState.status === "loading") {
    return (
      <div className="mt-4 text-xs text-[#52525B] font-mono">
        [fetching github contributions...]
      </div>
    );
  }

  if (contributionsState.status === "offline") {
    return (
      <div className="mt-4 text-xs text-[#52525B] font-mono">
        [github contributions offline]
      </div>
    );
  }

  const grid = formatContributionGrid({
    weeks: contributionsState.weeks,
    totalContributions: contributionsState.totalContributions,
    maxColumns,
  });

  if (!grid) {
    return (
      <div className="mt-4 text-xs text-[#52525B] font-mono">
        [github contributions offline]
      </div>
    );
  }

  return (
    <div className="mt-4 w-fit max-w-full bg-[#0A0A0A]/90 border border-[#1F1F1F] rounded-md px-3.5 py-3 space-y-2.5 font-mono">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <span className="text-xs font-semibold text-[#9AE6B4] tracking-wide">
          GitHub Contributions
        </span>
        <span className="text-xs text-[#A1A1AA]">{grid.summaryText}</span>
      </div>

      <div
        role="img"
        aria-label={`GitHub contribution graph showing ${grid.summaryText}`}
        className="text-xs leading-[1.35] select-none overflow-hidden"
      >
        {grid.rows.map((row) => (
          <div key={row.weekday} className="flex items-center whitespace-pre">
            <span className="text-[#8E8E93] w-8 shrink-0 inline-block text-[11px]">
              {row.label}
            </span>
            <span className="tracking-[0.18em]">
              {row.cells.map((cell, colIdx) => (
                <span
                  key={`${row.weekday}-${colIdx}`}
                  style={{ color: cell.colorHex }}
                  title={
                    cell.date
                      ? `${cell.count} contribution${cell.count === 1 ? "" : "s"} on ${cell.date}`
                      : undefined
                  }
                >
                  {cell.glyph}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 text-[11px] text-[#8E8E93] pt-0.5">
        <span>
          {grid.displayedWeeks < 52
            ? `latest ${grid.displayedWeeks} weeks`
            : "last 52 weeks"}
        </span>
        <div className="flex items-center space-x-1.5">
          <span>Less</span>
          <span className="tracking-[0.18em]">
            {grid.legend.map((item) => (
              <span key={item.level} style={{ color: item.colorHex }}>
                {item.glyph}
              </span>
            ))}
          </span>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export type OutputPayload =
  | { type: "help" }
  | { type: "about" }
  | { type: "projects" }
  | { type: "skills" }
  | { type: "contact" }
  | { type: "chat"; query?: string }
  | { type: "markdown"; content: string; isLiveStream?: boolean; isDone?: boolean }
  | { type: "text"; text: string; actionCmd?: string };

interface StreamingTerminalOutputProps {
  payload: OutputPayload;
  onScroll?: () => void;
  onRunCommand?: (cmd: string) => void;
  onComplete?: () => void;
  alreadyFinished?: boolean;
}

export function StreamingTerminalOutput({
  payload,
  onScroll,
  onRunCommand,
  onComplete,
  alreadyFinished = false,
}: StreamingTerminalOutputProps) {
  const scrollCbRef = useRef(onScroll);
  scrollCbRef.current = onScroll;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onRunCommandRef = useRef(onRunCommand);
  onRunCommandRef.current = onRunCommand;

  const isLiveStream = payload.type === "markdown" && Boolean(payload.isLiveStream);

  // Resolve payload into full Markdown string
  const fullMarkdown = useMemo(() => {
    switch (payload.type) {
      case "help":
        return getHelpMarkdown();
      case "about":
        return getAboutMarkdown();
      case "projects":
        return getProjectsMarkdown();
      case "skills":
        return getSkillsMarkdown();
      case "contact":
        return getContactMarkdown();
      case "chat":
        return getChatPlaceholderMarkdown(payload.query);
      case "markdown":
        return payload.content;
      case "text":
        if (payload.actionCmd) {
          return `${payload.text}\n\nType \`${payload.actionCmd}\` to see available commands.`;
        }
        return payload.text;
    }
  }, [payload]);

  // Tokenize full markdown into streaming pieces for local deterministic commands
  const tokens = useMemo(() => {
    if (isLiveStream) return [];
    return fullMarkdown.split(/(\s+)/);
  }, [fullMarkdown, isLiveStream]);

  const [tokenIndex, setTokenIndex] = useState<number>(alreadyFinished ? 999999 : 0);
  const [isLocalDone, setIsLocalDone] = useState<boolean>(alreadyFinished);
  const [contributionsState, setContributionsState] = useState<ContributionsViewState>({
    status: "loading",
  });
  const [maxColumns, setMaxColumns] = useState<number>(52);

  useEffect(() => {
    if (payload.type !== "about") return;

    const syncViewportColumns = () => {
      setMaxColumns(resolveMaxColumnsForViewport(window.innerWidth));
    };

    syncViewportColumns();
    window.addEventListener("resize", syncViewportColumns);
    return () => window.removeEventListener("resize", syncViewportColumns);
  }, [payload.type]);

  useEffect(() => {
    if (payload.type !== "about") return;

    const controller = new AbortController();

    fetch("/api/github-contributions", { signal: controller.signal })
      .then((res) => res.json())
      .then((rawJson: unknown) => {
        setContributionsState(parseContributionsApiResponse(rawJson));
        scrollCbRef.current?.();
      })
      .catch(() => {
        setContributionsState({ status: "offline", reason: "NETWORK_ERROR" });
      });

    return () => controller.abort();
  }, [payload.type]);

  useEffect(() => {
    if (isLiveStream || alreadyFinished) {
      setIsLocalDone(true);
      return;
    }

    let current = 0;
    // Fast word-by-word streaming interval for authentic CLI feel
    const intervalTime = 16;

    const timer = setInterval(() => {
      current++;
      setTokenIndex(current);

      if (current >= tokens.length) {
        clearInterval(timer);
        setIsLocalDone(true);
        onCompleteRef.current?.();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [alreadyFinished, tokens.length, isLiveStream]);

  // Keep scroll container pinned to bottom as new tokens arrive (local or live stream)
  useEffect(() => {
    if (!alreadyFinished) {
      requestAnimationFrame(() => {
        scrollCbRef.current?.();
      });
      const t = setTimeout(() => {
        scrollCbRef.current?.();
      }, 25);
      return () => clearTimeout(t);
    }
  }, [tokenIndex, alreadyFinished, payload]);

  const isDone = isLiveStream
    ? alreadyFinished || Boolean((payload as any).isDone)
    : alreadyFinished || isLocalDone || tokenIndex >= tokens.length;

  const currentStreamedText = useMemo(() => {
    if (isLiveStream) {
      return (payload as any).content || "";
    }
    if (alreadyFinished || isDone || tokenIndex >= tokens.length) {
      return fullMarkdown;
    }
    return tokens.slice(0, tokenIndex).join("");
  }, [alreadyFinished, isDone, tokenIndex, tokens, fullMarkdown, isLiveStream, payload]);


  // Custom Streamdown component mapping tailored for our dark terminal aesthetics
  const components = useMemo(() => {
    return {
      h1: ({ children, ...props }: React.ComponentProps<"h1">) => (
        <h1 className="text-base font-semibold text-[#F4F4F5] mt-5 mb-2.5" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: React.ComponentProps<"h2">) => (
        <h2 className="text-sm sm:text-base font-semibold text-[#F4F4F5] mt-4 mb-2" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: React.ComponentProps<"h3">) => (
        <h3 className="text-sm font-semibold text-[#9AE6B4] tracking-wide mt-4 mb-2" {...props}>
          {children}
        </h3>
      ),
      p: ({ children, ...props }: React.ComponentProps<"p">) => (
        <p className="text-sm text-[#D4D4D8] leading-[1.7] my-3.5 sm:my-4" {...props}>
          {children}
        </p>
      ),
      ul: ({ children, ...props }: React.ComponentProps<"ul">) => (
        <ul className="space-y-2.5 my-3.5 list-none pl-0" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: React.ComponentProps<"ol">) => (
        <ol className="space-y-2 my-3.5 pl-4 list-decimal text-sm text-[#D4D4D8]" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }: React.ComponentProps<"li">) => (
        <li className="text-sm text-[#D4D4D8] leading-[1.65]" {...props}>
          {children}
        </li>
      ),
      strong: ({ children, ...props }: React.ComponentProps<"strong">) => (
        <strong className="font-semibold text-[#F4F4F5]" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }: React.ComponentProps<"em">) => (
        <em className="text-[#A1A1AA] italic text-sm" {...props}>
          {children}
        </em>
      ),
      blockquote: ({ children, ...props }: React.ComponentProps<"blockquote">) => (
        <blockquote className="border-l-2 border-[#9AE6B4]/60 pl-3 my-3.5 text-xs text-[#9E9EA5] leading-[1.65]" {...props}>
          {children}
        </blockquote>
      ),
      a: ({ href, children, ...props }: React.ComponentProps<"a">) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#9AE6B4] hover:underline cursor-pointer transition-colors"
          {...props}
        >
          {children}
        </a>
      ),
      code: ({ children, className, ...props }: React.ComponentProps<"code">) => {
        const text = String(children).trim();
        // If it represents a slash command like `/projects` or `/help`
        if (text.startsWith("/")) {
          return (
            <code
              onClick={() => onRunCommandRef.current?.(text)}
              className="px-1.5 py-0.5 rounded bg-[#141414] text-[#9AE6B4] text-xs border border-[#1F1F1F] cursor-pointer hover:border-[#9AE6B4]/50 transition-colors inline-block"
              title={`Run ${text}`}
              {...props}
            >
              {children}
            </code>
          );
        }
        return (
          <code
            className="px-1.5 py-0.5 rounded bg-[#141414] text-[#D4D4D8] text-xs border border-[#1F1F1F]"
            {...props}
          >
            {children}
          </code>
        );
      },
    };
  }, []);

  return (
    <div className="text-sm text-[#D4D4D8] py-1 streamdown-output">
      <Streamdown
        mode="streaming"
        components={components}
        className="space-y-0.5"
      >
        {currentStreamedText}
      </Streamdown>
      {isDone &&
        payload.type === "about" &&
        renderAboutContributions(contributionsState, maxColumns)}
      {!isDone && <span className="terminal-cursor">▋</span>}
    </div>
  );
}
