"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Volume2, ShieldAlert, Sparkles, Check, Database, Save } from "lucide-react";
import { useIssues } from "@/store/issues-store";

export default function SettingsView() {
  const { addLog, supabaseCreds, connectSupabase, disconnectSupabase } = useIssues();

  // Voice States (Stored in localStorage or memory)
  const [agentId, setAgentId] = useState("aura-conversational-v4");
  const [voiceModel, setVoiceModel] = useState("eleven_multilingual_v2");
  const [stability, setStability] = useState(75);
  const [similarity, setSimilarity] = useState(85);
  const [noiseSuppression, setNoiseSuppression] = useState(true);

  // Database States (Synced with store context)
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Populate form from store credentials on load
  useEffect(() => {
    if (supabaseCreds) {
      setSupabaseUrl(supabaseCreds.url);
      setSupabaseKey(supabaseCreds.key);
    } else {
      setSupabaseUrl("");
      setSupabaseKey("");
    }
  }, [supabaseCreds]);

  // Load voice parameters from local storage on mount
  useEffect(() => {
    const savedAgent = localStorage.getItem("aura_agent_id");
    const savedModel = localStorage.getItem("aura_voice_model");
    if (savedAgent) setAgentId(savedAgent);
    if (savedModel) setVoiceModel(savedModel);
  }, []);

  const handleSaveSettings = (section: string) => {
    setIsSaving(true);
    localStorage.setItem("aura_agent_id", agentId);
    localStorage.setItem("aura_voice_model", voiceModel);
    addLog("info", `Saved settings for section: ${section}`);
    setTimeout(() => {
      setIsSaving(false);
    }, 600);
  };

  const handleConnectDb = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      addLog("error", "URL and Anon Key cannot be blank. Unable to connect to Supabase.");
      return;
    }
    setIsSaving(true);
    addLog("info", "Supabase DB connection requested...");
    setTimeout(() => {
      connectSupabase(supabaseUrl.trim(), supabaseKey.trim());
      setIsSaving(false);
    }, 800);
  };

  const handleDisconnectDb = () => {
    disconnectSupabase();
  };

  const dbConnected = supabaseCreds !== null;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-canvas flex flex-col gap-6 select-none h-full max-w-3xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="border-b border-border-main pb-4">
        <h2 className="text-sm font-semibold text-text-primary">System Settings</h2>
        <p className="text-[10px] text-text-secondary mt-0.5">
          Configure ElevenLabs Voice synthesis models, Supabase database triggers, and UI variables.
        </p>
      </div>

      {/* Grid Settings Cards */}
      <div className="flex flex-col gap-6">
        {/* Card: ElevenLabs Config */}
        <div className="p-5 rounded-xl border border-border-main bg-sidebar/20 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-main/50 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-purple" />
              <span className="text-xs font-semibold text-text-primary">ElevenLabs Speech Engine Config</span>
            </div>
            <button
              onClick={() => handleSaveSettings("Voice Engine")}
              className="h-6 px-2.5 rounded bg-accent-purple hover:bg-accent-purple/90 text-white text-[10px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>Save Voice Config</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-secondary font-medium">Conversational Agent ID</label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="h-8 px-3 rounded bg-sidebar border border-border-main text-xs text-text-primary focus:outline-none focus:border-[#4c4f56]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-secondary font-medium">Synthesis Model</label>
              <select
                value={voiceModel}
                onChange={(e) => setVoiceModel(e.target.value)}
                className="h-8 px-2.5 rounded bg-sidebar border border-border-main text-xs text-text-primary focus:outline-none focus:border-[#4c4f56]"
              >
                <option value="eleven_multilingual_v2">Eleven Multilingual v2 (High Quality)</option>
                <option value="eleven_turbo_v2">Eleven Turbo v2 (Low Latency)</option>
                <option value="eleven_monolingual_v1">Eleven English v1</option>
              </select>
            </div>
          </div>

          {/* Slider parameters */}
          <div className="space-y-3.5 pt-2">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-text-secondary">
                <span>Voice Stability</span>
                <span className="font-semibold">{stability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={stability}
                onChange={(e) => setStability(Number(e.target.value))}
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-accent-purple"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-text-secondary">
                <span>Clarity & Similarity Enhancement</span>
                <span className="font-semibold">{similarity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={similarity}
                onChange={(e) => setSimilarity(Number(e.target.value))}
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-accent-purple"
              />
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-text-secondary flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-text-secondary" /> Enable AI Ambient Noise Suppression
            </span>
            <input
              type="checkbox"
              checked={noiseSuppression}
              onChange={(e) => setNoiseSuppression(e.target.checked)}
              className="w-8 h-4 bg-[#222] checked:bg-accent-purple border border-border-main rounded-full appearance-none relative transition-colors cursor-pointer before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-[1px] before:left-[1px] checked:before:left-[15px] before:transition-all"
            />
          </div>
        </div>

        {/* Card: Supabase Database Connections */}
        <div className="p-5 rounded-xl border border-border-main bg-sidebar/20 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-main/50 pb-2.5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-accent-blue" />
              <span className="text-xs font-semibold text-text-primary">Database Sync Credentials</span>
            </div>
            
            {/* Connection Tag */}
            {dbConnected ? (
              <span className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase animate-fade-in">
                <Check className="w-2.5 h-2.5" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
                <ShieldAlert className="w-2.5 h-2.5" /> Sandbox State
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-secondary font-medium">Supabase Project API URL</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="h-8 px-3 rounded bg-sidebar border border-border-main text-xs text-text-primary focus:outline-none focus:border-[#4c4f56] font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-secondary font-medium">Supabase Anonymous Public Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="h-8 px-3 rounded bg-sidebar border border-border-main text-xs text-text-primary focus:outline-none focus:border-[#4c4f56] font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            {dbConnected ? (
              <button
                onClick={handleDisconnectDb}
                className="h-8 px-3 rounded border border-border-main text-xs text-text-secondary hover:text-red-400 hover:border-red-400/30 transition-colors cursor-pointer"
              >
                Disconnect DB
              </button>
            ) : (
              <button
                onClick={handleConnectDb}
                className="h-8 px-3 rounded bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Save and Connect Real-Time DB
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Saving Indicator */}
        {isSaving && (
          <div className="fixed top-16 right-6 bg-[#16171a] border border-border-main px-4 py-2 rounded-lg flex items-center gap-2 shadow-2xl animate-bounce">
            <span className="w-2 h-2 bg-accent-purple rounded-full animate-ping" />
            <span className="text-[10px] font-semibold text-text-primary font-mono">Syncing system configs...</span>
          </div>
        )}
      </div>
    </div>
  );
}
