import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { agentId } = await request.json();

    if (!agentId || !agentId.trim()) {
      return NextResponse.json({ error: "Missing agentId parameter" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    // If no server-side API Key, tell the client to fall back to a public session
    if (!apiKey) {
      return NextResponse.json({ 
        skip: true, 
        message: "No ELEVENLABS_API_KEY configured. Defaulting to public agent connection." 
      });
    }

    // Call ElevenLabs API to generate a signed session URL
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `ElevenLabs API returned error: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the signed websocket URL (which includes the temporary connection token)
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (e: any) {
    console.error("ElevenLabs Session Auth Error", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
