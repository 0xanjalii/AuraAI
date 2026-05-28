"use client";

import React, { useState, useEffect } from "react";
import { X, CornerDownLeft, Sparkles } from "lucide-react";
import { useIssues, Priority, IssueStatus } from "@/store/issues-store";

interface NewIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: IssueStatus;
}

export default function NewIssueModal({ isOpen, onClose, defaultStatus = "Todo" }: NewIssueModalProps) {
  const { addIssue } = useIssues();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<IssueStatus>(defaultStatus);
  const [priority, setPriority] = useState<Priority>("medium");
  const [assignee, setAssignee] = useState("");

  // Sync default status if it changes (e.g. clicking quick add on different columns)
  useEffect(() => {
    if (isOpen) {
      setStatus(defaultStatus);
      setTitle("");
      setAssignee("");
      setPriority("medium");
    }
  }, [isOpen, defaultStatus]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addIssue(title.trim(), status, priority, assignee.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-canvas/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Card */}
      <div 
        className="w-full max-w-lg bg-sidebar border border-border-main rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        id="new-issue-modal"
      >
        {/* Header */}
        <div className="h-11 px-4 border-b border-border-main flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-blue" />
            <span className="text-xs font-semibold text-text-primary">Create New Issue</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#222226] text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            id="btn-close-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col gap-4">
          {/* Issue Title Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="issue-title" className="text-[10px] uppercase font-semibold tracking-wider text-text-secondary">
              Title
            </label>
            <input
              type="text"
              id="issue-title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="h-9 px-3 rounded-lg border border-border-main bg-canvas text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-[#4c4f56] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status Selector */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-status" className="text-[10px] uppercase font-semibold tracking-wider text-text-secondary">
                Status
              </label>
              <select
                id="issue-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                className="h-8 px-2.5 rounded-lg border border-border-main bg-canvas text-xs text-text-primary focus:outline-none focus:border-[#4c4f56] transition-colors"
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-priority" className="text-[10px] uppercase font-semibold tracking-wider text-text-secondary">
                Priority
              </label>
              <select
                id="issue-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="h-8 px-2.5 rounded-lg border border-border-main bg-canvas text-xs text-text-primary focus:outline-none focus:border-[#4c4f56] transition-colors"
              >
                <option value="no_priority">No Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Assignee Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="issue-assignee" className="text-[10px] uppercase font-semibold tracking-wider text-text-secondary">
              Assignee Name (Optional)
            </label>
            <input
              type="text"
              id="issue-assignee"
              placeholder="e.g. Marcus Aurelius"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="h-8 px-3 rounded-lg border border-border-main bg-canvas text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-[#4c4f56] transition-colors"
            />
          </div>

          {/* Bottom Actions Bar */}
          <div className="border-t border-border-main/50 pt-3 mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-text-secondary">
              <Sparkles className="w-3 h-3 text-accent-purple" />
              <span>Or close modal and click microphone to speak!</span>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded-lg border border-border-main text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 px-3 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-submit-new-issue"
              >
                <span>Create</span>
                <CornerDownLeft className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
