"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  LayoutGrid, 
  Layers, 
  Settings, 
  Plus, 
  ChevronDown, 
  Terminal, 
  Sparkles, 
  Volume2,
  ListTodo,
  Check
} from "lucide-react";
import { useIssues } from "@/store/issues-store";

interface SidebarProps {
  onNewIssueClick: () => void;
  showLogs: boolean;
  setShowLogs: (show: boolean) => void;
}

export default function Sidebar({ onNewIssueClick, showLogs, setShowLogs }: SidebarProps) {
  const { 
    issues, 
    currentView, 
    setCurrentView, 
    activeWorkspace, 
    setActiveWorkspace 
  } = useIssues();

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const workspaces = [
    { name: "Aura AI Agent", color: "from-accent-purple to-accent-blue" },
    { name: "Personal Tasks", color: "from-emerald-500 to-teal-500" },
    { name: "Hackathon Project", color: "from-blue-500 to-indigo-500" },
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWorkspaceOpen(false);
      }
    };
    if (workspaceOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [workspaceOpen]);

  // Compute issue counts for active workspace
  const activeWorkspaceIssues = issues.filter((issue) => {
    if (activeWorkspace === "Aura AI Agent") return issue.id.startsWith("AUR-");
    if (activeWorkspace === "Personal Tasks") return issue.id.startsWith("PERS-");
    if (activeWorkspace === "Hackathon Project") return issue.id.startsWith("HACK-");
    return true;
  });

  const todoAndProgressIssues = activeWorkspaceIssues.filter(
    (issue) => issue.status === "Todo" || issue.status === "In Progress"
  );

  const doneIssues = activeWorkspaceIssues.filter((issue) => issue.status === "Done");

  const navItems = [
    { label: "Active Cycle", view: "Active Cycle" as const, icon: Layers, count: todoAndProgressIssues.length },
    { label: "Backlog", view: "Backlog" as const, icon: ListTodo, count: activeWorkspaceIssues.length },
    { label: "Board", view: "Board" as const, icon: LayoutGrid, count: activeWorkspaceIssues.length },
    { label: "Settings", view: "Settings" as const, icon: Settings },
  ];

  const activeColor = activeWorkspace === "Aura AI Agent" 
    ? "text-accent-purple" 
    : activeWorkspace === "Personal Tasks"
    ? "text-emerald-500"
    : "text-accent-blue";

  return (
    <aside className="w-56 bg-sidebar border-r border-border-main flex flex-col h-full select-none relative">
      {/* Workspace Selector (Clickable Dropdown Trigger) */}
      <div 
        onClick={() => setWorkspaceOpen(!workspaceOpen)}
        className="h-12 px-4 flex items-center justify-between border-b border-border-main hover:bg-[#222226] transition-colors cursor-pointer group relative"
        id="workspace-switcher-trigger"
      >
        <div className="flex items-center gap-2">
          {/* Circular color indicator matching active workspace */}
          <div className={`w-5 h-5 rounded-md bg-gradient-to-tr ${
            workspaces.find(w => w.name === activeWorkspace)?.color || "from-accent-purple to-accent-blue"
          } flex items-center justify-center shadow-sm`}>
            <span className="text-[10px] font-bold text-white tracking-wider">
              {activeWorkspace.charAt(0)}
            </span>
          </div>
          <span className="text-xs font-semibold text-text-primary tracking-wide">
            {activeWorkspace}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-colors" />
      </div>

      {/* Floating Workspace Switcher Dropdown */}
      {workspaceOpen && (
        <div 
          ref={dropdownRef}
          className="absolute left-2.5 top-11 w-52 bg-[#16171A] border border-border-main rounded-lg shadow-2xl p-1 z-50 flex flex-col gap-0.5"
          id="workspace-switcher-dropdown"
        >
          <div className="text-[9px] uppercase font-bold text-text-secondary px-2.5 py-1.5 border-b border-border-main/50 select-none">
            Switch Workspace
          </div>
          {workspaces.map((ws) => (
            <button
              key={ws.name}
              onClick={() => {
                setActiveWorkspace(ws.name);
                setWorkspaceOpen(false);
              }}
              className={`w-full text-left h-8 px-2.5 rounded text-xs flex items-center justify-between transition-colors cursor-pointer ${
                activeWorkspace === ws.name 
                  ? "bg-[#222226] text-text-primary font-medium" 
                  : "text-text-secondary hover:text-text-primary hover:bg-[#222226]/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${ws.color}`} />
                <span>{ws.name}</span>
              </div>
              {activeWorkspace === ws.name && (
                <Check className="w-3.5 h-3.5 text-text-primary" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Action Button */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={onNewIssueClick}
          id="btn-new-issue"
          className="w-full h-7 px-2.5 rounded-md border border-border-main bg-[#222226]/50 hover:bg-[#222226] text-text-primary text-xs font-medium flex items-center justify-between transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-colors" />
            <span>New Issue</span>
          </div>
          <kbd className="text-[9px] bg-canvas text-text-secondary border border-border-main px-1.5 py-0.5 rounded shadow-sm font-sans tracking-wide">
            C
          </kbd>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-[2px]" id="sidebar-navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isViewActive = currentView === item.view;
          return (
            <button
              key={item.label}
              onClick={() => setCurrentView(item.view)}
              id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`w-full h-7 px-2 rounded-md flex items-center justify-between text-xs transition-colors cursor-pointer ${
                isViewActive
                  ? "bg-[#222226] text-text-primary font-medium border-l-2 border-text-primary/70 rounded-l-none"
                  : "text-text-secondary hover:text-text-primary hover:bg-[#222226]/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${isViewActive ? activeColor : "text-text-secondary group-hover:text-text-primary"}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className="text-[10px] text-text-secondary bg-canvas border border-border-main/50 px-1.5 py-0.2 rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Voice Assistant Status Card */}
      <div className="p-3 mx-2 mb-2 rounded-lg border border-border-main bg-canvas/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent-purple animate-pulse" />
          <span className="text-[10px] font-semibold text-text-primary tracking-wider uppercase">Voice AI Agent</span>
        </div>
        <p className="text-[10px] text-text-secondary leading-relaxed">
          Control the board. Try saying <strong className="text-text-primary">"Aura, move AUR-1 to Done"</strong> to shift status.
        </p>
      </div>

      {/* Toggle Developer Console */}
      <div className="p-2 border-t border-border-main">
        <button
          onClick={() => setShowLogs(!showLogs)}
          id="btn-toggle-logs"
          className={`w-full h-7 px-2 rounded-md flex items-center gap-2 text-xs transition-colors ${
            showLogs
              ? "bg-[#2b203a] text-accent-purple font-medium border border-accent-purple/30"
              : "text-text-secondary hover:text-text-primary hover:bg-[#222226]/40 border border-transparent"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Agent Logs Console</span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple animate-ping" />
        </button>
      </div>
    </aside>
  );
}
