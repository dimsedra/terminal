"use client";

import React, { useState, useRef, useEffect } from "react";
import { SpinningAsciiEds } from "./SpinningAsciiEds";
import { PORTFOLIO_DATA } from "@/data/portfolioData";
import { StreamingTerminalOutput, OutputPayload } from "./StreamingTerminalOutput";

interface TerminalMessage {
  id: string;
  type: "user" | "output";
  command?: string;
  payload?: OutputPayload;
}

const STORAGE_HISTORY_KEY = "eds_terminal_history_v1";
const STORAGE_CMD_HISTORY_KEY = "eds_command_history_v1";

export function TerminalInterface() {
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<TerminalMessage[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeStreamingId, setActiveStreamingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRestoring = useRef(true);

  // Restore history from sessionStorage on client mount
  useEffect(() => {
    try {
      const savedHistory = sessionStorage.getItem(STORAGE_HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          // Go straight to the most recent position immediately
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          });
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          }, 30);
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          }, 120);
        }
      }
      const savedCmdHistory = sessionStorage.getItem(STORAGE_CMD_HISTORY_KEY);
      if (savedCmdHistory) {
        setCommandHistory(JSON.parse(savedCmdHistory));
      }
    } catch (e) {
      console.error("Failed to restore terminal session", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save history to sessionStorage whenever it changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    try {
      if (history.length > 0) {
        sessionStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
      } else {
        sessionStorage.removeItem(STORAGE_HISTORY_KEY);
      }
    } catch (e) {
      console.error("Failed to save terminal history to session", e);
    }
  }, [history, isInitialized]);

  // Save command history to sessionStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      if (commandHistory.length > 0) {
        sessionStorage.setItem(STORAGE_CMD_HISTORY_KEY, JSON.stringify(commandHistory));
      }
    } catch (e) {
      console.error("Failed to save command history to session", e);
    }
  }, [commandHistory, isInitialized]);

  // Auto-scroll on new message
  useEffect(() => {
    if (isRestoring.current) {
      if (history.length > 0 && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
      isRestoring.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Keep focus on input
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleCommandExecution = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    // Add to command history for arrow navigation
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const userMsgId = `user-${Date.now()}`;
    const userMsg: TerminalMessage = {
      id: userMsgId,
      type: "user",
      command: trimmed,
    };

    const cmdLower = trimmed.toLowerCase();

    // Deterministic command routing
    if (cmdLower === "/clear") {
      setHistory([]);
      setInputVal("");
      try {
        sessionStorage.removeItem(STORAGE_HISTORY_KEY);
      } catch (e) {
        // ignore
      }
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

    const outputMsgId = `out-${Date.now()}`;
    const outputMsg: TerminalMessage = {
      id: outputMsgId,
      type: "output",
      payload,
    };

    setActiveStreamingId(outputMsgId);
    setHistory((prev) => [...prev, userMsg, outputMsg]);
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
                        onComplete={() => {
                          if (msg.id === activeStreamingId) {
                            setActiveStreamingId(null);
                          }
                        }}
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
