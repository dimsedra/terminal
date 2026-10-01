"use client";

import React, { useState, useRef } from "react";
import { SpinningAsciiEds } from "./SpinningAsciiEds";
import { PORTFOLIO_DATA } from "@/data/portfolioData";
import { StreamingTerminalOutput, OutputPayload } from "./StreamingTerminalOutput";
import { useTerminalSession } from "@/hooks/useTerminalSession";

export function TerminalInterface() {
  const [inputVal, setInputVal] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    history,
    commandHistory,
    activeStreamingId,
    scrollContainerRef,
    bottomRef,
    appendInteraction,
    clearSession,
    handleStreamComplete,
  } = useTerminalSession();

  // Keep focus on input
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleCommandExecution = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    setHistoryIndex(-1);
    const cmdLower = trimmed.toLowerCase();

    // Deterministic command routing
    if (cmdLower === "/clear") {
      clearSession();
      setInputVal("");
      return;
    }

    let payload: OutputPayload;

    if (cmdLower === "/help") {
      payload = { type: "help" };
    } else if (cmdLower === "/about") {
      payload = { type: "about" };
    } else if (cmdLower === "/projects" || cmdLower === "/project") {
      payload = { type: "projects" };
    } else if (cmdLower === "/skills") {
      payload = { type: "skills" };
    } else if (cmdLower === "/contact") {
      payload = { type: "contact" };
    } else {
      payload = {
        type: "text",
        text: `Command not recognized: ${trimmed}`,
        actionCmd: "/help",
      };
    }

    appendInteraction(trimmed, payload);
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommandExecution(inputVal);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < commandHistory.length) {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal("");
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className="w-full h-screen flex flex-col bg-[#0E0F0E] cursor-text select-text"
    >
      {/* Terminal Title Bar */}
      <div className="w-full px-4 sm:px-8 py-2.5 bg-[#090A09] border-b border-[#1A1D19] select-none">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#272B25]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#272B25]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#272B25]" />
            <span className="text-xs text-[#656C60] ml-2 tracking-wide font-medium">
              eds@terminal-portfolio:~
            </span>
          </div>
          <div className="text-xs text-[#555A51] tracking-wider uppercase font-mono">
            agentic-cli
          </div>
        </div>
      </div>

      {/* Main Terminal Body */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-5">
          {/* 3D Spinning ASCII Art EDS */}
          <div className="py-3 border-b border-[#181B17]">
            <SpinningAsciiEds />
            <div className="text-center space-y-1.5 mt-2">
              <p className="text-sm sm:text-base text-[#F0F3EC] font-semibold tracking-wide">
                DIMAS EDRA AR RAFI (EDS)
              </p>
              <p className="text-xs sm:text-sm text-[#7E8578]">
                AI-Assisted Software Engineer & Systems Thinker
              </p>
              <p className="text-xs sm:text-sm text-[#555A51] pt-1">
                Type <span className="text-[#9AE6B4]">/help</span> to explore or click commands below:
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1.5 text-xs sm:text-sm">
                {["/about", "/projects", "/skills", "/contact", "/clear"].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCommandExecution(cmd);
                    }}
                    className="px-2.5 py-1 bg-[#141714] text-[#9AE6B4] hover:bg-[#1C201B] border border-[#212620] rounded transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Message Log */}
          {history.map((msg) => {
            const isStreaming = msg.id === activeStreamingId;
            return (
              <div key={msg.id} className="space-y-1.5 font-mono">
                {msg.type === "user" ? (
                  <div className="flex items-center space-x-2.5 text-sm sm:text-base">
                    <span className="text-[#9AE6B4] font-bold">❯</span>
                    <span className="text-[#F0F3EC] font-medium">{msg.command}</span>
                  </div>
                ) : (
                  <div className="pl-4 sm:pl-5 border-l-2 border-[#1F221E]">
                    {msg.payload && (
                      <StreamingTerminalOutput
                        payload={msg.payload}
                        alreadyFinished={!isStreaming}
                        onComplete={() => handleStreamComplete(msg.id)}
                        onRunCommand={(c) => handleCommandExecution(c)}
                        onScroll={() =>
                          bottomRef.current?.scrollIntoView({ behavior: "smooth" })
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Prompt Bar */}
      <div className="w-full bg-[#090A09] border-t border-[#1A1D19] px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center space-x-3">
          <span className="text-[#9AE6B4] font-bold text-base sm:text-lg select-none">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a slash command (e.g. /help, /projects)..."
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent border-none outline-none text-[#F0F3EC] text-sm sm:text-base font-mono placeholder:text-[#555A51]"
          />
          <div className="text-xs text-[#4A5046] select-none hidden sm:block">
            [Enter: run | ↑↓: history]
          </div>
        </div>
      </div>
    </div>
  );
}
