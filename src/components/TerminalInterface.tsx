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
  const inputRef = useRef<HTMLInputElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
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

  // Synchronize AI SDK streaming tokens and completion with the active terminal message
  useEffect(() => {
    if (!activeAiOutputId) return;

    if (error) {
      updateMessagePayload(activeAiOutputId, {
        type: "markdown",
        content: `### AI Assistant Connection Note\n\n${error.message || "Failed to connect to Google Gemini API."}\n\n> Please make sure you have set \`GOOGLE_GENERATIVE_AI_API_KEY\` in your \`.env.local\` file. You can obtain a free key at [Google AI Studio](https://aistudio.google.com/).`,
        isLiveStream: true,
        isDone: true,
      });
      handleStreamComplete(activeAiOutputId);
      setActiveAiOutputId(null);
      return;
    }

    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant") {
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
        promptToSend = "Could you give me a conversational overview and synthesis of Eds's featured projects based on the portfolio data?";
      } else if (cmdLower === "/skills") {
        promptToSend = "Could you give me a synthesized breakdown of Eds's technical capabilities, stack, and AI tooling?";
      } else if (cmdLower === "/about") {
        promptToSend = "Tell me about Eds's background, role, and what drives his engineering work.";
      } else if (cmdLower === "/contact") {
        promptToSend = "How can I get in touch with Eds or connect with him?";
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
      className="w-full h-screen flex flex-col bg-[#0E0F0E] cursor-text select-text overflow-hidden"
    >
      {/* Top Title Bar */}
      <header className="shrink-0 w-full px-4 sm:px-6 py-2.5 bg-[#090A09] border-b border-[#1A1D19] select-none flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#272B25]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#272B25]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#272B25]" />
          </div>

          {/* Sidebar Toggle Button (active in Fase 2) */}
          {isFase2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="text-xs px-2 py-0.5 rounded bg-[#131613] hover:bg-[#1A1E1A] text-[#8B9285] hover:text-[#9AE6B4] border border-[#212620] transition-colors cursor-pointer font-mono"
              title="Toggle sidebar"
            >
              {sidebarOpen ? "[sidebar: on]" : "[sidebar: off]"}
            </button>
          )}

          <span className="text-xs text-[#656C60] tracking-wide font-medium flex items-center space-x-1.5">
            <span>eds@terminal-portfolio:~</span>
            {isAiSession && (
              <span className="text-[#9AE6B4] font-semibold text-[11px]">[ai-session]</span>
            )}
          </span>
        </div>

        <div className="text-xs text-[#555A51] tracking-wider uppercase font-mono">
          agentic-cli
        </div>
      </header>

      {/* Main Workspace */}
      {!isFase2 ? (
        /* FASE 1: Welcoming Landing View */
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center px-4 py-8">
            <div className="max-w-2xl w-full text-center space-y-4">
              {/* Large Centered 3D Spinning ASCII EDS */}
              <div className="py-2">
                <SpinningAsciiEds compact={false} />
              </div>

              <div className="space-y-2">
                <h1 className="text-base sm:text-lg text-[#F0F3EC] font-semibold tracking-wide">
                  DIMAS EDRA AR RAFI (EDS)
                </h1>
                <p className="text-xs sm:text-sm text-[#7E8578]">
                  AI-Assisted Software Engineer & Systems Thinker
                </p>
                <p className="text-xs sm:text-sm text-[#555A51] pt-2">
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
                      className="px-3 py-1 bg-[#141714] text-[#9AE6B4] hover:bg-[#1C201B] border border-[#212620] rounded-md transition-colors cursor-pointer"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Input Prompt for Fase 1 */}
          <footer className="shrink-0 w-full bg-[#090A09] border-t border-[#1A1D19] px-4 sm:px-8 py-3.5 z-10">
            <div className="max-w-5xl mx-auto flex items-center space-x-3">
              <span className="text-[#9AE6B4] font-bold text-base sm:text-lg select-none">❯</span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type /chat to enter AI session, or /projects, /help..."
                autoFocus
                spellCheck={false}

                autoComplete="off"
                className="flex-1 bg-transparent border-none outline-none text-[#F0F3EC] text-sm sm:text-base font-mono placeholder:text-[#555A51]"
              />
              <div className="text-xs text-[#4A5046] select-none hidden sm:block">
                [Enter: run | ↑↓: history]
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* FASE 2: Active Split Workspace (Left Sidebar + Bounded Chat Viewport) */
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left Sidebar */}
          {sidebarOpen && (
            <aside className="w-64 sm:w-72 bg-[#0B0D0B] border-r border-[#1A1D19] flex flex-col justify-between select-none shrink-0 h-full transition-all duration-200">
              <div className="overflow-y-auto p-4 space-y-4">
                {/* Sidebar Header: Compact 3D Spinning ASCII EDS */}
                <div className="border-b border-[#181B17] pb-3 text-center">
                  <SpinningAsciiEds compact={true} />
                  <p className="text-xs font-semibold text-[#F0F3EC] pt-1">
                    DIMAS EDRA AR RAFI
                  </p>
                  <p className="text-[11px] text-[#7E8578]">AI-Assisted Engineer</p>
                </div>

                {/* Quick Navigation Commands */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] text-[#555A51] uppercase tracking-wider px-2 font-medium">
                    Commands
                  </p>
                  <div className="space-y-1 text-xs">
                    {PORTFOLIO_DATA.commands.map((cmd) => (
                      <button
                        key={cmd.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCommandExecution(cmd.name);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#151915] text-left transition-colors cursor-pointer group"
                      >
                        <span className="text-[#9AE6B4] font-medium group-hover:underline">
                          {cmd.name}
                        </span>
                        <span className="text-[10px] text-[#555A51] truncate max-w-[120px]">
                          {cmd.desc.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Touchpoints / Links */}
                <div className="space-y-1.5 pt-2 border-t border-[#181B17]">
                  <p className="text-[10px] text-[#555A51] uppercase tracking-wider px-2 font-medium">
                    Links
                  </p>
                  <div className="space-y-1 text-xs">
                    <a
                      href={PORTFOLIO_DATA.author.links.github}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-2.5 py-1 text-[#8B9285] hover:text-[#9AE6B4] transition-colors"
                    >
                      github.com ↗
                    </a>
                    <a
                      href={PORTFOLIO_DATA.author.links.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-2.5 py-1 text-[#8B9285] hover:text-[#9AE6B4] transition-colors"
                    >
                      linkedin.com ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer Hint */}
              <div className="p-3 border-t border-[#181B17] text-[10px] text-[#4A5046]">
                terminal portfolio v1.0
              </div>
            </aside>
          )}

          {/* Right Main CLI Pane (The Strictly Bounded Rectangular Box) */}
          <main className="flex-1 min-h-0 min-w-0 flex flex-col bg-[#0E0F0E]">
            {/* The Bounded Chat Viewport */}
            <div
              ref={scrollContainerRef}
              className="flex-1 min-h-0 overflow-y-auto w-full"
            >
              <div
                ref={contentWrapperRef}
                className="w-full px-6 sm:px-8 py-5 space-y-4"
              >
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

            {/* Input Prompt Bar for Fase 2 - Full width edge-to-edge alignment */}
            <footer className="shrink-0 w-full bg-[#090A09] border-t border-[#1A1D19] px-6 sm:px-8 py-3.5 z-10">
              <div className="w-full flex items-center space-x-3">
                <span className="text-[#9AE6B4] font-bold text-base sm:text-lg select-none">❯</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isAiSession
                      ? "Ask Eds's AI assistant anything (or /exit to return)..."
                      : "Type /chat to enter AI session, or /projects, /help..."
                  }
                  autoFocus
                  spellCheck={false}

                  autoComplete="off"
                  className="flex-1 bg-transparent border-none outline-none text-[#F0F3EC] text-sm sm:text-base font-mono placeholder:text-[#555A51]"
                />
                <div className="text-xs text-[#4A5046] select-none hidden sm:block">
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

