"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { LivingAsciiEds } from "./LivingAsciiEds";
import { AsciiBackground } from "./AsciiBackground";
import { ThemeId, THEME_LIST, parseThemeArgument, getThemesMarkdown } from "@/content/themes";
import { PORTFOLIO_DATA } from "@/data/portfolioData";
import { StreamingTerminalOutput, OutputPayload } from "./StreamingTerminalOutput";
import { AiNoticeToast } from "./AiNoticeToast";
import { useTerminalSession } from "@/hooks/useTerminalSession";
import { getCommandSuggestions } from "@/lib/commandSuggestions";

export function TerminalInterface() {
  const [inputVal, setInputVal] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);

  const suggestions = useMemo(() => {
    if (isDismissed) {
      return {
        isOpen: false,
        query: inputVal,
        ghostSuffix: "",
        bestMatchFullText: "",
        suggestions: [],
      };
    }
    return getCommandSuggestions(inputVal);
  }, [inputVal, isDismissed]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeAiOutputId, setActiveAiOutputId] = useState<string | null>(null);
  const [showAiNotice, setShowAiNotice] = useState(false);
  const [isAiSession, setIsAiSession] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>("default");
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
      const savedTheme = sessionStorage.getItem("eds_terminal_theme");
      if (savedTheme && THEME_LIST.some((t) => t.id === savedTheme)) {
        setCurrentTheme(savedTheme as ThemeId);
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
      } else if (cmdLower === "/themes" || cmdLower.startsWith("/themes ")) {
        const themeArg = trimmed.slice(7).trim();
        if (!themeArg) {
          const payload: OutputPayload = {
            type: "markdown",
            content: getThemesMarkdown(currentTheme),
          };
          appendInteraction(trimmed, payload);
          setInputVal("");
          return;
        }

        const parseResult = parseThemeArgument(themeArg);
        if (parseResult.success) {
          setCurrentTheme(parseResult.theme.id);
          try {
            sessionStorage.setItem("eds_terminal_theme", parseResult.theme.id);
          } catch (e) {
            // ignore
          }
          const payload: OutputPayload = {
            type: "markdown",
            content: `Switched background theme to **${parseResult.theme.name}**.\n\nType \`/themes default\` or click \`/themes\` to change anytime.`,
          };
          appendInteraction(trimmed, payload);
          setInputVal("");
          return;
        }

        const payload: OutputPayload = {
          type: "markdown",
          content: `### Theme Error\n\n${parseResult.error}`,
        };
        appendInteraction(trimmed, payload);
        setInputVal("");
        return;
      } else if (cmdLower === "/help") {
        const payload: OutputPayload = {
          type: "markdown",
          content: `### Interactive AI Session Commands\n\n- \`/exit\` — Exit AI session and return to terminal home\n- \`/projects\` — Ask AI to synthesize Eds's projects\n- \`/skills\` — Ask AI to synthesize technical capabilities\n- \`/about\` — Ask AI about Eds's background\n- \`/contact\` — Ask AI for touchpoints\n- \`/themes\` — Switch ambient ASCII background theme\n\n_Or simply ask any question directly in everyday language._`,
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
    } else if (cmdLower === "/themes" || cmdLower.startsWith("/themes ")) {
      const themeArg = trimmed.slice(7).trim();
      if (!themeArg) {
        appendInteraction(trimmed, {
          type: "markdown",
          content: getThemesMarkdown(currentTheme),
        });
        setInputVal("");
        return;
      }

      const parseResult = parseThemeArgument(themeArg);
      if (parseResult.success) {
        setCurrentTheme(parseResult.theme.id);
        try {
          sessionStorage.setItem("eds_terminal_theme", parseResult.theme.id);
        } catch (e) {
          // ignore
        }
        appendInteraction(trimmed, {
          type: "markdown",
          content: `Switched background theme to **${parseResult.theme.name}**.\n\nType \`/themes default\` or click \`/themes\` to change anytime.`,
        });
        setInputVal("");
        return;
      }

      appendInteraction(trimmed, {
        type: "markdown",
        content: `### Theme Error\n\n${parseResult.error}`,
      });
      setInputVal("");
      return;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    setIsDismissed(false);
  };

  const handleApplySuggestion = (fullText: string) => {
    const nextVal = fullText === "/themes" ? "/themes " : fullText;
    setInputVal(nextVal);
    setIsDismissed(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Shift" || e.key === "Tab") {
      if (suggestions.ghostSuffix) {
        e.preventDefault();
        handleApplySuggestion(suggestions.bestMatchFullText);
        return;
      }
    }

    if (e.key === "Escape") {
      setIsDismissed(true);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      setIsDismissed(true);
      handleCommandExecution(inputVal);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < commandHistory.length) {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIndex]);
        setIsDismissed(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIndex]);
        setIsDismissed(true);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal("");
        setIsDismissed(true);
      }
      return;
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className="relative w-full h-[100dvh] flex flex-col bg-[#161616] cursor-text select-text overflow-hidden"
    >
      {/* Top Title Bar */}
      <header className="shrink-0 w-full px-3 sm:px-6 py-2.5 bg-[#161616]/90 backdrop-blur-xs border-b border-[#27272A] select-none flex items-center justify-between z-20">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="flex items-center space-x-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]" />
          </div>

          {/* Sidebar Toggle Button (active in Fase 2) */}
          {isFase2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="text-xs px-2 py-0.5 bg-[#1C1C1C] hover:bg-[#27272A] text-[#8E8E93] hover:text-[#FFFFFF] border border-[#27272A] transition-colors cursor-pointer font-mono shrink-0"
              title="Toggle sidebar"
            >
              <span className="sm:hidden">{sidebarOpen ? "[sidebar: ×]" : "[sidebar]"}</span>
              <span className="hidden sm:inline">{sidebarOpen ? "[sidebar: on]" : "[sidebar: off]"}</span>
            </button>
          )}

          <span className="text-xs text-[#8E8E93] tracking-wide font-medium flex items-center space-x-1.5 truncate">
            <span className="sm:hidden">eds:~</span>
            <span className="hidden sm:inline">eds@terminal-portfolio:~</span>
            {isAiSession && (
              <span className="text-[#E4E4E7] font-semibold text-[11px] shrink-0">[ai-session]</span>
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
        <div className="relative flex-1 min-h-0 flex flex-col justify-between overflow-hidden z-10">
          <div className="relative flex-1 min-h-0 w-full overflow-hidden">
            <AsciiBackground themeId={currentTheme} />
            <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden flex flex-col justify-center items-center px-4 py-4 sm:py-6">
              <div className="max-w-6xl w-full text-center space-y-2">
                {/* Large Centered 2D Living Typographical ASCII EDS */}
                <div className="w-full overflow-hidden">
                  <LivingAsciiEds compact={false} />
                </div>

                <div className="max-w-2xl mx-auto space-y-2">
                  <h1 className="text-base sm:text-lg text-[#FFFFFF] font-semibold tracking-wide">
                    DIMAS EDRA AR RAFI (EDS)
                  </h1>
                  <p className="text-xs sm:text-sm text-[#8E8E93]">
                    AI-Assisted Software Engineer & Systems Thinker
                  </p>
                  <p className="text-xs sm:text-sm text-[#52525B] pt-2">
                    Type a command or click a shortcut to explore:
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 pt-2 text-xs sm:text-sm">
                    {["/chat", "/projects", "/about", "/skills", "/contact", "/themes"].map((cmd) => (
                      <button
                        key={cmd}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCommandExecution(cmd);
                        }}
                        className="px-3 py-1 bg-[#1C1C1C]/90 text-[#E4E4E7] hover:bg-[#27272A] hover:text-[#FFFFFF] border border-[#27272A] transition-colors cursor-pointer"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Input Prompt for Fase 1 */}
          <footer className={`relative shrink-0 w-full bg-[#161616] border-t border-[#27272A] px-4 sm:px-8 flex items-center h-[52px] ${suggestions.isOpen ? "z-40" : "z-20"}`}>
            <div className="max-w-5xl mx-auto flex items-center space-x-3 w-full">
              <span className="text-[#E4E4E7] font-bold text-base sm:text-lg select-none shrink-0">❯</span>
              <div className="relative flex-1 min-w-0 flex items-center">
                {/* Floating Recommendation Chips Popover */}
                {suggestions.isOpen && suggestions.suggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-3 z-50 w-full max-w-sm sm:max-w-md bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] p-1.5 shadow-2xl flex flex-col gap-1 max-h-56 overflow-y-auto">
                    {suggestions.suggestions.map((item) => (
                      <button
                        key={item.fullText}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleApplySuggestion(item.fullText);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-mono hover:bg-[#27272A] text-left transition-colors cursor-pointer group"
                      >
                        <span className="text-[#E4E4E7] group-hover:text-white font-medium">{item.name}</span>
                        <span className="text-[#71717A] text-[11px] truncate ml-3">{item.description}</span>
                      </button>
                    ))}
                  </div>
                )}
                {/* Ghost Text Underlay */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none flex items-center font-mono text-sm leading-normal overflow-hidden whitespace-pre select-none p-0 m-0"
                >
                  <span className="invisible">{inputVal}</span>
                  <span className="text-[#71717A]">{suggestions.ghostSuffix}</span>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (typeof window !== "undefined" && window.innerWidth < 640) {
                      setSidebarOpen(false);
                    }
                    requestAnimationFrame(() => {
                      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    });
                  }}
                  placeholder="Type /chat, /projects, /themes, or /help..."
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                  className="relative z-10 w-full bg-transparent border-none outline-none text-[#F4F4F5] text-sm font-mono leading-normal placeholder:text-[#52525B] p-0 m-0"
                />
              </div>
              <div className="text-xs text-[#44444A] select-none hidden sm:block shrink-0">
                {suggestions.ghostSuffix ? (
                  <span className="text-[#71717A]">[Shift: complete | Enter: run]</span>
                ) : (
                  "[Enter: run | ↑↓: history]"
                )}
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* FASE 2: Active Workspace */
        <div className="relative flex-1 min-h-0 flex overflow-hidden w-full z-10">
          {/* Backdrop on Mobile when Sidebar is Open */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 sm:hidden"
            />
          )}

          {/* Left Sidebar: Offcanvas drawer on mobile, static side column on desktop */}
          {sidebarOpen && (
            <aside className="fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] sm:static sm:z-auto sm:w-64 md:w-72 bg-[#161616] border-r border-[#27272A] flex flex-col justify-between select-none shrink-0 h-full transition-all duration-200 shadow-2xl sm:shadow-none">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {/* Mobile Drawer Header with Close Button */}
                <div className="flex items-center justify-between sm:hidden pb-2 border-b border-[#27272A]">
                  <span className="text-xs font-mono text-[#52525B] uppercase tracking-wider">Navigation</span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-xs text-[#8E8E93] hover:text-[#FFFFFF] px-1.5 py-0.5 border border-[#27272A] font-mono cursor-pointer"
                  >
                    [close ×]
                  </button>
                </div>

                {/* Sidebar Header: Compact 2D Living Typographical ASCII EDS */}
                <div className="border-b border-[#27272A] pb-3 text-center">
                  <LivingAsciiEds compact={true} />
                  <p className="text-xs font-semibold text-[#FFFFFF] pt-1">
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
                        className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-[#1C1C1C] text-left transition-colors cursor-pointer group"
                      >
                        <span className="text-[#E4E4E7] font-medium group-hover:underline group-hover:text-[#FFFFFF]">
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
                <div className="space-y-1.5 pt-2 border-t border-[#27272A]">
                  <p className="text-[10px] text-[#52525B] uppercase tracking-wider px-2 font-medium">
                    Links
                  </p>
                  <div className="space-y-1 text-xs">
                    <a
                      href={PORTFOLIO_DATA.author.links.github}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-2.5 py-1 text-[#8E8E93] hover:text-[#FFFFFF] transition-colors"
                    >
                      github.com ↗
                    </a>
                    <a
                      href={PORTFOLIO_DATA.author.links.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-2.5 py-1 text-[#8E8E93] hover:text-[#FFFFFF] transition-colors"
                    >
                      linkedin.com ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer Hint */}
              <div className="h-[52px] shrink-0 w-full px-4 flex items-center border-t border-[#27272A] text-[10px] text-[#52525B]">
                terminal portfolio v1.0
              </div>
            </aside>
          )}

          {/* Right Main CLI Pane (Always full width on mobile) */}
          <main className="relative flex-1 min-h-0 min-w-0 flex flex-col bg-transparent w-full overflow-hidden">
            {/* The Bounded Chat Viewport with scoped ASCII Background */}
            <div className="relative flex-1 min-h-0 w-full overflow-hidden">
              <AsciiBackground themeId={currentTheme} />

              <div
                ref={scrollContainerRef}
                className="relative z-10 h-full overflow-y-auto overflow-x-hidden w-full"
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
                            <span className="text-[#E4E4E7] font-bold">❯</span>
                            <span className="text-[#FFFFFF] font-medium">{msg.command}</span>
                          </div>
                        ) : (
                          <div className="pl-3 sm:pl-5 border-l-2 border-[#27272A]">
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
            </div>

            {/* Input Prompt Bar for Fase 2 */}
            <footer className={`relative shrink-0 w-full bg-[#161616] border-t border-[#27272A] px-3.5 sm:px-8 flex items-center h-[52px] ${suggestions.isOpen ? "z-40" : "z-20"}`}>
              <div className="w-full flex items-center space-x-2.5 sm:space-x-3">
                <span className="text-[#E4E4E7] font-bold text-sm sm:text-base select-none shrink-0">❯</span>
                <div className="relative flex-1 min-w-0 flex items-center">
                  {/* Floating Recommendation Chips Popover */}
                  {suggestions.isOpen && suggestions.suggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-3 z-50 w-full max-w-sm sm:max-w-md bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] p-1.5 shadow-2xl flex flex-col gap-1 max-h-56 overflow-y-auto">
                      {suggestions.suggestions.map((item) => (
                        <button
                          key={item.fullText}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleApplySuggestion(item.fullText);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-mono hover:bg-[#27272A] text-left transition-colors cursor-pointer group"
                        >
                          <span className="text-[#E4E4E7] group-hover:text-white font-medium">{item.name}</span>
                          <span className="text-[#71717A] text-[11px] truncate ml-3">{item.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Ghost Text Underlay */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none flex items-center font-mono text-sm leading-normal overflow-hidden whitespace-pre select-none p-0 m-0"
                  >
                    <span className="invisible">{inputVal}</span>
                    <span className="text-[#71717A]">{suggestions.ghostSuffix}</span>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (typeof window !== "undefined" && window.innerWidth < 640) {
                        setSidebarOpen(false);
                      }
                      requestAnimationFrame(() => {
                        scrollToBottom();
                        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      });
                    }}
                    placeholder={
                      isAiSession
                        ? "Ask anything (or /exit to return)..."
                        : "Type /chat, /projects, /themes, or /help..."
                    }
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    className="relative z-10 w-full bg-transparent border-none outline-none text-[#F4F4F5] text-sm font-mono leading-normal placeholder:text-[#52525B] p-0 m-0"
                  />
                </div>
                <div className="text-xs text-[#44444A] select-none hidden sm:block shrink-0">
                  {suggestions.ghostSuffix ? (
                    <span className="text-[#71717A]">[Shift: complete | Enter: run]</span>
                  ) : (
                    "[Enter: run | ↑↓: history]"
                  )}
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

