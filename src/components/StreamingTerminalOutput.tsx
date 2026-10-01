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
        <h1 className="text-base font-semibold text-[#F4F4F5] mt-3 mb-2" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: React.ComponentProps<"h2">) => (
        <h2 className="text-sm sm:text-base font-semibold text-[#F4F4F5] mt-3 mb-1.5" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: React.ComponentProps<"h3">) => (
        <h3 className="text-sm font-semibold text-[#9AE6B4] tracking-wide mt-2.5 mb-1.5" {...props}>
          {children}
        </h3>
      ),
      p: ({ children, ...props }: React.ComponentProps<"p">) => (
        <p className="text-sm text-[#D4D4D8] leading-relaxed my-1.5" {...props}>
          {children}
        </p>
      ),
      ul: ({ children, ...props }: React.ComponentProps<"ul">) => (
        <ul className="space-y-2 my-2 list-none pl-0" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: React.ComponentProps<"ol">) => (
        <ol className="space-y-1.5 my-2 pl-4 list-decimal text-sm text-[#D4D4D8]" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }: React.ComponentProps<"li">) => (
        <li className="text-sm text-[#D4D4D8] leading-relaxed" {...props}>
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
        <blockquote className="border-l-2 border-[#9AE6B4]/60 pl-3 my-2 text-xs text-[#9E9EA5]" {...props}>
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
    <div className="text-sm text-[#D4D4D8] py-1 leading-relaxed streamdown-output">
      <Streamdown
        mode="streaming"
        components={components}
        className="space-y-1"
      >
        {currentStreamedText}
      </Streamdown>
      {!isDone && <span className="terminal-cursor">▋</span>}
    </div>
  );
}
