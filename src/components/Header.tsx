"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  SlidersHorizontal, 
  ArrowUpDown, 
  Search, 
  User2, 
  Bell,
  Check,
  Calendar,
  Layers,
  ChevronDown
} from "lucide-react";
import { useIssues } from "@/store/issues-store";

export default function Header() {
  const { 
    filteredIssues, 
    searchQuery, 
    setSearchQuery, 
    filters, 
    setFilters, 
    sortBy, 
    setSortBy,
    currentView 
  } = useIssues();

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Priority filter options
  const priorityOptions = [
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "no_priority", label: "No Priority" },
  ];

  const handlePriorityToggle = (priority: string) => {
    setFilters((prev) => {
      const active = prev.priority.includes(priority)
        ? prev.priority.filter((p) => p !== priority)
        : [...prev.priority, priority];
      return { ...prev, priority: active };
    });
  };

  const clearFilters = () => {
    setFilters({ priority: [], assignee: [] });
  };

  return (
    <header className="h-12 border-b border-border-main bg-canvas flex items-center justify-between px-6 select-none relative">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer">Projects</span>
        <span className="text-[#383A3F]">/</span>
        <span className="text-text-primary font-medium capitalize">{currentView} View</span>
        <span className="text-[10px] text-text-secondary bg-[#222226] border border-border-main px-1.5 py-0.2 rounded-full ml-2">
          {filteredIssues.length} matches
        </span>
      </div>

      {/* Action Controls & Utilities */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative group hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search key, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-40 h-7 pl-8 pr-2.5 rounded-md border border-border-main bg-[#16171A] text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:w-56 focus:border-[#4c4f56] transition-all"
            id="input-board-search"
          />
        </div>

        {/* Filters & Sorting buttons */}
        <div className="flex items-center gap-1.5 border-l border-border-main pl-4 relative">
          
          {/* FILTER DROPDOWN TRIGGER */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`h-7 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                filterOpen || filters.priority.length > 0
                  ? "bg-[#2b203a] text-accent-purple border-accent-purple/30"
                  : "bg-transparent text-text-secondary border-border-main hover:text-text-primary hover:bg-[#222226]/40"
              }`}
              id="btn-filter-trigger"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {filters.priority.length > 0 && (
                <span className="text-[9px] bg-accent-purple text-white px-1.5 py-0.1 rounded-full shrink-0 font-bold">
                  {filters.priority.length}
                </span>
              )}
            </button>

            {/* FILTER PANEL */}
            {filterOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-48 bg-[#16171A] border border-border-main rounded-lg shadow-2xl p-1.5 z-50 flex flex-col gap-1"
                id="filter-popover"
              >
                <div className="flex items-center justify-between text-[9px] uppercase font-bold text-text-secondary px-2 py-1 border-b border-border-main/50 select-none">
                  <span>Filter by Priority</span>
                  {filters.priority.length > 0 && (
                    <button onClick={clearFilters} className="text-accent-blue hover:underline cursor-pointer normal-case font-medium">
                      Reset
                    </button>
                  )}
                </div>
                {priorityOptions.map((opt) => {
                  const active = filters.priority.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handlePriorityToggle(opt.value)}
                      className={`w-full text-left h-7 px-2 rounded text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                        active 
                          ? "bg-[#222226] text-text-primary font-medium" 
                          : "text-text-secondary hover:text-text-primary hover:bg-[#222226]/30"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {active && <Check className="w-3 h-3 text-text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* SORT DROPDOWN TRIGGER */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className={`h-7 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                sortOpen
                  ? "bg-[#20273a] text-accent-blue border-accent-blue/30"
                  : "bg-transparent text-text-secondary border-border-main hover:text-text-primary hover:bg-[#222226]/40"
              }`}
              id="btn-sort-trigger"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort</span>
              <span className="text-[9px] text-text-secondary font-mono capitalize">({sortBy})</span>
            </button>

            {/* SORT PANEL */}
            {sortOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-40 bg-[#16171A] border border-border-main rounded-lg shadow-2xl p-1 z-50 flex flex-col gap-0.5"
                id="sort-popover"
              >
                <div className="text-[9px] uppercase font-bold text-text-secondary px-2 py-1 border-b border-border-main/50 select-none">
                  Sort Board Items
                </div>
                {[
                  { value: "priority", label: "Priority (Weighted)" },
                  { value: "title", label: "Alphabetical Title" },
                  { value: "date", label: "Created Date" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value as any);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left h-7 px-2 rounded text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                      sortBy === opt.value 
                        ? "bg-[#222226] text-text-primary font-medium" 
                        : "text-text-secondary hover:text-text-primary hover:bg-[#222226]/30"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && <Check className="w-3 h-3 text-text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* User profile & Notifications */}
        <div className="flex items-center gap-2 border-l border-border-main pl-4">
          <button className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-[#222226]/40 transition-colors relative cursor-pointer">
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-purple" />
          </button>

          <div className="w-6 h-6 rounded-full bg-[#383A3F] border border-border-main flex items-center justify-center cursor-pointer overflow-hidden hover:border-text-secondary transition-colors">
            <User2 className="w-3.5 h-3.5 text-text-secondary" />
          </div>
        </div>
      </div>
    </header>
  );
}
