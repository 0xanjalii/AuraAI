"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Calendar, User, Sliders, CheckSquare, AlignLeft, Clock } from "lucide-react";
import { useIssues, Priority, IssueStatus } from "@/store/issues-store";

export default function IssueDetailDrawer() {
  const { selectedIssueId, setSelectedIssueId, issues, updateIssue, deleteIssue } = useIssues();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Retrieve current active issue details
  const issue = issues.find((i) => i.id === selectedIssueId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>("Todo");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assigneeName, setAssigneeName] = useState("");

  // Sync state variables with issue changes
  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || "");
      setStatus(issue.status);
      setPriority(issue.priority);
      setAssigneeName(issue.assignee ? issue.assignee.name : "");
    }
  }, [issue]);

  // Handle outside click to close drawer
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node) &&
        // Prevent click in modals or select dropdowns closing it accidentally
        !(e.target as HTMLElement).closest("#new-issue-modal") &&
        !(e.target as HTMLElement).closest(".fixed")
      ) {
        // Only close if it's clicked outside the drawer container
        const path = e.composedPath();
        const isClickInsideCard = path.some(
          (el: any) => el.id && typeof el.id === "string" && el.id.startsWith("card-")
        );
        if (!isClickInsideCard) {
          setSelectedIssueId(null);
        }
      }
    };

    if (selectedIssueId) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [selectedIssueId, setSelectedIssueId]);

  if (!issue) return null;

  const handleUpdateField = (field: string, value: any) => {
    if (field === "assigneeName") {
      const name = value.trim();
      updateIssue(issue.id, {
        assignee: name ? { name, avatarUrl: name.split(" ").map((n: string) => n[0]).join("") } : null,
      });
    } else {
      updateIssue(issue.id, { [field]: value });
    }
  };

  return (
    <AnimatePresence>
      {selectedIssueId && (
        <motion.div
          ref={drawerRef}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="w-full max-w-lg bg-sidebar border-l border-border-main shadow-2xl h-full fixed top-0 right-0 z-40 flex flex-col select-none"
          id="issue-detail-drawer"
        >
          {/* Drawer Header */}
          <div className="h-12 border-b border-border-main px-4 flex items-center justify-between bg-sidebar/50 backdrop-blur">
            <span className="text-xs font-mono text-text-secondary tracking-wider font-semibold">
              {issue.id}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  deleteIssue(issue.id);
                  setSelectedIssueId(null);
                }}
                className="p-1.5 rounded hover:bg-[#222226] text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                title="Delete Issue"
                id="btn-drawer-delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedIssueId(null)}
                className="p-1.5 rounded hover:bg-[#222226] text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Close Panel"
                id="btn-drawer-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Scroll Body */}
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border-main">
            {/* Left Main Edit Section */}
            <div className="flex-1 p-5 flex flex-col gap-4">
              {/* Title input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleUpdateField("title", title)}
                className="bg-transparent text-sm font-semibold text-text-primary border-none focus:outline-none focus:ring-0 w-full resize-none pb-1 hover:bg-[#222226]/30 p-1.5 rounded transition-colors"
                placeholder="Issue Title"
              />

              {/* Description Input */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Description</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleUpdateField("description", description)}
                  placeholder="Add a detailed description for this task..."
                  className="bg-transparent text-xs text-text-secondary border border-transparent focus:border-border-main/50 hover:bg-[#222226]/20 p-2.5 rounded-lg focus:outline-none w-full min-h-[140px] resize-y leading-relaxed focus:bg-canvas/50 transition-all"
                />
              </div>

              {/* Timeline Info */}
              <div className="border-t border-border-main/30 pt-4 flex flex-col gap-2 text-[10px] text-text-secondary">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created: {new Date(issue.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last status action logged dynamically</span>
                </div>
              </div>
            </div>

            {/* Right Meta Column Section */}
            <div className="w-full md:w-48 p-4 bg-[#141517]/30 flex flex-col gap-4 text-xs">
              <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1 border-b border-border-main/40 pb-2">
                <Sliders className="w-3 h-3 text-accent-blue" />
                <span>Attributes</span>
              </div>

              {/* Status Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as IssueStatus);
                    handleUpdateField("status", e.target.value);
                  }}
                  className="h-8 px-2 rounded bg-sidebar border border-border-main text-text-primary focus:outline-none focus:border-[#4c4f56]"
                >
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary font-medium">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value as Priority);
                    handleUpdateField("priority", e.target.value);
                  }}
                  className="h-8 px-2 rounded bg-sidebar border border-border-main text-text-primary focus:outline-none focus:border-[#4c4f56]"
                >
                  <option value="no_priority">No priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assignee Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary font-medium">Assignee</label>
                <div className="relative">
                  <User className="w-3 h-3 text-text-secondary absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    onBlur={() => handleUpdateField("assigneeName", assigneeName)}
                    placeholder="Unassigned"
                    className="w-full h-8 pl-7 pr-2 rounded bg-sidebar border border-border-main text-text-primary focus:outline-none focus:border-[#4c4f56]"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
