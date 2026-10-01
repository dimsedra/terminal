"use client";

import React, { useState, useEffect, useRef } from "react";
import { PORTFOLIO_DATA, ProjectItem } from "@/data/portfolioData";

export type OutputPayload =
  | { type: "help" }
  | { type: "about" }
  | { type: "projects" }
  | { type: "skills" }
  | { type: "contact" }
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
  // If already finished, display 100% immediately
  const [revealedIndex, setRevealedIndex] = useState<number>(alreadyFinished ? 9999 : 0);
  const [isDone, setIsDone] = useState<boolean>(alreadyFinished);
  const scrollCbRef = useRef(onScroll);
  scrollCbRef.current = onScroll;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Flatten the payload into progressive streaming steps/tokens
  const steps = React.useMemo(() => {
    switch (payload.type) {
      case "help": {
        // Step 0: header, Steps 1..N: commands
        const items = ["Available Slash Commands:"];
        PORTFOLIO_DATA.commands.forEach((c) => {
          items.push(`${c.name} - ${c.desc}`);
        });
        return items;
      }
      case "about": {
        return [
          `${PORTFOLIO_DATA.author.name} (${PORTFOLIO_DATA.author.callsign})`,
          PORTFOLIO_DATA.author.role,
          PORTFOLIO_DATA.author.bio,
          `Location: ${PORTFOLIO_DATA.author.location}`,
        ];
      }
      case "projects": {
        const items = ["Featured Projects & Systems:"];
        PORTFOLIO_DATA.projects.forEach((p) => {
          items.push(p.id);
        });
        return items;
      }
      case "skills": {
        const items = ["Technical Capabilities & Tools:"];
        PORTFOLIO_DATA.skills.forEach((s) => {
          items.push(s.category);
        });
        return items;
      }
      case "contact": {
        return [
          "Get in touch with Eds:",
          `GitHub: ${PORTFOLIO_DATA.author.links.github}`,
          `LinkedIn: ${PORTFOLIO_DATA.author.links.linkedin}`,
          `Email: ${PORTFOLIO_DATA.author.links.email.replace("mailto:", "")}`,
        ];
      }
      case "text": {
        // Word-level tokens for text
        return payload.text.split(" ");
      }
    }
  }, [payload]);

  useEffect(() => {
    if (alreadyFinished) {
      setIsDone(true);
      return;
    }

    let currentIndex = 0;
    const intervalTime = payload.type === "text" ? 22 : 90; // rapid for words, slightly paced for cards

    const timer = setInterval(() => {
      currentIndex++;
      setRevealedIndex(currentIndex);

      if (currentIndex >= steps.length) {
        clearInterval(timer);
        setIsDone(true);
        onCompleteRef.current?.();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [alreadyFinished, steps.length, payload.type]);

  // Always scroll AFTER React has rendered the new token/card into the DOM
  useEffect(() => {
    if (!alreadyFinished) {
      requestAnimationFrame(() => {
        scrollCbRef.current?.();
      });
      const t = setTimeout(() => {
        scrollCbRef.current?.();
      }, 35);
      return () => clearTimeout(t);
    }
  }, [revealedIndex, alreadyFinished]);

  // Render outputs based on revealed steps
  if (payload.type === "text") {
    const revealedWords = steps.slice(0, revealedIndex).join(" ");
    return (
      <div className="text-sm text-[#8B9285] py-1 space-y-1.5 leading-relaxed">
        <p>
          <span className="text-[#D3D7CE]">{revealedWords}</span>
          {!isDone && <span className="terminal-cursor">▋</span>}
        </p>
        {isDone && payload.actionCmd && (
          <p className="pt-1">
            Type{" "}
            <button
              onClick={() => {
                if (onRunCommand && payload.actionCmd) onRunCommand(payload.actionCmd);
              }}
              className="text-[#9AE6B4] hover:underline cursor-pointer"
            >
              {payload.actionCmd}
            </button>{" "}
            to see available commands.
          </p>
        )}
      </div>
    );
  }

  if (payload.type === "help") {
    return (
      <div className="space-y-2.5 py-1 text-[#D3D7CE]">
        {revealedIndex >= 1 && (
          <p className="text-[#8B9285] text-sm flex items-center">
            <span>Available Slash Commands:</span>
            {!isDone && revealedIndex === 1 && <span className="terminal-cursor">▋</span>}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-y-2 text-sm pt-1">
          {PORTFOLIO_DATA.commands.map((cmd, idx) => {
            const isRevealed = revealedIndex >= idx + 2;
            if (!isRevealed) return null;
            const isCurrentTail = !isDone && revealedIndex === idx + 2;
            return (
              <React.Fragment key={cmd.name}>
                <span
                  onClick={() => onRunCommand?.(cmd.name)}
                  className="text-[#9AE6B4] font-medium cursor-pointer hover:underline flex items-center"
                >
                  {cmd.name}
                </span>
                <span className="text-[#8B9285] flex items-center">
                  {cmd.desc}
                  {isCurrentTail && <span className="terminal-cursor">▋</span>}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  if (payload.type === "about") {
    return (
      <div className="space-y-3.5 py-1 text-sm text-[#D3D7CE] leading-relaxed w-full">
        {revealedIndex >= 1 && (
          <div className="border-l-2 border-[#9AE6B4]/60 pl-3.5 space-y-1">
            <h2 className="text-base font-semibold text-[#F0F3EC] flex items-center">
              {PORTFOLIO_DATA.author.name}{" "}
              <span className="text-[#8B9285] font-normal text-sm ml-1.5">
                ({PORTFOLIO_DATA.author.callsign})
              </span>
              {!isDone && revealedIndex === 1 && <span className="terminal-cursor">▋</span>}
            </h2>
            {revealedIndex >= 2 && (
              <p className="text-sm text-[#9AE6B4] flex items-center">
                {PORTFOLIO_DATA.author.role}
                {!isDone && revealedIndex === 2 && <span className="terminal-cursor">▋</span>}
              </p>
            )}
          </div>
        )}

        {revealedIndex >= 3 && (
          <p className="text-[#A2A99B] text-sm leading-relaxed flex items-center flex-wrap">
            <span>{PORTFOLIO_DATA.author.bio}</span>
            {!isDone && revealedIndex === 3 && <span className="terminal-cursor">▋</span>}
          </p>
        )}

        {revealedIndex >= 4 && (
          <div className="flex items-center gap-4 pt-1 text-sm">
            <span className="text-[#656C60]">Location:</span>
            <span className="text-[#D3D7CE]">{PORTFOLIO_DATA.author.location}</span>
            {!isDone && revealedIndex >= 4 && <span className="terminal-cursor">▋</span>}
          </div>
        )}
      </div>
    );
  }

  if (payload.type === "projects") {
    return (
      <div className="space-y-3.5 py-1">
        {revealedIndex >= 1 && (
          <p className="text-[#8B9285] text-sm flex items-center">
            <span>Featured Projects & Systems:</span>
            {!isDone && revealedIndex === 1 && <span className="terminal-cursor">▋</span>}
          </p>
        )}
        <div className="space-y-3">
          {PORTFOLIO_DATA.projects.map((proj, idx) => {
            const isRevealed = revealedIndex >= idx + 2;
            if (!isRevealed) return null;
            const isTail = !isDone && revealedIndex === idx + 2;
            return (
              <div
                key={proj.id}
                className="p-3.5 bg-[#131513] border border-[#1F221E] rounded-md text-sm space-y-2 transition-all hover:border-[#2C312A] animate-in fade-in duration-300"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-[#F0F3EC] text-base flex items-center">
                    {proj.name}
                    {isTail && <span className="terminal-cursor">▋</span>}
                  </span>
                  {proj.github && (
                    <a
                      href={proj.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9AE6B4] text-sm hover:underline"
                    >
                      [view repository ↗]
                    </a>
                  )}
                </div>
                <p className="text-[#A2A99B] text-sm leading-relaxed">{proj.description}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {proj.stack.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-[#090A09] text-[#8B9285] rounded text-xs border border-[#1A1D19]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (payload.type === "skills") {
    return (
      <div className="space-y-3.5 py-1 text-sm">
        {revealedIndex >= 1 && (
          <p className="text-[#8B9285] flex items-center">
            <span>Technical Capabilities & Tools:</span>
            {!isDone && revealedIndex === 1 && <span className="terminal-cursor">▋</span>}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {PORTFOLIO_DATA.skills.map((cat, idx) => {
            const isRevealed = revealedIndex >= idx + 2;
            if (!isRevealed) return null;
            const isTail = !isDone && revealedIndex === idx + 2;
            return (
              <div
                key={cat.category}
                className="p-3 bg-[#131513] border border-[#1F221E] rounded-md space-y-2 animate-in fade-in duration-300"
              >
                <p className="font-semibold text-[#9AE6B4] text-xs uppercase tracking-wider flex items-center">
                  <span>{cat.category}</span>
                  {isTail && <span className="terminal-cursor">▋</span>}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 bg-[#090A09] text-[#A2A99B] rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (payload.type === "contact") {
    return (
      <div className="space-y-2.5 py-1 text-sm">
        {revealedIndex >= 1 && (
          <p className="text-[#8B9285] flex items-center">
            <span>Get in touch with Eds:</span>
            {!isDone && revealedIndex === 1 && <span className="terminal-cursor">▋</span>}
          </p>
        )}
        <div className="space-y-1.5 text-sm">
          {revealedIndex >= 2 && (
            <div>
              <span className="text-[#656C60] w-28 inline-block">GitHub:</span>
              <a
                href={PORTFOLIO_DATA.author.links.github}
                target="_blank"
                rel="noreferrer"
                className="text-[#9AE6B4] hover:underline"
              >
                {PORTFOLIO_DATA.author.links.github}
              </a>
              {!isDone && revealedIndex === 2 && <span className="terminal-cursor">▋</span>}
            </div>
          )}
          {revealedIndex >= 3 && (
            <div>
              <span className="text-[#656C60] w-28 inline-block">LinkedIn:</span>
              <a
                href={PORTFOLIO_DATA.author.links.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-[#9AE6B4] hover:underline"
              >
                {PORTFOLIO_DATA.author.links.linkedin}
              </a>
              {!isDone && revealedIndex === 3 && <span className="terminal-cursor">▋</span>}
            </div>
          )}
          {revealedIndex >= 4 && (
            <div>
              <span className="text-[#656C60] w-28 inline-block">Email:</span>
              <a
                href={PORTFOLIO_DATA.author.links.email}
                className="text-[#9AE6B4] hover:underline"
              >
                {PORTFOLIO_DATA.author.links.email.replace("mailto:", "")}
              </a>
              {!isDone && revealedIndex >= 4 && <span className="terminal-cursor">▋</span>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
