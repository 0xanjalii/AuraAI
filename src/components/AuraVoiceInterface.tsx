"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Sparkles, Send, Play, VolumeX, ShieldAlert } from "lucide-react";
import { useConversation } from "@elevenlabs/react";
import { useIssues, Priority, IssueStatus } from "@/store/issues-store";

export default function AuraVoiceInterface() {
  const { 
    isListening, 
    setIsListening, 
    processVoiceCommand, 
    addLog,
    addIssue,
    updateIssueStatus,
    deleteIssue
  } = useIssues();

  const [transcript, setTranscript] = useState("");
  const [statusText, setStatusText] = useState("Press mic and speak or try a command below");
  const [isProcessing, setIsProcessing] = useState(false);
  const [customCommand, setCustomCommand] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync settings/agent ID from localStorage
  useEffect(() => {
    const savedAgent = localStorage.getItem("aura_agent_id") || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "";
    setAgentId(savedAgent);
  }, []);

  const handleAutoProvision = async () => {
    setIsProvisioning(true);
    setStatusText("Provisioning real ElevenLabs Voice Agent...");
    addLog("info", "Requesting ElevenLabs agent creation & tool bindings...");
    try {
      const response = await fetch("/api/agent/setup", {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok && data.agentId) {
        localStorage.setItem("aura_agent_id", data.agentId);
        setAgentId(data.agentId);
        addLog("info", `ElevenLabs: Agent successfully created with ID ${data.agentId}. Saved to configuration.`);
        setStatusText("ElevenLabs Agent ready! Click mic to start.");
      } else {
        addLog("error", `Provisioning failed: ${data.error || "Unknown error"}`);
        setStatusText(`Provisioning error: ${data.error || "Unknown error"}`);
      }
    } catch (e: any) {
      addLog("error", `Provisioning failed: ${e.message || e}`);
      setStatusText("Provisioning API call failed.");
    } finally {
      setIsProvisioning(false);
    }
  };

  const presetCommands = [
    "Aura, move AUR-1 to Done",
    "Aura, create a high priority ticket to optimize database queries",
    "Aura, move AUR-2 to In Progress",
    "Aura, complete AUR-5",
  ];

  // Initialize ElevenLabs Conversational AI Web SDK hook
  const conversation = useConversation({
    onConnect: () => {
      setIsListening(true);
      setStatusText("Aura is active. Speak now...");
      addLog("info", "ElevenLabs WebSocket: Connection established. Microphone streaming active.");
    },
    onDisconnect: () => {
      setIsListening(false);
      setStatusText("Aura session ended.");
      addLog("info", "ElevenLabs WebSocket: Connection closed.");
      setTimeout(() => setStatusText("Press mic and speak or try a command below"), 3000);
    },
    onError: (error) => {
      setIsListening(false);
      setStatusText("Voice connection error.");
      addLog("error", `ElevenLabs SDK Error: ${error}`);
    },
    onMessage: (message) => {
      if (message.source === "user") {
        setTranscript(message.message);
        addLog("voice", `User speech recognized: "${message.message}"`);
      } else {
        addLog("llm_response", `Aura speech reply: "${message.message}"`);
      }
    },
    // Register Client-Side tools. These must match the tools configured in your ElevenLabs Dashboard.
    clientTools: {
      move_issue: async ({ issueId, status }: { issueId: string; status: IssueStatus }) => {
        updateIssueStatus(issueId, status);
        addLog("state_change", `ElevenLabs AI Tool Invocation: Moved ${issueId} to ${status}`);
        return `Success: Moved issue ${issueId} to ${status}`;
      },
      create_issue: async ({ title, status, priority, assigneeName }: { title: string; status: IssueStatus; priority: Priority; assigneeName?: string }) => {
        addIssue(title, status || "Todo", priority || "medium", assigneeName);
        addLog("state_change", `ElevenLabs AI Tool Invocation: Created issue "${title}"`);
        return `Success: Created issue "${title}"`;
      },
      delete_issue: async ({ issueId }: { issueId: string }) => {
        deleteIssue(issueId);
        addLog("state_change", `ElevenLabs AI Tool Invocation: Deleted issue ${issueId}`);
        return `Success: Deleted issue ${issueId}`;
      }
    }
  });

  const startVoiceSession = async () => {
    const targetAgentId = agentId || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!targetAgentId) {
      addLog("error", "No ElevenLabs Agent ID configured. Falling back to sandbox simulation mode.");
      simulateVoiceTranscript(presetCommands[0]);
      return;
    }

    try {
      addLog("info", `ElevenLabs: Initializing voice channel for Agent ${targetAgentId}...`);
      setStatusText("Acquiring secure agent session token...");
      
      // Fetch secure signedUrl from backend API (if ELEVENLABS_API_KEY is configured)
      let signedUrl = "";
      try {
        const authResponse = await fetch("/api/agent/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ agentId: targetAgentId }),
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.signedUrl) {
            signedUrl = authData.signedUrl;
            addLog("info", "ElevenLabs SDK: Secure session URL generated successfully.");
          } else if (authData.message) {
            addLog("info", `ElevenLabs SDK: ${authData.message}`);
          }
        } else {
          const errText = await authResponse.text();
          addLog("error", `ElevenLabs token handler failed: ${errText}`);
        }
      } catch (e: any) {
        addLog("error", `Failed connection to session handler: ${e.message || e}`);
      }

      setStatusText("Requesting microphone access...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start session with either signedUrl or agentId
      if (signedUrl) {
        await conversation.startSession({
          signedUrl: signedUrl,
        });
      } else {
        await conversation.startSession({
          agentId: targetAgentId,
        });
      }
    } catch (e: any) {
      addLog("error", `Microphone / SDK Start failed: ${e.message}`);
      setStatusText("Mic access denied or session failed.");
      setTimeout(() => setStatusText("Press mic and speak or try a command below"), 3000);
    }
  };

  const endVoiceSession = async () => {
    try {
      await conversation.endSession();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleListening = () => {
    if (conversation.status === "connected") {
      endVoiceSession();
    } else {
      startVoiceSession();
    }
  };

  // Local Voice Transcript Simulator (Run if no ElevenLabs Agent ID is active)
  const simulateVoiceTranscript = (text: string) => {
    setIsListening(true);
    setStatusText("Listening...");
    addLog("info", `Voice Simulator Started: "${text}"`);
    
    let currentText = "";
    const words = text.split(" ");
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < words.length) {
        currentText += (i === 0 ? "" : " ") + words[i];
        setTranscript(currentText);
        i++;
      } else {
        clearInterval(interval);
        setIsListening(false);
        setIsProcessing(true);
        setStatusText("Processing voice command...");
        
        processVoiceCommand(text)
          .then((payload) => {
            setIsProcessing(false);
            if (payload.action !== "UNKNOWN") {
              setStatusText(`Success: Executed ${payload.action}`);
              setTimeout(() => setStatusText("Board updated. Aura ready."), 3000);
            } else {
              setStatusText("Error: Command could not be parsed.");
              setTimeout(() => setStatusText("Ready for next command."), 3000);
            }
          })
          .catch(() => {
            setIsProcessing(false);
            setStatusText("Error routing voice command.");
          });
      }
    }, 150);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommand.trim()) return;
    
    const cmd = customCommand;
    setCustomCommand("");
    simulateVoiceTranscript(cmd);
  };

  const isRealActive = conversation.status === "connected" || conversation.status === "connecting";
  const activeListening = isListening || isRealActive;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-40 max-w-xl w-full px-4 select-none animate-fade-in">
      {/* Simulation preset helpers (Expandable popover) */}
      <div className="flex flex-col gap-1 w-full bg-[#16171A]/95 border border-border-main rounded-xl p-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-border-main/50 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
            <span className="text-[10px] font-semibold text-text-primary uppercase tracking-wider">Voice Control Panel</span>
          </div>

          <div className="flex items-center gap-3">
            {agentId ? (
              <span className="flex items-center gap-1 text-[8px] bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-1.5 py-0.2 rounded font-bold uppercase">
                ElevenLabs Agent Active
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[8px] bg-[#222] text-text-secondary border border-border-main px-1.5 py-0.2 rounded font-semibold">
                  Sandbox Simulation
                </span>
                <button
                  onClick={handleAutoProvision}
                  disabled={isProvisioning}
                  className="text-[9px] bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/40 text-accent-purple font-semibold px-2 py-0.5 rounded transition-all cursor-pointer disabled:opacity-50"
                  title="Automatically configure voice agent and client tools on your ElevenLabs account"
                >
                  {isProvisioning ? "Provisioning..." : "⚡ Provision Real Agent"}
                </button>
              </div>
            )}
            <button 
              onClick={() => setShowPresets(!showPresets)}
              className="text-[10px] text-accent-blue hover:underline cursor-pointer"
            >
              {showPresets ? "Hide Presets" : "Show Preset Macros"}
            </button>
          </div>
        </div>

        {showPresets && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
            {presetCommands.map((cmd) => (
              <button
                key={cmd}
                onClick={() => simulateVoiceTranscript(cmd)}
                disabled={activeListening || isProcessing}
                className="text-left text-[10px] p-2 rounded-lg border border-border-main/50 bg-sidebar/40 hover:bg-[#222226] text-text-secondary hover:text-text-primary transition-all flex items-center justify-between group disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <span className="truncate pr-2 font-mono">"{cmd}"</span>
                <Play className="w-3 h-3 text-text-secondary group-hover:text-accent-purple group-hover:scale-110 transition-all shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Custom text-to-speech mock input */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder='Type command e.g. "Aura, move AUR-1 to Done" or "create issue..."'
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            disabled={activeListening || isProcessing}
            className="flex-1 h-8 px-3 rounded-lg border border-border-main bg-canvas text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-[#4c4f56] disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={activeListening || isProcessing || !customCommand.trim()}
            className="h-8 px-3 rounded-lg bg-accent-blue hover:bg-accent-blue/90 disabled:bg-[#222226] disabled:text-text-secondary text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Run</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Floating Glass Control Bar */}
      <div 
        className={`w-full max-w-lg bg-[#1A1A1E]/80 backdrop-blur-md border border-border-main rounded-full p-2 flex items-center justify-between shadow-2xl transition-all duration-300 ${
          activeListening ? "border-accent-purple shadow-purple-glow bg-[#1a1324]/80" : ""
        } ${isProcessing || conversation.status === "connecting" ? "border-accent-blue shadow-blue-glow bg-[#101524]/80" : ""}`}
        id="voice-command-bar"
      >
        {/* Status text or Transcript */}
        <div className="flex-1 pl-4 pr-2 text-left truncate">
          {conversation.status === "connecting" ? (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-accent-blue animate-ping shrink-0" />
              <p className="text-xs text-accent-blue font-medium tracking-wide truncate">
                Connecting to ElevenLabs voice agent...
              </p>
            </div>
          ) : activeListening ? (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-accent-purple animate-ping shrink-0" />
              <p className="text-xs text-text-primary font-medium tracking-wide italic truncate">
                {transcript || "Listening... Speak to Aura"}
              </p>
            </div>
          ) : isProcessing ? (
            <p className="text-xs text-accent-blue font-medium animate-pulse truncate">
              {statusText}
            </p>
          ) : (
            <p className="text-[11px] text-text-secondary truncate">
              {statusText}
            </p>
          )}
        </div>

        {/* Animated Soundwave & Mic Controller */}
        <div className="flex items-center gap-3 pr-1 shrink-0">
          {/* Detailed 8-bar Vocal Spectrum Analyzer */}
          {activeListening && (
            <div className="flex items-center gap-[2.5px] h-5 px-2 bg-accent-purple/10 rounded-full border border-accent-purple/20 select-none" title="Capturing speech stream...">
              <span className="w-[2px] h-2 bg-accent-purple rounded-full animate-bounce shrink-0" style={{ animationDelay: "0.1s", animationDuration: "0.6s" }} />
              <span className="w-[2px] h-4 bg-accent-purple rounded-full animate-bounce shrink-0" style={{ animationDelay: "0.25s", animationDuration: "0.8s" }} />
              <span className="w-[2px] h-1.5 bg-accent-purple rounded-full animate-bounce shrink-0" style={{ animationDelay: "0.05s", animationDuration: "0.5s" }} />
              <span className="w-[2px] h-5 bg-accent-purple rounded-full animate-bounce shrink-0" style={{ animationDelay: "0.35s", animationDuration: "0.7s" }} />
              <span className="w-[2px] h-3 bg-accent-purple rounded-full animate-bounce shrink-0" style={{ animationDelay: "0.15s", animationDuration: "0.6s" }} />
              <span className="w-[2px] h-4.5 bg-accent-purple rounded-full animate-bounce shrink-0" style={{ animationDelay: "0.45s", animationDuration: "0.9s" }} />
              <span className="w-[2px] h-2 bg-accent-purple rounded-full animate-bounce shrink-0" style={{ animationDelay: "0.2s", animationDuration: "0.65s" }} />
              <span className="w-[2px] h-3.5 bg-accent-purple rounded-full animate-bounce shrink-0" style={{ animationDelay: "0.3s", animationDuration: "0.75s" }} />
            </div>
          )}

          {/* Glowing Microphone Button */}
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 relative cursor-pointer ${
              activeListening
                ? "bg-accent-purple text-white shadow-purple-glow hover:scale-105 active:scale-95"
                : "bg-[#222226] border border-border-main text-text-secondary hover:text-text-primary hover:border-text-secondary active:scale-95"
            }`}
            title={activeListening ? "End Voice Session" : "Start Voice Agent Session"}
            id="btn-voice-mic"
          >
            {isRealActive ? (
              <Mic className="w-4 h-4 text-white animate-pulse" />
            ) : isListening ? (
              <Mic className="w-4 h-4 text-white animate-pulse" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            
            {/* Pulsing ring background when active */}
            {activeListening && (
              <span className="absolute inset-0 rounded-full border border-accent-purple animate-ping opacity-60" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
