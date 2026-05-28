"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export type Priority = "no_priority" | "low" | "medium" | "high" | "urgent";
export type IssueStatus = "Todo" | "In Progress" | "Done";

export interface Assignee {
  name: string;
  avatarUrl?: string;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: Priority;
  assignee: Assignee | null;
  createdAt: string;
}

interface LLMPayload {
  action: "CREATE_ISSUE" | "UPDATE_STATUS" | "UPDATE_ISSUE" | "DELETE_ISSUE" | "UNKNOWN";
  issueId?: string;
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: Priority;
  assigneeName?: string;
  rawText: string;
}

interface LogEntry {
  timestamp: string;
  type: "info" | "voice" | "llm_request" | "llm_response" | "state_change" | "error";
  message: string;
  details?: string;
}

interface IssuesContextType {
  issues: Issue[];
  filteredIssues: Issue[];
  logs: LogEntry[];
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  currentView: "Board" | "Active Cycle" | "Backlog" | "Settings";
  setCurrentView: (view: "Board" | "Active Cycle" | "Backlog" | "Settings") => void;
  activeWorkspace: string;
  setActiveWorkspace: (workspace: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: { priority: string[]; assignee: string[] };
  setFilters: React.Dispatch<React.SetStateAction<{ priority: string[]; assignee: string[] }>>;
  sortBy: "priority" | "title" | "date";
  setSortBy: (sort: "priority" | "title" | "date") => void;
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
  
  // Supabase states
  supabaseCreds: { url: string; key: string } | null;
  connectSupabase: (url: string, key: string) => void;
  disconnectSupabase: () => void;

  addIssue: (title: string, status: IssueStatus, priority: Priority, assigneeName?: string) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  deleteIssue: (id: string) => void;
  processVoiceCommand: (text: string) => Promise<LLMPayload>;
  clearLogs: () => void;
  addLog: (type: LogEntry["type"], message: string, details?: string) => void;
}

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

const initialIssues: Issue[] = [
  // Workspace: Aura AI Agent (Prefix: AUR-)
  {
    id: "AUR-1",
    title: "Design high-fidelity Linear dark mode dashboard",
    description: "Match Linear's pixel-perfect sidebar, kanban, borders and layouts.",
    status: "In Progress",
    priority: "high",
    assignee: { name: "Sarah Connor", avatarUrl: "SC" },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "AUR-2",
    title: "Integrate ElevenLabs Speech Engine Web SDK",
    description: "Connect ElevenLabs client socket interface for real-time streaming audio transcriptions.",
    status: "Todo",
    priority: "urgent",
    assignee: { name: "John Doe", avatarUrl: "JD" },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "AUR-3",
    title: "Scaffold Supabase database connection and schemas",
    description: "Write DB schemas for boards, columns, and issue cards.",
    status: "Todo",
    priority: "medium",
    assignee: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "AUR-4",
    title: "Set up Framer Motion gesture and layout animations",
    description: "Add layout transitions to make card drag/movement smooth and premium.",
    status: "Done",
    priority: "low",
    assignee: { name: "Ada Lovelace", avatarUrl: "AL" },
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "AUR-5",
    title: "Optimize audio input compression and latency",
    description: "Fine-tune microphone capture sample rates for fast LLM inference responses.",
    status: "Todo",
    priority: "no_priority",
    assignee: { name: "Sarah Connor", avatarUrl: "SC" },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },

  // Workspace: Personal Tasks (Prefix: PERS-)
  {
    id: "PERS-1",
    title: "Pay monthly electricity and internet bills",
    description: "Submit online payment before the due date on the 5th.",
    status: "Todo",
    priority: "medium",
    assignee: null,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "PERS-2",
    title: "Read 'Clean Architecture' chapter 4-8",
    description: "Focus on component principles and SOLID architectures.",
    status: "In Progress",
    priority: "low",
    assignee: { name: "Marcus Aurelius", avatarUrl: "MA" },
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "PERS-3",
    title: "Book direct flight to San Francisco",
    description: "Fly out for the developer summit. Use card points.",
    status: "Done",
    priority: "high",
    assignee: null,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },

  // Workspace: Hackathon Project (Prefix: HACK-)
  {
    id: "HACK-1",
    title: "Write hackathon pitch deck slides",
    description: "Summarize value proposition, architecture, and marketing strategy.",
    status: "Todo",
    priority: "high",
    assignee: { name: "Ada Lovelace", avatarUrl: "AL" },
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "HACK-2",
    title: "Implement OpenAI function calling router",
    description: "Direct parsed user speech transcripts to trigger UI hook dispatches.",
    status: "In Progress",
    priority: "urgent",
    assignee: { name: "John Doe", avatarUrl: "JD" },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "HACK-3",
    title: "Test voice recognition latency metrics",
    description: "Aim for sub-500ms audio transcribing turnarounds.",
    status: "Todo",
    priority: "low",
    assignee: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "HACK-4",
    title: "Record 2-minute product demo video",
    description: "Show off voice command, UI transitions, and settings dashboard.",
    status: "Todo",
    priority: "medium",
    assignee: { name: "Sarah Connor", avatarUrl: "SC" },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export function IssuesProvider({ children }: { children: React.ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  // Navigation & Interactive Filters States
  const [currentView, setCurrentView] = useState<"Board" | "Active Cycle" | "Backlog" | "Settings">("Board");
  const [activeWorkspace, setActiveWorkspace] = useState("Aura AI Agent");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{ priority: string[]; assignee: string[] }>({
    priority: [],
    assignee: [],
  });
  const [sortBy, setSortBy] = useState<"priority" | "title" | "date">("priority");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Supabase states
  const [supabaseCreds, setSupabaseCreds] = useState<{ url: string; key: string } | null>(null);

  // Counter maps to track incremental index additions per prefix
  const [counters, setCounters] = useState<Record<string, number>>({
    AUR: 6,
    PERS: 4,
    HACK: 5,
  });

  const addLog = (type: LogEntry["type"], message: string, details?: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50));
  };

  // Load Supabase credentials or offline local tasks from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("aura_supabase_creds");
    if (saved) {
      try {
        const creds = JSON.parse(saved);
        if (creds.url && creds.key) {
          setSupabaseCreds(creds);
          addLog("info", "Loaded saved Supabase credentials. Connecting to database...");
          return; // Let the Supabase useEffect fetch issues
        }
      } catch (e) {
        console.error("Failed to parse saved credentials", e);
      }
    }

    // If no Supabase connection, load local sandbox tasks
    const savedIssues = localStorage.getItem("aura_local_issues");
    if (savedIssues) {
      try {
        const parsed = JSON.parse(savedIssues);
        setIssues(parsed);
        addLog("info", "Loaded persistent issues from local browser storage.");
      } catch (e) {
        setIssues(initialIssues);
      }
    } else {
      setIssues(initialIssues);
      localStorage.setItem("aura_local_issues", JSON.stringify(initialIssues));
      addLog("info", "Initialized default offline issues workspace.");
    }
  }, []);

  // Sync issues to localStorage when in offline/sandbox state
  useEffect(() => {
    if (!supabaseCreds && issues.length > 0) {
      localStorage.setItem("aura_local_issues", JSON.stringify(issues));
    }
  }, [issues, supabaseCreds]);

  // Effect to pull issues from Supabase when credentials are connected
  useEffect(() => {
    const client = getSupabaseClient(supabaseCreds?.url, supabaseCreds?.key);
    if (!client) return;

    const fetchSupabaseIssues = async () => {
      addLog("info", "Syncing workspace with active Supabase database table 'issues'...");
      try {
        const { data, error } = await client.from("issues").select("*");
        if (error) {
          addLog("error", `Supabase select query failed: ${error.message}. Make sure table 'issues' exists with schema.`);
        } else if (data) {
          const mapped: Issue[] = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description || "",
            status: (item.status as IssueStatus) || "Todo",
            priority: (item.priority as Priority) || "medium",
            assignee: item.assignee_name 
              ? { name: item.assignee_name, avatarUrl: item.assignee_name.split(" ").map((n: string) => n[0]).join("") } 
              : null,
            createdAt: item.created_at || new Date().toISOString(),
          }));
          setIssues(mapped);
          
          // Align dynamic incremental counter prefixes
          const aurCount = mapped.filter(i => i.id.startsWith("AUR-")).length + 1;
          const persCount = mapped.filter(i => i.id.startsWith("PERS-")).length + 1;
          const hackCount = mapped.filter(i => i.id.startsWith("HACK-")).length + 1;
          setCounters({
            AUR: Math.max(aurCount, 6),
            PERS: Math.max(persCount, 4),
            HACK: Math.max(hackCount, 5)
          });

          addLog("state_change", `Sync complete: Loaded ${data.length} records from Supabase.`);
        }
      } catch (e: any) {
        addLog("error", `Supabase Connection Crash: ${e.message}`);
      }
    };

    fetchSupabaseIssues();
  }, [supabaseCreds]);

  // Connect and store Supabase credentials
  const connectSupabase = (url: string, key: string) => {
    localStorage.setItem("aura_supabase_creds", JSON.stringify({ url, key }));
    setSupabaseCreds({ url, key });
  };

  // Disconnect Supabase and reset client-side fallback
  const disconnectSupabase = () => {
    localStorage.removeItem("aura_supabase_creds");
    setSupabaseCreds(null);
    setIssues(initialIssues);
    addLog("info", "Disconnected from Supabase DB. Restored local sandbox state.");
  };

  // Compute derived filtered and sorted list of issues
  const filteredIssues = useMemo(() => {
    let list = issues.filter((issue) => {
      // 1. Filter by active workspace ID prefix
      if (activeWorkspace === "Aura AI Agent") return issue.id.startsWith("AUR-");
      if (activeWorkspace === "Personal Tasks") return issue.id.startsWith("PERS-");
      if (activeWorkspace === "Hackathon Project") return issue.id.startsWith("HACK-");
      return true;
    });

    // 2. Filter by search query (checks Title, Description, and ID)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (issue) =>
          issue.id.toLowerCase().includes(q) ||
          issue.title.toLowerCase().includes(q) ||
          (issue.description && issue.description.toLowerCase().includes(q))
      );
    }

    // 3. Filter by priorities selected
    if (filters.priority.length > 0) {
      list = list.filter((issue) => filters.priority.includes(issue.priority));
    }

    // 4. Filter by assignees selected
    if (filters.assignee.length > 0) {
      list = list.filter((issue) => {
        if (!issue.assignee) return filters.assignee.includes("Unassigned");
        return filters.assignee.includes(issue.assignee.name);
      });
    }

    // 5. Sort issues
    list = [...list].sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "priority") {
        const priorityWeights = { urgent: 4, font: 3, high: 3, medium: 2, low: 1, no_priority: 0 };
        return priorityWeights[b.priority] - priorityWeights[a.priority];
      }
      return 0;
    });

    return list;
  }, [issues, activeWorkspace, searchQuery, filters, sortBy]);

  const addIssue = (title: string, status: IssueStatus, priority: Priority, assigneeName?: string) => {
    let prefix = "AUR";
    if (activeWorkspace === "Personal Tasks") prefix = "PERS";
    if (activeWorkspace === "Hackathon Project") prefix = "HACK";

    const count = counters[prefix];
    const newId = `${prefix}-${count}`;

    const newIssue: Issue = {
      id: newId,
      title,
      status,
      priority,
      assignee: assigneeName ? { name: assigneeName, avatarUrl: assigneeName.split(" ").map((n) => n[0]).join("") } : null,
      createdAt: new Date().toISOString(),
    };

    // Update client-state
    setIssues((prev) => [...prev, newIssue]);
    setCounters((prev) => ({ ...prev, [prefix]: count + 1 }));
    addLog("state_change", `Created issue ${newId}: "${title}"`, `Priority: ${priority} | Status: ${status}`);

    // Sync to Supabase if connected
    const client = getSupabaseClient(supabaseCreds?.url, supabaseCreds?.key);
    if (client) {
      client.from("issues").insert({
        id: newId,
        title,
        status,
        priority,
        description: "",
        assignee_name: assigneeName || null,
        created_at: newIssue.createdAt,
      }).then(({ error }: { error: any }) => {
        if (error) {
          addLog("error", `Supabase Insert Failed: ${error.message}`);
        } else {
          addLog("info", `Supabase Sync Successful: Created ${newId}`);
        }
      });
    }
  };

  const updateIssue = (id: string, updates: Partial<Issue>) => {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === id ? { ...issue, ...updates } : issue))
    );
    
    const keys = Object.keys(updates).join(", ");
    addLog("state_change", `Updated ${id} attributes: [${keys}]`, JSON.stringify(updates, null, 2));

    // Sync to Supabase if connected
    const client = getSupabaseClient(supabaseCreds?.url, supabaseCreds?.key);
    if (client) {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.assignee !== undefined) {
        dbUpdates.assignee_name = updates.assignee ? updates.assignee.name : null;
      }

      client.from("issues").update(dbUpdates).eq("id", id).then(({ error }: { error: any }) => {
        if (error) {
          addLog("error", `Supabase Update Failed for ${id}: ${error.message}`);
        } else {
          addLog("info", `Supabase Sync Successful: Updated ${id}`);
        }
      });
    }
  };

  const updateIssueStatus = (id: string, status: IssueStatus) => {
    updateIssue(id, { status });
  };

  const deleteIssue = (id: string) => {
    setIssues((prev) => prev.filter((issue) => issue.id !== id));
    if (selectedIssueId === id) setSelectedIssueId(null);
    addLog("state_change", `Deleted issue ${id}`);

    // Sync to Supabase if connected
    const client = getSupabaseClient(supabaseCreds?.url, supabaseCreds?.key);
    if (client) {
      client.from("issues").delete().eq("id", id).then(({ error }: { error: any }) => {
        if (error) {
          addLog("error", `Supabase Delete Failed for ${id}: ${error.message}`);
        } else {
          addLog("info", `Supabase Sync Successful: Deleted ${id}`);
        }
      });
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // NLP Command Parser (Calling OpenRouter API with dynamic fallback)
  const processVoiceCommand = async (text: string): Promise<LLMPayload> => {
    addLog("voice", `Captured Speech Transcript: "${text}"`);
    addLog("llm_request", "Routing audio transcription payload to backend LLM function /api/agent/command...");

    let payload: LLMPayload = {
      action: "UNKNOWN",
      rawText: text,
    };

    let useFallback = false;

    try {
      const response = await fetch("/api/agent/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          workspace: activeWorkspace,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        payload = { ...data, rawText: text };
      } else {
        const errJson = await response.json().catch(() => ({}));
        addLog(
          "error", 
          `OpenRouter API Request failed (${response.status}): ${errJson.error || "Unknown Server Error"}`
        );
        useFallback = true;
      }
    } catch (e: any) {
      addLog("error", `OpenRouter API connection failed: ${e.message || e}`);
      useFallback = true;
    }

    if (useFallback) {
      addLog("info", "Executing client-side regex voice simulator fallback...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      const cleanText = text.toLowerCase().trim();
      let prefix = "aur";
      if (activeWorkspace === "Personal Tasks") prefix = "pers";
      if (activeWorkspace === "Hackathon Project") prefix = "hack";

      const moveRegex = new RegExp(`(?:move|change|update|set|transition)\\s+${prefix}[- ]?(\\d+)\\s+(?:status\\s+)?to\\s+([a-zA-Z\\s]+)`, "i");
      const moveMatch = cleanText.match(moveRegex);

      const completeRegex = new RegExp(`(?:complete|resolve|finish|close|done)\\s+${prefix}[- ]?(\\d+)`, "i");
      const completeMatch = cleanText.match(completeRegex);

      const createRegex = /(?:create|add|new|make)\s+(?:a\s+)?(?:(low|medium|high|urgent)\s+priority\s+)?(?:issue|ticket|task)?\s*(?:to\s+)?(.+)/i;
      const createMatch = cleanText.match(createRegex);

      const deleteRegex = new RegExp(`(?:delete|remove|destroy)\\s+${prefix}[- ]?(\\d+)`, "i");
      const deleteMatch = cleanText.match(deleteRegex);

      const updateTitleRegex = new RegExp(`(?:change|update|set)\\s+(?:the\\s+)?title\\s+of\\s+${prefix}[- ]?(\\d+)\\s+to\\s+(.+)`, "i");
      const updateTitleMatch = cleanText.match(updateTitleRegex);

      const updateDescRegex = new RegExp(`(?:change|update|set)\\s+(?:the\\s+)?description\\s+of\\s+${prefix}[- ]?(\\d+)\\s+to\\s+(.+)`, "i");
      const updateDescMatch = cleanText.match(updateDescRegex);

      const activePrefixUpper = prefix.toUpperCase();

      if (moveMatch) {
        const num = moveMatch[1];
        const targetStatusRaw = moveMatch[2].trim();
        let status: IssueStatus = "Todo";

        if (targetStatusRaw.includes("progress") || targetStatusRaw === "doing") {
          status = "In Progress";
        } else if (targetStatusRaw.includes("done") || targetStatusRaw.includes("complete") || targetStatusRaw === "finished") {
          status = "Done";
        } else if (targetStatusRaw.includes("todo") || targetStatusRaw.includes("to do")) {
          status = "Todo";
        }

        payload = {
          action: "UPDATE_STATUS",
          issueId: `${activePrefixUpper}-${num}`,
          status,
          rawText: text,
        };
      } else if (completeMatch) {
        const num = completeMatch[1];
        payload = {
          action: "UPDATE_STATUS",
          issueId: `${activePrefixUpper}-${num}`,
          status: "Done",
          rawText: text,
        };
      } else if (deleteMatch) {
        const num = deleteMatch[1];
        payload = {
          action: "DELETE_ISSUE",
          issueId: `${activePrefixUpper}-${num}`,
          rawText: text,
        };
      } else if (updateTitleMatch) {
        const num = updateTitleMatch[1];
        const newTitle = updateTitleMatch[2].trim();
        payload = {
          action: "UPDATE_ISSUE",
          issueId: `${activePrefixUpper}-${num}`,
          title: newTitle.charAt(0).toUpperCase() + newTitle.slice(1),
          rawText: text,
        };
      } else if (updateDescMatch) {
        const num = updateDescMatch[1];
        const newDesc = updateDescMatch[2].trim();
        payload = {
          action: "UPDATE_ISSUE",
          issueId: `${activePrefixUpper}-${num}`,
          description: newDesc.charAt(0).toUpperCase() + newDesc.slice(1),
          rawText: text,
        };
      } else if (createMatch) {
        const priorityRaw = createMatch[1] as Priority | undefined;
        const priority: Priority = priorityRaw || "medium";
        let title = createMatch[2].trim();

        title = title.replace(/^(?:ticket|issue|task)\s+(?:to\s+)?/i, "");
        title = title.charAt(0).toUpperCase() + title.slice(1);

        payload = {
          action: "CREATE_ISSUE",
          title,
          status: "Todo",
          priority,
          rawText: text,
        };
      }
    }

    if (payload.action === "UPDATE_STATUS" && payload.issueId && payload.status) {
      const exists = issues.some((issue) => issue.id === payload.issueId);
      if (exists) {
        updateIssueStatus(payload.issueId, payload.status);
        addLog("llm_response", `Aura Board Action: Moved ${payload.issueId} to "${payload.status}"`, JSON.stringify(payload, null, 2));
      } else {
        payload.action = "UNKNOWN";
        addLog("error", `Issue ${payload.issueId} not found in this workspace.`);
      }
    } else if (payload.action === "UPDATE_ISSUE" && payload.issueId) {
      const exists = issues.some((issue) => issue.id === payload.issueId);
      if (exists) {
        const updates: Partial<Issue> = {};
        if (payload.title !== undefined) updates.title = payload.title;
        if (payload.description !== undefined) updates.description = payload.description;
        updateIssue(payload.issueId, updates);
        addLog("llm_response", `Aura Board Action: Updated ${payload.issueId} details`, JSON.stringify(payload, null, 2));
      } else {
        payload.action = "UNKNOWN";
        addLog("error", `Issue ${payload.issueId} not found in database.`);
      }
    } else if (payload.action === "CREATE_ISSUE" && payload.title && payload.status && payload.priority) {
      addIssue(payload.title, payload.status, payload.priority);
      addLog("llm_response", `Aura Board Action: Created issue "${payload.title}"`, JSON.stringify(payload, null, 2));
    } else if (payload.action === "DELETE_ISSUE" && payload.issueId) {
      const exists = issues.some((issue) => issue.id === payload.issueId);
      if (exists) {
        deleteIssue(payload.issueId);
        addLog("llm_response", `Aura Board Action: Deleted issue ${payload.issueId}`, JSON.stringify(payload, null, 2));
      } else {
        payload.action = "UNKNOWN";
        addLog("error", `Issue ${payload.issueId} not found in database.`);
      }
    } else {
      addLog("error", `LLM could not interpret speech command structure.`, `Speech: "${text}"`);
    }

    return payload;
  };

  return (
    <IssuesContext.Provider
      value={{
        issues,
        filteredIssues,
        logs,
        isListening,
        setIsListening,
        currentView,
        setCurrentView,
        activeWorkspace,
        setActiveWorkspace,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        selectedIssueId,
        setSelectedIssueId,
        
        // Supabase context hooks
        supabaseCreds,
        connectSupabase,
        disconnectSupabase,

        addIssue,
        updateIssue,
        updateIssueStatus,
        deleteIssue,
        processVoiceCommand,
        clearLogs,
        addLog,
      }}
    >
      {children}
    </IssuesContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (context === undefined) {
    throw new Error("useIssues must be used within an IssuesProvider");
  }
  return context;
}
