"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  AlertCircle, 
  ChevronUp, 
  ChevronDown, 
  Minus, 
  MoreHorizontal, 
  Trash2, 
  ArrowRight,
  User 
} from "lucide-react";
import { Issue, Priority, IssueStatus, useIssues } from "@/store/issues-store";

interface IssueCardProps {
  issue: Issue;
}

export default function IssueCard({ issue }: IssueCardProps) {
  const { updateIssueStatus, deleteIssue, setSelectedIssueId } = useIssues();

  // Get corresponding priority icon and colors
  const getPriorityDetails = (priority: Priority) => {
    switch (priority) {
      case "urgent":
        return {
          icon: AlertCircle,
          color: "text-red-500 bg-red-500/10",
          label: "Urgent",
        };
      case "high":
        return {
          icon: ChevronUp,
          color: "text-amber-500 bg-amber-500/10",
          label: "High",
        };
      case "medium":
        return {
          icon: Minus,
          color: "text-blue-400 bg-blue-400/10",
          label: "Medium",
        };
      case "low":
        return {
          icon: ChevronDown,
          color: "text-emerald-500 bg-emerald-500/10",
          label: "Low",
        };
      default:
        return {
          icon: MoreHorizontal,
          color: "text-text-secondary bg-text-secondary/10",
          label: "No priority",
        };
    }
  };

  const { icon: PriorityIcon, color: priorityColor, label: priorityLabel } = getPriorityDetails(issue.priority);

  // Cycle status for manual board movement convenience
  const cycleStatus = () => {
    const statuses: IssueStatus[] = ["Todo", "In Progress", "Done"];
    const currentIndex = statuses.indexOf(issue.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    updateIssueStatus(issue.id, statuses[nextIndex]);
  };

  return (
    <motion.div
      layoutId={`card-${issue.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, scale: 1.015, borderColor: "#3f4247" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={() => setSelectedIssueId(issue.id)}
      className={`group relative p-3 rounded-lg border border-border-main bg-[#121316] hover:bg-[#16171A] cursor-pointer flex flex-col gap-2.5 shadow-sm ${
        issue.status === "In Progress" ? "animate-pulse-inprogress" : "hover:border-[#3f4247]"
      }`}
      id={`card-${issue.id.toLowerCase()}`}
    >
      {/* Top Details (Key and Priority) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-secondary font-mono tracking-wider font-semibold">
            {issue.id}
          </span>
          <span
            className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-medium border border-transparent ${priorityColor}`}
            title={`Priority: ${priorityLabel}`}
          >
            <PriorityIcon className="w-2.5 h-2.5" />
            <span>{priorityLabel}</span>
          </span>
        </div>

        {/* Delete button (displays on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteIssue(issue.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#222226] text-text-secondary hover:text-red-400 transition-all duration-150 cursor-pointer"
          title="Delete Issue"
          id={`delete-${issue.id.toLowerCase()}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-text-primary leading-snug break-words pr-4">
        {issue.title}
      </h4>

      {/* Card Footer (Assignee Avatar & Actions) */}
      <div className="flex items-center justify-between pt-1 border-t border-border-main/30">
        <div className="flex items-center gap-1.5">
          {issue.assignee ? (
            <div 
              className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-accent-purple/40 to-accent-blue/40 border border-border-main flex items-center justify-center text-[8px] font-bold text-text-primary"
              title={`Assignee: ${issue.assignee.name}`}
            >
              {issue.assignee.avatarUrl}
            </div>
          ) : (
            <div 
              className="w-5.5 h-5.5 rounded-full bg-canvas border border-border-main flex items-center justify-center"
              title="Unassigned"
            >
              <User className="w-2.5 h-2.5 text-text-secondary" />
            </div>
          )}
          <span className="text-[10px] text-text-secondary">
            {issue.assignee ? issue.assignee.name : "Unassigned"}
          </span>
        </div>

        {/* Simple inline shift control */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            cycleStatus();
          }}
          className="p-1 rounded hover:bg-[#222226] text-text-secondary hover:text-accent-blue transition-all duration-150 cursor-pointer flex items-center gap-0.5 text-[9px] font-medium"
          title="Cycle Status"
        >
          <span>Move</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>
    </motion.div>
  );
}
