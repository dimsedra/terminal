"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { SpinningAsciiEds } from "./SpinningAsciiEds";
import { PORTFOLIO_DATA } from "@/data/portfolioData";
import { StreamingTerminalOutput, OutputPayload } from "./StreamingTerminalOutput";
import { AiNoticeToast } from "./AiNoticeToast";
import { useTerminalSession } from "@/hooks/useTerminalSession";

export function TerminalInterface() {
  const [inputVal, setInputVal] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeAiOutputId, setActiveAiOutputId] = useState<string | null>(null);
  const [showAiNotice, setShowAiNotice] = useState(false);
  const [isAiSession, setIsAiSession] = useState(false);
  const hasShownNoticeRef = useRef(false);
  const lastAssistantIdRef = useRef<string | null>(null);
  const isAwaitingNewAssistantRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.innerWidth < 640) {
        setSidebarOpen(false);
      }
      hasShownNoticeRef.current = Boolean(
        sessionStorage.getItem("eds_ai_notice_shown")
      );
      const savedSession = sessionStorage.getItem("eds_is_ai_session");
      if (savedSession === "true") {
        setIsAiSession(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);


  const { messages, sendMessage, status, setMessages, error } = useChat();


  const {
    history,
    commandHistory,
    activeStreamingId,
    scrollContainerRef,
    bottomRef,
    appendInteraction,
    updateMessagePayload,
    clearSession,
    handleStreamComplete,
    scrollToBottom,
  } = useTerminalSession();

  const isFase2 = history.length > 0;

  // Keep focus on input
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Strictly bind viewport to bottom whenever content height grows
  useEffect(() => {
    const el = contentWrapperRef.current;
    const container = scrollContainerRef.current;
    if (!el || !container) return;

    const observer = new ResizeObserver(() => {
      container.scrollTop = container.scrollHeight;
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [isFase2, scrollContainerRef]);

  // Keep input in view when mobile virtual keyboard opens or resizes visual viewport
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportResize = () => {
      scrollToBottom();
      if (inputRef.current) {
        inputRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };

    vv.addEventListener("resize", handleViewportResize);
    return () => vv.removeEventListener("resize", handleViewportResize);
  }, [scrollToBottom]);

  // Synchronize AI SDK streaming tokens and completion with the active terminal message
  useEffect(() => {
    if (!activeAiOutputId) return;

    if (error) {
      updateMessagePayload(activeAiOutputId, {
        type: "markdown",
        content: `### AI Assistant Temporarily Unavailable\n\nThe AI assistant is currently experiencing high demand or a temporary rate limit.\n\nPlease wait a few moments and try again. Alternatively, type \`/exit\` to return to the standard terminal and explore via \`/projects\`, \`/skills\`, \`/about\`, or \`/contact\`.`,
        isLiveStream: true,
        isDone: true,
      });
      isAwaitingNewAssistantRef.current = false;
      handleStreamComplete(activeAiOutputId);
      setActiveAiOutputId(null);
      return;
    }

    const lastMsg = messages[messages.length - 1];

    // If waiting for the new assistant turn, ignore past messages from earlier turns
    if (isAwaitingNewAssistantRef.current) {
      if (
        !lastMsg ||
        lastMsg.role !== "assistant" ||
        lastMsg.id === lastAssistantIdRef.current
      ) {
        return;
      }
      isAwaitingNewAssistantRef.current = false;
      lastAssistantIdRef.current = lastMsg.id;
    }

    if (
      lastMsg &&
      lastMsg.role === "assistant" &&
      lastMsg.id === lastAssistantIdRef.current
    ) {
      const fullText = lastMsg.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("");

      const isCompleted = status === "ready";

      updateMessagePayload(activeAiOutputId, {
        type: "markdown",
        content: fullText,
        isLiveStream: true,
        isDone: isCompleted,
      });

      if (isCompleted) {
        handleStreamComplete(activeAiOutputId);
        setActiveAiOutputId(null);
      }
    }
  }, [messages, status, error, activeAiOutputId]);

  const handleCommandExecution = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    setHistoryIndex(-1);
    const cmdLower = trimmed.toLowerCase();

    // 1. Universal Exit / Reset: exits current session and returns to clean home
    if (cmdLower === "/exit" || cmdLower === "/clear") {
      clearSession();
      setMessages([]);
      setActiveAiOutputId(null);
      setIsAiSession(false);
      lastAssistantIdRef.current = null;
      isAwaitingNewAssistantRef.current = false;
      try {
        sessionStorage.removeItem("eds_is_ai_session");
      } catch (e) {
        // ignore
      }
      setInputVal("");
      return;
    }

    // 2. Entering AI Session via bare /chat
    if (cmdLower === "/chat") {
      // Clear previous CLI shell output so the AI session starts with a clean slate
      clearSession();
      setMessages([]);
      setIsAiSession(true);
      lastAssistantIdRef.current = null;
      isAwaitingNewAssistantRef.current = true;
      try {
        sessionStorage.setItem("eds_is_ai_session", "true");
      } catch (e) {
        // ignore
      }

      // Fire sequential pop-up notice once per session
      if (!hasShownNoticeRef.current) {
        hasShownNoticeRef.current = true;
        setShowAiNotice(true);
        try {
          sessionStorage.setItem("eds_ai_notice_shown", "true");
        } catch (e) {
          // ignore
        }
      }

      // Append initial /chat entry and immediately stream AI's greeting
      const outId = appendInteraction("/chat", {
        type: "markdown",
        content: "",
        isLiveStream: true,
        isDone: false,
      });

      setActiveAiOutputId(outId);
      sendMessage({
        text: "Hi! I just activated this interactive session. Please introduce yourself warmly and let me know how we can explore Eds's work and background.",
      });
      setInputVal("");
      return;
    }

    // 3. Inside Active AI Session: all messages and preset commands route to AI for dynamic synthesis
    if (isAiSession) {
      let promptToSend = trimmed;

      if (cmdLower === "/projects" || cmdLower === "/project") {
        promptToSend = "Can you casually introduce Eds's featured projects and share what he's been building recently?";
      } else if (cmdLower === "/skills") {
        promptToSend = "What are Eds's core engineering strengths and the tech stack he enjoys working with the most?";
      } else if (cmdLower === "/about") {
        promptToSend = "Can you tell me a bit about Eds, his mindset as a systems thinker, and what drives his engineering work?";
      } else if (cmdLower === "/contact") {
        promptToSend = "What's the best way to get in touch, reach out, or collaborate with Eds?";
      } else if (cmdLower === "/help") {
        const payload: OutputPayload = {
          type: "markdown",
          content: `### Interactive AI Session Commands\n\n- \`/exit\` — Exit AI session and return to terminal home\n- \`/projects\` — Ask AI to synthesize Eds's projects\n- \`/skills\` — Ask AI to synthesize technical capabilities\n- \`/about\` — Ask AI about Eds's background\n- \`/contact\` — Ask AI for touchpoints\n\n_Or simply ask any question directly in everyday language._`,
        };
        appendInteraction(trimmed, payload);
        setInputVal("");
        return;
      }

      const outId = appendInteraction(trimmed, {
        type: "markdown",
        content: "",
        isLiveStream: true,
        isDone: false,
      });

      isAwaitingNewAssistantRef.current = true;
      setActiveAiOutputId(outId);
      sendMessage({ text: promptToSend });
      setInputVal("");
      return;
    }


    // 4. Non-AI CLI Shell: Deterministic slash commands
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
      className="w-full h-[100dvh] flex flex-col bg-[#0A0A0A] cursor-text select-text overflow-hidden"
    >
      {/* Top Title Bar */}
      <header className="shrink-0 w-full px-3 sm:px-6 py-2.5 bg-[#050505] border-b border-[#171717] select-none flex items-center justify-between z-20">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="flex items-center space-x-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
          </div>

          {/* Sidebar Toggle Button (active in Fase 2) */}
          {isFase2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="text-xs px-2 py-0.5 rounded bg-[#141414] hover:bg-[#1F1F1F] text-[#9E9EA5] hover:text-[#9AE6B4] border border-[#262626] transition-colors cursor-pointer font-mono shrink-0"
              title="Toggle sidebar"
            >
              <span className="sm:hidden">{sidebarOpen ? "[sidebar: ×]" : "[sidebar]"}</span>
              <span className="hidden sm:inline">{sidebarOpen ? "[sidebar: on]" : "[sidebar: off]"}</span>
            </button>
          )}

          <span className="text-xs text-[#66666E] tracking-wide font-medium flex items-center space-x-1.5 truncate">
            <span className="sm:hidden">eds:~</span>
            <span className="hidden sm:inline">eds@terminal-portfolio:~</span>
            {isAiSession && (
              <span className="text-[#9AE6B4] font-semibold text-[11px] shrink-0">[ai-session]</span>
            )}
          </span>
        </div>

        <div className="text-xs text-[#52525B] tracking-wider uppercase font-mono hidden sm:block shrink-0">
          agentic-cli
        </div>
      </header>

      {/* Main Workspace */}
      {!isFase2 ? (
        /* FASE 1: Welcoming Landing View */
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col justify-center items-center px-4 py-8">
            <div className="max-w-2xl w-full text-center space-y-4">
              {/* Large Centered 3D Spinning ASCII EDS */}
              <div className="py-2">
                <SpinningAsciiEds compact={false} />
              </div>

              <div className="space-y-2">
                <h1 className="text-base sm:text-lg text-[#F4F4F5] font-semibold tracking-wide">
                  DIMAS EDRA AR RAFI (EDS)
                </h1>
                <p className="text-xs sm:text-sm text-[#8E8E93]">
                  AI-Assisted Software Engineer & Systems Thinker
                </p>
                <p className="text-xs sm:text-sm text-[#52525B] pt-2">
                  Type a command or click a shortcut to explore:
                </p>

                <div className="flex flex-wrap justify-center gap-2 pt-2 text-xs sm:text-sm">
                  {["/chat", "/projects", "/about", "/skills", "/contact"].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCommandExecution(cmd);
                      }}
                      className="px-3 py-1 bg-[#141414] text-[#9AE6B4] hover:bg-[#1F1F1F] border border-[#262626] rounded-md transition-colors cursor-pointer"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Input Prompt for Fase 1 */}
          <footer className="shrink-0 w-full bg-[#050505] border-t border-[#171717] px-4 sm:px-8 py-3.5 z-10">
            <div className="max-w-5xl mx-auto flex items-center space-x-3">
              <span className="text-[#9AE6B4] font-bold text-base sm:text-lg select-none">❯</span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  requestAnimationFrame(() => {
                    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  });
                }}
                placeholder="Type /chat, /projects, or /help..."
                autoFocus
                spellCheck={false}

                autoComplete="off"
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#F4F4F5] text-sm font-mono placeholder:text-[#52525B]"
              />
              <div className="text-xs text-[#44444A] select-none hidden sm:block">
                [Enter: run | ↑↓: history]
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* FASE 2: Active Workspace */
        <div className="relative flex-1 min-h-0 flex overflow-hidden w-full">
          {/* Backdrop on Mobile when Sidebar is Open */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 sm:hidden"
            />
          )}

          {/* Left Sidebar: Offcanvas drawer on mobile, static side column on desktop */}
          {sidebarOpen && (
            <aside className="fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] sm:static sm:z-auto sm:w-64 md:w-72 bg-[#080808] border-r border-[#171717] flex flex-col justify-between select-none shrink-0 h-full transition-all duration-200 shadow-2xl sm:shadow-none">
              <div className="overflow-y-auto p-4 space-y-4">
                {/* Mobile Drawer Header with Close Button */}
                <div className="flex items-center justify-between sm:hidden pb-2 border-b border-[#171717]">
                  <span className="text-xs font-mono text-[#52525B] uppercase tracking-wider">Navigation</span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-xs text-[#9E9EA5] hover:text-[#9AE6B4] px-1.5 py-0.5 rounded border border-[#262626] font-mono cursor-pointer"
                  >
                    [close ×]
                  </button>
                </div>

                {/* Sidebar Header: Compact 3D Spinning ASCII EDS */}
                <div className="border-b border-[#171717] pb-3 text-center">
                  <SpinningAsciiEds compact={true} />
                  <p className="text-xs font-semibold text-[#F4F4F5] pt-1">
                    DIMAS EDRA AR RAFI
                  </p>
                  <p className="text-[11px] text-[#8E8E93]">AI-Assisted Engineer</p>
                </div>

                {/* Quick Navigation Commands */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] text-[#52525B] uppercase tracking-wider px-2 font-medium">
                    Commands
                  </p>
                  <div className="space-y-1 text-xs">
                    {PORTFOLIO_DATA.commands.map((cmd) => (
                      <button
                        key={cmd.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCommandExecution(cmd.name);
                          if (typeof window !== "undefined" && window.innerWidth < 640) {
                            setSidebarOpen(false);
                          }
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#141414] text-left transition-colors cursor-pointer group"
                      >
                        <span className="text-[#9AE6B4] font-medium group-hover:underline">
                          {cmd.name}
                        </span>
                        <span className="text-[10px] text-[#52525B] truncate max-w-[120px]">
                          {cmd.desc.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Touchpoints / Links */}
                <div className="space-y-1.5 pt-2 border-t border-[#171717]">
                  <p className="text-[10px] text-[#52525B] uppercase tracking-wider px-2 font-medium">
                    Links
                  </p>
                  <div className="space-y-1 text-xs">
                    <a
                      href={PORTFOLIO_DATA.author.links.github}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-2.5 py-1 text-[#9E9EA5] hover:text-[#9AE6B4] transition-colors"
                    >
                      github.com ↗
                    </a>
                    <a
                      href={PORTFOLIO_DATA.author.links.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-2.5 py-1 text-[#9E9EA5] hover:text-[#9AE6B4] transition-colors"
                    >
                      linkedin.com ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer Hint */}
              <div className="p-3 border-t border-[#171717] text-[10px] text-[#44444A]">
                terminal portfolio v1.0
              </div>
            </aside>
          )}

          {/* Right Main CLI Pane (Always full width on mobile) */}
          <main className="flex-1 min-h-0 min-w-0 flex flex-col bg-[#0A0A0A] w-full">
            {/* The Bounded Chat Viewport */}
            <div
              ref={scrollContainerRef}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full"
            >
              <div
                ref={contentWrapperRef}
                className="w-full px-3.5 sm:px-8 py-4 sm:py-5 space-y-4"
              >
                {history.map((msg) => {
                  const isStreaming = msg.id === activeStreamingId;
                  return (
                    <div key={msg.id} className="space-y-1.5 font-mono">
                      {msg.type === "user" ? (
                        <div className="flex items-center space-x-2.5 text-sm">
                          <span className="text-[#9AE6B4] font-bold">❯</span>
                          <span className="text-[#F4F4F5] font-medium">{msg.command}</span>
                        </div>
                      ) : (
                        <div className="pl-3 sm:pl-5 border-l-2 border-[#1F1F1F]">
                          {msg.payload && (
                            <StreamingTerminalOutput
                              payload={msg.payload}
                              alreadyFinished={!isStreaming}
                              onComplete={() => {
                                handleStreamComplete(msg.id);
                                scrollToBottom();
                              }}
                              onRunCommand={(c) => handleCommandExecution(c)}
                              onScroll={scrollToBottom}
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

            {/* Input Prompt Bar for Fase 2 */}
            <footer className="shrink-0 w-full bg-[#050505] border-t border-[#171717] px-3.5 sm:px-8 py-3.5 z-10">
              <div className="w-full flex items-center space-x-2.5 sm:space-x-3">
                <span className="text-[#9AE6B4] font-bold text-sm sm:text-base select-none shrink-0">❯</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    requestAnimationFrame(() => {
                      scrollToBottom();
                      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    });
                  }}
                  placeholder={
                    isAiSession
                      ? "Ask anything (or /exit to return)..."
                      : "Type /chat, /projects, or /help..."
                  }
                  autoFocus
                  spellCheck={false}

                  autoComplete="off"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#F4F4F5] text-sm font-mono placeholder:text-[#52525B]"
                />
                <div className="text-xs text-[#44444A] select-none hidden sm:block shrink-0">
                  [Enter: run | ↑↓: history]
                </div>
              </div>
            </footer>
          </main>
        </div>
      )}
      {/* Sequential Toast Notice: 3s step 1, 3s step 2 (fires once per session) */}
      <AiNoticeToast
        isOpen={showAiNotice}
        onClose={() => setShowAiNotice(false)}
      />
    </div>
  );
}

