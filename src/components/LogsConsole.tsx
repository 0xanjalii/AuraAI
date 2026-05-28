"use client";

import React, { useRef, useEffect } from "react";
import { Terminal, Trash2, X } from "lucide-react";
import { useIssues } from "@/store/issues-store";

interface LogsConsoleProps {
  onClose: () => void;
}

export default function LogsConsole({ onClose }: LogsConsoleProps) {
  const { logs, clearLogs } = useIssues();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to latest logs
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLogColors = (type: string) => {
    switch (type) {
      case "voice":
        return "text-[#FCD34D] bg-[#FCD34D]/10"; // yellow
      case "llm_request":
        return "text-cyan-400 bg-cyan-400/10"; // cyan
      case "llm_response":
        return "text-emerald-400 bg-emerald-400/10"; // emerald
      case "state_change":
        return "text-purple-400 bg-purple-400/10"; // purple
      case "error":
        return "text-red-400 bg-red-400/10"; // red
      default:
        return "text-text-secondary bg-[#222226]"; // gray
    }
  };

  return (
    <div className="h-60 border-t border-border-main bg-black/95 text-xs font-mono flex flex-col select-text relative">
      {/* Console Header */}
      <div className="h-8 px-4 border-b border-border-main bg-[#0E0F11] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-accent-purple" />
          <span className="text-[10px] font-semibold text-text-primary uppercase tracking-wider">Aura Developer Voice Agent Console</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={clearLogs}
            className="text-[10px] text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            title="Clear logs"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
          
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Close console"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-secondary text-[10px] italic">
            No agent activity logged. Click the Command Bar or press keys to interact with Aura.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex flex-col gap-1 border-b border-border-main/20 pb-2">
              <div className="flex items-start gap-2.5">
                <span className="text-[10px] text-[#555] shrink-0">{log.timestamp}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${getLogColors(log.type)}`}>
                  {log.type.replace("_", " ")}
                </span>
                <span className="text-text-primary flex-1 break-all leading-normal">{log.message}</span>
              </div>
              {log.details && (
                <div className="ml-16 bg-[#16171A] border border-border-main/50 rounded-lg p-2 mt-1 text-[10px] text-text-secondary max-w-2xl overflow-x-auto whitespace-pre-wrap select-text">
                  {log.details}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
