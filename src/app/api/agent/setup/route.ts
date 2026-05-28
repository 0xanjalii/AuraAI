import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ELEVENLABS_API_KEY in server environment variables." },
        { status: 400 }
      );
    }

    const headers = {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    };

    console.log("ElevenLabs Setup: Creating move_issue tool...");
    // 1. Create move_issue tool
    const moveIssueResponse = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
      method: "POST",
      headers,
      body: JSON.stringify({
        tool_config: {
          type: "client",
          name: "move_issue",
          description: "Moves or transitions an issue card status column",
          params: {
            type: "object",
            properties: {
              issueId: {
                type: "string",
                description: "The exact issue ID, e.g. AUR-1, PERS-4",
              },
              status: {
                type: "string",
                enum: ["Todo", "In Progress", "Done"],
                description: "Target status column",
              },
            },
            required: ["issueId", "status"],
          },
        },
      }),
    });

    if (!moveIssueResponse.ok) {
      const err = await moveIssueResponse.text();
      return NextResponse.json({ error: `Failed to create move_issue tool: ${err}` }, { status: 400 });
    }
    const moveIssueData = await moveIssueResponse.json();
    const moveIssueId = moveIssueData.id;

    console.log("ElevenLabs Setup: Creating create_issue tool...");
    // 2. Create create_issue tool
    const createIssueResponse = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
      method: "POST",
      headers,
      body: JSON.stringify({
        tool_config: {
          type: "client",
          name: "create_issue",
          description: "Creates a new issue card on the Kanban board",
          params: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Clear title of the task",
              },
              priority: {
                type: "string",
                enum: ["no_priority", "low", "medium", "high", "urgent"],
                description: "Task urgency level",
              },
              status: {
                type: "string",
                enum: ["Todo", "In Progress", "Done"],
                description: "Initial column status",
              },
              assigneeName: {
                type: "string",
                description: "Optional assignee name",
              },
            },
            required: ["title"],
          },
        },
      }),
    });

    if (!createIssueResponse.ok) {
      const err = await createIssueResponse.text();
      return NextResponse.json({ error: `Failed to create create_issue tool: ${err}` }, { status: 400 });
    }
    const createIssueData = await createIssueResponse.json();
    const createIssueId = createIssueData.id;

    console.log("ElevenLabs Setup: Creating delete_issue tool...");
    // 3. Create delete_issue tool
    const deleteIssueResponse = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
      method: "POST",
      headers,
      body: JSON.stringify({
        tool_config: {
          type: "client",
          name: "delete_issue",
          description: "Deletes an issue card from the board",
          params: {
            type: "object",
            properties: {
              issueId: {
                type: "string",
                description: "ID of the issue to remove",
              },
            },
            required: ["issueId"],
          },
        },
      }),
    });

    if (!deleteIssueResponse.ok) {
      const err = await deleteIssueResponse.text();
      return NextResponse.json({ error: `Failed to create delete_issue tool: ${err}` }, { status: 400 });
    }
    const deleteIssueData = await deleteIssueResponse.json();
    const deleteIssueId = deleteIssueData.id;

    console.log("ElevenLabs Setup: Creating update_issue_text tool...");
    // 3b. Create update_issue_text tool
    const updateIssueTextResponse = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
      method: "POST",
      headers,
      body: JSON.stringify({
        tool_config: {
          type: "client",
          name: "update_issue_text",
          description: "Updates the title or description text details of an issue",
          params: {
            type: "object",
            properties: {
              issueId: {
                type: "string",
                description: "The exact ID of the issue to update, e.g. AUR-1, PERS-2",
              },
              title: {
                type: "string",
                description: "New title of the issue (optional)",
              },
              description: {
                type: "string",
                description: "New description of the issue (optional)",
              },
            },
            required: ["issueId"],
          },
        },
      }),
    });

    if (!updateIssueTextResponse.ok) {
      const err = await updateIssueTextResponse.text();
      return NextResponse.json({ error: `Failed to create update_issue_text tool: ${err}` }, { status: 400 });
    }
    const updateIssueTextData = await updateIssueTextResponse.json();
    const updateIssueTextId = updateIssueTextData.id;

    console.log("ElevenLabs Setup: Creating conversational agent...");
    // 4. Create the Conversational Agent
    const agentResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Aura Project Assistant",
        conversation_config: {
          agent: {
            prompt: {
              prompt: `You are Aura, a voice-controlled project management assistant for a Linear-style Kanban board. 
You can perform actions on issues using tools. 

Available tools:
- create_issue: Use this to create issues.
- move_issue: Use this to move or transition an issue to a new status.
- update_issue_text: Use this to update the title or description text details of an existing issue.
- delete_issue: Use this to delete/remove issues.

Keep your spoken responses extremely short, concise, and professional. Confirm the action when you execute tools.`,
              tool_ids: [moveIssueId, createIssueId, deleteIssueId, updateIssueTextId],
            },
            first_message: "Hello! I am Aura. How can I help you manage your board today?",
            language: "en",
          },
          tts: {
            voice_id: "JBFqnCBsd6RMkjVDRZzb", // Default stable voice
          },
        },
      }),
    });

    if (!agentResponse.ok) {
      const err = await agentResponse.text();
      return NextResponse.json({ error: `Failed to create agent: ${err}` }, { status: 400 });
    }

    const agentData = await agentResponse.json();
    const agentId = agentData.agent_id;
    console.log(`ElevenLabs Setup: Agent successfully created with ID ${agentId}`);

    // 5. Save the Agent ID to .env.local
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf-8");
        if (envContent.includes("NEXT_PUBLIC_ELEVENLABS_AGENT_ID=")) {
          envContent = envContent.replace(
            /NEXT_PUBLIC_ELEVENLABS_AGENT_ID=.*/,
            `NEXT_PUBLIC_ELEVENLABS_AGENT_ID=${agentId}`
          );
        } else {
          envContent += `\nNEXT_PUBLIC_ELEVENLABS_AGENT_ID=${agentId}\n`;
        }
        fs.writeFileSync(envPath, envContent, "utf-8");
        console.log("ElevenLabs Setup: Updated .env.local with new Agent ID");
      }
    } catch (e: any) {
      console.error("ElevenLabs Setup: Failed to write to .env.local", e);
    }

    return NextResponse.json({
      success: true,
      agentId,
      message: "ElevenLabs voice agent and tools successfully provisioned!",
    });
  } catch (e: any) {
    console.error("ElevenLabs Setup Error", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
