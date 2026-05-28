# Aura 🪐 — Voice-Controlled Project Management Board
### Powered by ElevenLabs Conversational AI 🎙️

Aura is a hyper-sleek, voice-controlled project management workspace modeled after the **Linear** application's dark mode. Designed and built for the **ElevenLabs Hackathon**, Aura leverages the **ElevenLabs Conversational AI Web SDK** to create an interactive voice agent that listens to commands, speaks back with lifelike latency, and dynamically updates a Kanban board in real-time.

---

## 🎙️ Powered by ElevenLabs

Aura is built from the ground up around **ElevenLabs' Conversational AI** suite. Instead of text-only chat input, the entire application is navigated and controlled via live vocal stream sockets.

### Core ElevenLabs Integrations:
1.  **Real-Time Speech Engine SDK**: Integrates `@elevenlabs/react` using a client-side provider wrapper to manage WebSocket connections, capture browser microphone streams, and synthesize responsive voice feedback.
2.  **Client-Side Tool Dispatching**: Utilizes ElevenLabs' **Client Tools** to bind spoken intents directly to React state updates:
    *   *Speaking a status change* triggers the `move_issue` tool on the client, animating cards across the Kanban canvas.
    *   *Requesting task creation* triggers the `create_issue` tool, instantly appending new cards to columns.
    *   *Deleting tasks* triggers the `delete_issue` tool.
3.  **Secure Token Generation API**: Features a Next.js Server Route (`/api/agent/session`) that wraps ElevenLabs' `get_signed_url` API. This allows developers to authenticate **private voice agents** securely using `ELEVENLABS_API_KEY` without exposing keys to the browser client.
4.  **Acoustic Configuration Controls**: Provides sliders in the settings panel to tune ElevenLabs stability, clarity, and AI ambient noise suppression in real-time.

---

## 🛠️ System Architecture

```
                               ┌────────────────────────────────┐
                               │   Microphone Capture Sockets   │
                               └───────────────┬────────────────┘
                                               │ (User Speech)
                                               ▼
                               ┌────────────────────────────────┐
                               │     ElevenLabs Web SDK         │
                               │  (@elevenlabs/react Provider)  │
                               └───────────────┬────────────────┘
                                               │ (WebSocket Sockets Stream)
                                               ▼
 ┌─────────────────────────┐   ┌────────────────────────────────┐
 │     OpenRouter API      │ ◄─┤    ElevenLabs AI Agent Box     │
 │  (Gemini-2.5-flash LLM) │   │ (Converts speech to tool calls)│
 └───────────┬─────────────┘   └───────────────┬────────────────┘
             │ (JSON Action)                   │
             ▼                                 ▼ (Direct Client Tools)
 ┌─────────────────────────────────────────────┴────────────────┐
 │                 issues-store.tsx React Context               │
 │            (LocalStorage persistence & Supabase Sync)        │
 └─────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
 ┌──────────────────────────────────────────────────────────────┐
 │             Interactive Board UI (Framer Motion)             │
 └──────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Quick Start & Setup

### 1. Installation
Clone the repository and install the required modules:
```bash
npm install
```

### 2. Environment Variables Configuration
Create a `.env.local` file in the root of the project:
```env
# ElevenLabs API Key for Authenticated Private Voice Agents (Optional)
# Get one from your ElevenLabs Profile page
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional: ElevenLabs default Agent ID
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id_here

# OpenRouter API Key (Get one from https://openrouter.ai/keys)
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 3. Database Schema setup (Supabase)
To sync your tasks with Supabase, run the following SQL command in your Supabase SQL editor:
```sql
create table issues (
  id text primary key,
  title text not null,
  description text,
  status text not null,
  priority text not null,
  assignee_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```
Once created, navigate to the **Settings** view in the application interface, paste your Supabase Project URL and Anon Public Key, and click **Connect**.

---

## 🗣️ Voice Command Guidelines

The AI agent parses spoken instructions into structured operations. You can command Aura verbally or test via the **Voice Simulator Panel** at the bottom of the screen.

### Supported Operations:
*   **Status Shifts / Moves**:
    *   *"Aura, move AUR-1 to In Progress"*
    *   *"Set PERS-2 to Done"*
    *   *"Transition HACK-1 status to Todo"*
*   **Ticket Creations**:
    *   *"Aura, create a high priority ticket to write database tests"*
    *   *"Add a low priority issue to update the README documentation"*
    *   *"Make a ticket to fix navbar links"* (Defaults to medium priority)
*   **Ticket Deletions**:
    *   *"Aura, delete AUR-5"*
    *   *"Remove PERS-3"*

---

## 🧬 ElevenLabs Client Tool Definitions (Dashboard Setup)

If you are deploying a Conversational AI agent inside the **ElevenLabs Dashboard**, register these **Client Tools** to enable the voice agent to control the React frontend directly:

### 1. `move_issue`
*   **Description**: Moves or transitions an issue card status.
*   **Parameter Schema**:
    ```json
    {
      "type": "object",
      "properties": {
        "issueId": {
          "type": "string",
          "description": "The exact issue ID, e.g. AUR-1, PERS-4"
        },
        "status": {
          "type": "string",
          "enum": ["Todo", "In Progress", "Done"],
          "description": "Target status column"
        }
      },
      "required": ["issueId", "status"]
    }
    ```

### 2. `create_issue`
*   **Description**: Creates a new issue card on the board.
*   **Parameter Schema**:
    ```json
    {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Clear title of the task"
        },
        "priority": {
          "type": "string",
          "enum": ["no_priority", "low", "medium", "high", "urgent"],
          "description": "Task urgency"
        },
        "status": {
          "type": "string",
          "enum": ["Todo", "In Progress", "Done"],
          "description": "Initial column status"
        },
        "assigneeName": {
          "type": "string",
          "description": "Optional assignee name"
        }
      },
      "required": ["title"]
    }
    ```

### 3. `delete_issue`
*   **Description**: Deletes an issue card.
*   **Parameter Schema**:
    ```json
    {
      "type": "object",
      "properties": {
        "issueId": {
          "type": "string",
          "description": "ID of the issue to remove"
        }
      },
      "required": ["issueId"]
    }
    ```

---

## 🏃 Running Locally

Start the Next.js development server:
```bash
npm run dev
```
Open **[http://localhost:3002](http://localhost:3002)** (or the port logged in your terminal console) to review.
