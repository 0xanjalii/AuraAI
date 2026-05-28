"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { Circle, CircleDot, CheckCircle2, Plus, MoreHorizontal } from "lucide-react";
import { useIssues, IssueStatus } from "@/store/issues-store";
import IssueCard from "./IssueCard";

interface KanbanBoardProps {
  onQuickAdd: (status: IssueStatus) => void;
}

export default function KanbanBoard({ onQuickAdd }: KanbanBoardProps) {
  const { filteredIssues } = useIssues();

  const columns: { status: IssueStatus; label: string; icon: React.ComponentType<any>; color: string }[] = [
    {
      status: "Todo",
      label: "Todo",
      icon: Circle,
      color: "text-text-secondary",
    },
    {
      status: "In Progress",
      label: "In Progress",
      icon: CircleDot,
      color: "text-accent-blue animate-pulse",
    },
    {
      status: "Done",
      label: "Done",
      icon: CheckCircle2,
      color: "text-accent-purple",
    },
  ];

  return (
    <div className="flex-1 overflow-x-auto bg-canvas bg-grid-pattern p-6 flex gap-4 min-w-[800px] select-none h-full align-stretch">
      {columns.map((column) => {
        const ColumnIcon = column.icon;
        const columnIssues = filteredIssues.filter((issue) => issue.status === column.status);

        return (
          <div
            key={column.status}
            id={`column-${column.status.toLowerCase().replace(/\s+/g, "-")}`}
            className="flex-1 flex flex-col bg-sidebar/20 rounded-xl border border-border-main/40 p-3 h-full min-w-[250px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <ColumnIcon className={`w-3.5 h-3.5 ${column.color}`} />
                <span className="text-xs font-semibold text-text-primary">{column.label}</span>
                <span className="text-[10px] text-text-secondary bg-[#1a1a1e] border border-border-main px-1.5 py-0.2 rounded-full">
                  {columnIssues.length}
                </span>
              </div>

              {/* Column Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onQuickAdd(column.status)}
                  className="p-1 rounded hover:bg-[#222226] text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  title={`Create issue in ${column.label}`}
                  id={`btn-quick-add-${column.status.toLowerCase()}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1 rounded hover:bg-[#222226] text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  title="Column Actions"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Column Scroll Container for Issue Cards */}
            <div 
              className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 min-h-[400px]"
              id={`column-cards-${column.status.toLowerCase()}`}
            >
              <AnimatePresence mode="popLayout">
                {columnIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </AnimatePresence>

              {columnIssues.length === 0 && (
                <div className="flex-1 border border-dashed border-border-main/50 rounded-lg flex flex-col items-center justify-center p-6 text-center text-text-secondary opacity-60">
                  <p className="text-[10px]">No issues in this column</p>
                  <button 
                    onClick={() => onQuickAdd(column.status)}
                    className="text-[10px] text-accent-blue mt-1 hover:underline cursor-pointer"
                  >
                    Create Issue
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
