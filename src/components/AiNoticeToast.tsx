"use client";

import React, { useState, useEffect } from "react";

interface AiNoticeToastProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiNoticeToast({ isOpen, onClose }: AiNoticeToastProps) {
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      return;
    }

    // Step 1 stays for 3 seconds, then transitions to Step 2
    const timerStep1 = setTimeout(() => {
      setStep(2);
    }, 3000);

    // Step 2 stays for 3 seconds (total 6 seconds), then closes
    const timerStep2 = setTimeout(() => {
      onClose();
    }, 6000);

    return () => {
      clearTimeout(timerStep1);
      clearTimeout(timerStep2);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 right-4 sm:right-8 z-30 w-80 sm:w-88 bg-[#080808]/95 backdrop-blur-sm border border-[#1F1F1F] rounded-md p-3.5 shadow-xl shadow-black/50 font-mono transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 select-none"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-[#171717]">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9AE6B4] inline-block animate-pulse" />
          <span className="text-[10px] text-[#9AE6B4] tracking-wider uppercase font-medium">
            ai notice [{step}/2]
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#66666E] hover:text-[#9AE6B4] text-xs transition-colors cursor-pointer"
          title="Dismiss notification"
          aria-label="Dismiss"
        >
          [×]
        </button>
      </div>

      <div className="pt-2 text-xs leading-relaxed text-[#D4D4D8]">
        {step === 1 ? (
          <p className="animate-in fade-in duration-200">
            You are now chatting with an AI assistant representing Eds.
          </p>
        ) : (
          <p className="animate-in fade-in duration-200">
            Please keep queries focused on Eds's portfolio, engineering work, and collaborations.
          </p>
        )}
      </div>
    </div>
  );
}
