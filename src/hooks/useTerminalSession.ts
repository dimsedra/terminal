"use client";

import { useState, useEffect, useRef } from "react";
import { OutputPayload } from "@/components/StreamingTerminalOutput";

export interface TerminalMessage {
  id: string;
  type: "user" | "output";
  command?: string;
  payload?: OutputPayload;
}

const STORAGE_HISTORY_KEY = "eds_terminal_history_v1";
const STORAGE_CMD_HISTORY_KEY = "eds_command_history_v1";

export function useTerminalSession() {
  const [history, setHistory] = useState<TerminalMessage[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [activeStreamingId, setActiveStreamingId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isRestoring = useRef(true);

  // Restore session from sessionStorage on client mount
  useEffect(() => {
    try {
      const savedHistory = sessionStorage.getItem(STORAGE_HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          // Jump immediately to the most recent message when restored
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

  // Persist history to sessionStorage
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

  // Persist command history to sessionStorage
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

  // Handle auto-scroll on new message vs initial restore
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

  // Helper to append a user command and an output message
  const appendInteraction = (command: string, payload: OutputPayload) => {
    const userMsgId = `user-${Date.now()}`;
    const outputMsgId = `out-${Date.now()}`;

    const userMsg: TerminalMessage = {
      id: userMsgId,
      type: "user",
      command,
    };

    const outputMsg: TerminalMessage = {
      id: outputMsgId,
      type: "output",
      payload,
    };

    setCommandHistory((prev) => [...prev, command]);
    setActiveStreamingId(outputMsgId);
    setHistory((prev) => [...prev, userMsg, outputMsg]);
  };

  // Helper to clear terminal session
  const clearSession = () => {
    setHistory([]);
    setActiveStreamingId(null);
    try {
      sessionStorage.removeItem(STORAGE_HISTORY_KEY);
    } catch (e) {
      // ignore
    }
  };

  // Helper when streaming completes
  const handleStreamComplete = (msgId: string) => {
    if (msgId === activeStreamingId) {
      setActiveStreamingId(null);
    }
  };

  return {
    history,
    commandHistory,
    activeStreamingId,
    scrollContainerRef,
    bottomRef,
    appendInteraction,
    clearSession,
    handleStreamComplete,
  };
}
