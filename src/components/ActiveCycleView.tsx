"use client";

import React, { useMemo } from "react";
import { Layers, Calendar, CheckCircle2, Circle, AlertCircle, Play } from "lucide-react";
import { useIssues } from "@/store/issues-store";

export default function ActiveCycleView() {
  const { filteredIssues, setSelectedIssueId } = useIssues();

  // Compute cycle stats
  const stats = useMemo(() => {
    const total = filteredIssues.length;
    const completed = filteredIssues.filter((i) => i.status === "Done").length;
    const inProgress = filteredIssues.filter((i) => i.status === "In Progress").length;
    const todo = filteredIssues.filter((i) => i.status === "Todo").length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, todo, percentage };
  }, [filteredIssues]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-canvas flex flex-col gap-6 select-none h-full max-w-5xl mx-auto w-full">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-main pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
            <Layers className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Cycle 24 (Active)</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>May 20, 2026 – June 3, 2026 (5 days remaining)</span>
            </div>
          </div>
        </div>

        {/* Burn Progress Indicator */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-text-secondary font-medium">Progress</span>
            <p className="text-xs font-bold text-text-primary">{stats.percentage}% completed</p>
          </div>
          <div className="w-32 h-2 bg-[#222] rounded-full border border-border-main overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-500" 
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: SVG Burndown Chart & Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric Cards */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="p-4 rounded-xl border border-border-main bg-sidebar/20 flex flex-col gap-1.5">
            <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider">Completed Issues</span>
            <p className="text-xl font-bold text-text-primary">{stats.completed} / {stats.total}</p>
            <span className="text-[9px] text-text-secondary mt-0.5">Issues resolved in the current cycle scope.</span>
          </div>

          <div className="p-4 rounded-xl border border-border-main bg-sidebar/20 flex flex-col gap-1.5">
            <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider">Active Status</span>
            <div className="flex items-center justify-between text-xs mt-1 border-b border-border-main/20 pb-2">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Circle className="w-3 h-3 text-text-secondary" /> Todo
              </span>
              <span className="font-semibold text-text-primary">{stats.todo}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-text-secondary flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-accent-blue animate-pulse" /> In Progress
              </span>
              <span className="font-semibold text-text-primary">{stats.inProgress}</span>
            </div>
          </div>
        </div>

        {/* SVG Burndown Plot */}
        <div className="md:col-span-2 p-4 rounded-xl border border-border-main bg-sidebar/10 flex flex-col gap-3 min-h-[220px]">
          <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider">Cycle Burndown</span>
          
          <div className="flex-1 w-full relative">
            {/* Custom SVG burndown graphic */}
            <svg viewBox="0 0 400 160" width="100%" height="100%" className="overflow-visible font-mono text-[8px] fill-text-secondary">
              {/* Guidelines */}
              <line x1="20" y1="140" x2="380" y2="140" stroke="#27282B" strokeWidth="1" />
              <line x1="20" y1="20" x2="20" y2="140" stroke="#27282B" strokeWidth="1" />
              <line x1="380" y1="20" x2="380" y2="140" stroke="#27282B" strokeWidth="1" />

              {/* Gridlines */}
              <line x1="20" y1="80" x2="380" y2="80" stroke="#27282B" strokeWidth="0.5" strokeDasharray="3 3" />
              
              {/* Labels */}
              <text x="5" y="24">100%</text>
              <text x="8" y="83">50%</text>
              <text x="12" y="143">0%</text>
              
              <text x="20" y="152" textAnchor="middle">Day 1</text>
              <text x="140" y="152" textAnchor="middle">Day 5</text>
              <text x="260" y="152" textAnchor="middle">Day 10</text>
              <text x="380" y="152" textAnchor="middle">Day 14</text>

              {/* Ideal Burndown (Dotted path) */}
              <line x1="20" y1="20" x2="380" y2="140" stroke="#8A8F98" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
              
              {/* Actual Burndown path */}
              <path
                d="M 20 20 L 80 25 L 140 50 L 200 85 L 260 88"
                fill="none"
                stroke="url(#chartGradient)"
                strokeWidth="2.5"
                filter="url(#svgGlow)"
              />
              <circle cx="260" cy="88" r="4" fill="#8C3DF5" stroke="#FFFFFF" strokeWidth="1" />

              {/* Chart Gradients and Filters */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#5E6AD2" />
                  <stop offset="100%" stopColor="#8C3DF5" />
                </linearGradient>
                <filter id="svgGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Cycle Issue List */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider">Scope Issues ({filteredIssues.length})</span>
        <div className="flex flex-col border border-border-main rounded-xl overflow-hidden divide-y divide-border-main bg-sidebar/5">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => setSelectedIssueId(issue.id)}
              className="px-4 py-3 flex items-center justify-between hover:bg-[#222226]/40 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                {issue.status === "Done" ? (
                  <CheckCircle2 className="w-4 h-4 text-accent-purple shrink-0" />
                ) : issue.status === "In Progress" ? (
                  <AlertCircle className="w-4 h-4 text-accent-blue shrink-0 animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4 text-text-secondary shrink-0" />
                )}
                
                <span className="text-xs font-mono font-semibold text-text-secondary tracking-wide group-hover:text-text-primary transition-colors shrink-0">
                  {issue.id}
                </span>

                <h4 className="text-xs font-semibold text-text-primary truncate pr-4 max-w-[280px] sm:max-w-md">
                  {issue.title}
                </h4>
              </div>

              <div className="flex items-center gap-4 text-xs">
                {/* Priority Badge */}
                <span className="text-[10px] text-text-secondary bg-[#16171a] px-2 py-0.5 rounded border border-border-main capitalize font-medium">
                  {issue.priority.replace("_", " ")}
                </span>
                
                {/* Assignee initials */}
                {issue.assignee ? (
                  <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-accent-purple/40 to-accent-blue/40 border border-border-main flex items-center justify-center text-[8px] font-bold text-text-primary select-none">
                    {issue.assignee.avatarUrl}
                  </div>
                ) : (
                  <div className="w-5.5 h-5.5 rounded-full bg-canvas border border-border-main flex items-center justify-center text-[8px] text-text-secondary select-none">
                    –
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredIssues.length === 0 && (
            <div className="p-8 text-center text-xs text-text-secondary italic">
              No active cycle issues. Switch workspaces or speak to Aura to create one!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
