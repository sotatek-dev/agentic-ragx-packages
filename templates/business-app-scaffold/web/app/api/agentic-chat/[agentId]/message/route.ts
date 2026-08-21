import { NextRequest, NextResponse } from "next/server";
import { AgenticCoreClient, AgenticHttpError } from "@sotatek-dev/agentic-core-sdk";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  const baseUrl = process.env.AGENTIC_CORE_BASE_URL;
  const apiKey = process.env.AGENTIC_CORE_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { detail: "Server configuration error" },
      { status: 500 },
    );
  }

  let body: { message: string; conversation_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const client = new AgenticCoreClient({ baseUrl, apiKey });

  try {
    const result = await client.agents.invokeStream({
      agentId,
      message: body.message,
      conversationId: body.conversation_id,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of result.events) {
            const { type, ...data } = event;
            const frame = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(new TextEncoder().encode(frame));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...(result.conversationId
          ? { "X-Conversation-Id": result.conversationId }
          : {}),
      },
    });
  } catch (err) {
    if (err instanceof AgenticHttpError) {
      const statusMap: Record<number, string> = {
        401: "Unauthorized",
        403: "Forbidden",
        404: "Agent not found",
        429: "Rate limit exceeded",
      };
      return NextResponse.json(
        { detail: statusMap[err.statusCode] ?? "Upstream error" },
        {
          status:
            err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 502,
        },
      );
    }
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }
}
