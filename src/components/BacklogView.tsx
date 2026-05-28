"use client";

import React, { useState, useMemo } from "react";
import { Circle, CircleDot, CheckCircle2, Search, Inbox, AlertTriangle } from "lucide-react";
import { useIssues } from "@/store/issues-store";

export default function BacklogView() {
  const { filteredIssues, setSelectedIssueId, searchQuery, setSearchQuery } = useIssues();
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");

  // Filter local tab "Mine" vs "All"
  const tabIssues = useMemo(() => {
    let list = filteredIssues;
    if (activeTab === "mine") {
      // Mock filter for "Mine": filters issues assigned to John Doe or Sarah Connor
      list = list.filter((i) => i.assignee?.name === "John Doe" || i.assignee?.name === "Sarah Connor");
    }
    return list;
  }, [filteredIssues, activeTab]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <CheckCircle2 className="w-3.5 h-3.5 text-accent-purple shrink-0" />;
      case "In Progress":
        return <CircleDot className="w-3.5 h-3.5 text-accent-blue shrink-0 animate-pulse" />;
      default:
        return <Circle className="w-3.5 h-3.5 text-text-secondary shrink-0" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-canvas flex flex-col gap-4 select-none h-full max-w-5xl mx-auto w-full">
      {/* Tab Selectors & Inner Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-main pb-2 gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === "all"
                ? "bg-[#222226] text-text-primary border border-border-main"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            All Workspace Issues
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === "mine"
                ? "bg-[#222226] text-text-primary border border-border-main"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Assigned to Me
          </button>
        </div>

        {/* Dense Counter */}
        <span className="text-[10px] text-text-secondary font-mono">
          Showing {tabIssues.length} of {filteredIssues.length} issues
        </span>
      </div>

      {/* Spreadsheet List */}
      <div className="flex flex-col border border-border-main rounded-xl overflow-hidden divide-y divide-border-main bg-sidebar/5 shadow-sm">
        {/* Table Headings */}
        <div className="px-4 py-2 bg-sidebar/30 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-text-secondary select-none">
          <div className="flex items-center gap-4">
            <span className="w-16">Key</span>
            <span>Title</span>
          </div>
          <div className="flex items-center gap-12 text-right">
            <span className="w-16 text-center">Status</span>
            <span className="w-16 text-center">Priority</span>
            <span className="w-16 text-center">Assignee</span>
          </div>
        </div>

        {/* Rows */}
        {tabIssues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => setSelectedIssueId(issue.id)}
            className="px-4 py-2.5 flex items-center justify-between hover:bg-[#222226]/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-4 min-w-0">
              {/* Key */}
              <span className="w-16 text-xs font-mono font-semibold text-text-secondary group-hover:text-text-primary transition-colors shrink-0">
                {issue.id}
              </span>
              
              {/* Title */}
              <h4 className="text-xs font-semibold text-text-primary truncate pr-4 max-w-[240px] sm:max-w-md">
                {issue.title}
              </h4>
            </div>

            {/* Attributes columns */}
            <div className="flex items-center gap-12 text-xs shrink-0 select-none">
              {/* Status */}
              <span className="w-16 flex items-center justify-center gap-1.5 text-text-secondary">
                {getStatusIcon(issue.status)}
                <span className="text-[10px] hidden sm:inline">{issue.status}</span>
              </span>

              {/* Priority */}
              <span className="w-16 text-center">
                <span className="text-[9px] text-text-secondary bg-[#16171a] px-1.5 py-0.5 rounded border border-border-main/50 capitalize font-medium">
                  {issue.priority.replace("_", " ")}
                </span>
              </span>

              {/* Assignee */}
              <div className="w-16 flex justify-center">
                {issue.assignee ? (
                  <div 
                    className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-accent-purple/40 to-accent-blue/40 border border-border-main flex items-center justify-center text-[8px] font-bold text-text-primary"
                    title={issue.assignee.name}
                  >
                    {issue.assignee.avatarUrl}
                  </div>
                ) : (
                  <span className="text-[10px] text-text-secondary/50 font-semibold">–</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {tabIssues.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Inbox className="w-8 h-8 text-text-secondary/40" />
            <p className="text-xs text-text-secondary italic">No issues match this list filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
