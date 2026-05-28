"use client";

import React from "react";
import { ConversationProvider } from "@elevenlabs/react";

export default function VoiceProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConversationProvider>
      {children}
    </ConversationProvider>
  );
}
