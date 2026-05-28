"use client";

import React, { useState, useEffect } from "react";
import { IssuesProvider, IssueStatus, useIssues } from "@/store/issues-store";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import KanbanBoard from "@/components/KanbanBoard";
import AuraVoiceInterface from "@/components/AuraVoiceInterface";
import LogsConsole from "@/components/LogsConsole";
import NewIssueModal from "@/components/NewIssueModal";
import IssueDetailDrawer from "@/components/IssueDetailDrawer";
import ActiveCycleView from "@/components/ActiveCycleView";
import BacklogView from "@/components/BacklogView";
import SettingsView from "@/components/SettingsView";

// Sub-component wrapper to allow accessing context properly
function DashboardContent() {
  const { currentView } = useIssues();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<IssueStatus>("Todo");
  const [showLogs, setShowLogs] = useState(true);

  // Keyboard shortcut listener ('C' opens new issue modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        setModalDefaultStatus("Todo");
        setIsModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleQuickAdd = (status: IssueStatus) => {
    setModalDefaultStatus(status);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-text-primary">
      {/* Left Sidebar */}
      <Sidebar 
        onNewIssueClick={() => handleQuickAdd("Todo")} 
        showLogs={showLogs}
        setShowLogs={setShowLogs}
      />

      {/* Right Canvas Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <Header />

        {/* Dynamic Main View Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {currentView === "Board" && (
            <KanbanBoard onQuickAdd={handleQuickAdd} />
          )}
          {currentView === "Active Cycle" && (
            <ActiveCycleView />
          )}
          {currentView === "Backlog" && (
            <BacklogView />
          )}
          {currentView === "Settings" && (
            <SettingsView />
          )}

          {/* Floating Voice Interface (Agent Command Bar) */}
          <AuraVoiceInterface />
        </main>

        {/* Action Logs Terminal Console (Bottom Split Pane) */}
        {showLogs && (
          <LogsConsole onClose={() => setShowLogs(false)} />
        )}
      </div>

      {/* Creation Modal dialog */}
      <NewIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultStatus={modalDefaultStatus}
      />

      {/* Right-sliding Issue Editor Panel */}
      <IssueDetailDrawer />
    </div>
  );
}

export default function Home() {
  return (
    <IssuesProvider>
      <DashboardContent />
    </IssuesProvider>
  );
}
