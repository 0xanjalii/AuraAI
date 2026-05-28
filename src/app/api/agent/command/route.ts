import { NextResponse } from "next/server";

const systemPrompt = `You are Aura, the voice-controlled project management AI agent.
Analyze the user's spoken command and translate it into a structured JSON action to modify a Kanban project board.

Columns on the board: "Todo", "In Progress", "Done".
Priorities: "no_priority", "low", "medium", "high", "urgent".

Supported actions:
1. CREATE_ISSUE: Creating a new issue.
   Parameters:
   - title: Title of the task (string)
   - status: "Todo" | "In Progress" | "Done" (default is "Todo")
   - priority: "no_priority" | "low" | "medium" | "high" | "urgent" (default is "medium")
   - assigneeName: (optional) Name of assignee (string)

2. UPDATE_STATUS: Moving an issue to a new status or completing it.
   Parameters:
   - issueId: The issue ID, matching pattern (PREFIX-NUMBER, e.g. "AUR-12", "PERS-2", "HACK-4")
   - status: "Todo" | "In Progress" | "Done"

3. UPDATE_ISSUE: Updating the title or description text details of an issue.
   Parameters:
   - issueId: The issue ID (e.g. "AUR-12")
   - title: (optional) New title of the task (string)
   - description: (optional) New description text of the task (string)

4. DELETE_ISSUE: Deleting an issue.
   Parameters:
   - issueId: The issue ID (e.g. "AUR-12")

5. UNKNOWN: If the command is not related to creating, updating, or deleting issues.

Format your response as a valid, single JSON object ONLY. Do not include markdown code block syntax (like \`\`\`json) in your raw response.

Examples:
- Input: "Aura, create a high priority task to write API docs"
  Response: {"action": "CREATE_ISSUE", "title": "Write API docs", "status": "Todo", "priority": "high"}
- Input: "Aura, move AUR-1 to in progress"
  Response: {"action": "UPDATE_STATUS", "issueId": "AUR-1", "status": "In Progress"}
- Input: "Aura, complete HACK-3"
  Response: {"action": "UPDATE_STATUS", "issueId": "HACK-3", "status": "Done"}
- Input: "Aura, change the title of AUR-2 to Setup Voice Client Provider"
  Response: {"action": "UPDATE_ISSUE", "issueId": "AUR-2", "title": "Setup Voice Client Provider"}
- Input: "Aura, update HACK-4 description to Record dynamic showcase of the board"
  Response: {"action": "UPDATE_ISSUE", "issueId": "HACK-4", "description": "Record dynamic showcase of the board"}
- Input: "Aura, delete PERS-2"
  Response: {"action": "DELETE_ISSUE", "issueId": "PERS-2"}
- Input: "What is the weather today?"
  Response: {"action": "UNKNOWN"}`;

export async function POST(request: Request) {
  try {
    const { text, workspace } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing text payload" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured on the server." },
        { status: 501 }
      );
    }

    // Call OpenRouter completions endpoint
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3002",
        "X-Title": "Aura AI Voice Agent",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voice transcript from workspace "${workspace}": "${text}"` },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `OpenRouter Request Failed: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      return NextResponse.json({ error: "Empty completion response from LLM" }, { status: 500 });
    }

    // Parse returned JSON from the assistant
    let parsedAction;
    try {
      // Strips potential markdown formatting
      const cleanJson = rawContent.replace(/```json|```/gi, "").trim();
      parsedAction = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse assistant JSON content", rawContent);
      return NextResponse.json({ error: "LLM response was not valid JSON", raw: rawContent }, { status: 500 });
    }

    return NextResponse.json(parsedAction);
  } catch (e: any) {
    console.error("Agent Command Route Error", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
