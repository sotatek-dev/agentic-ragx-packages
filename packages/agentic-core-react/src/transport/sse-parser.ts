/**
 * Browser-safe SSE parser for the Agentic Core streaming API.
 * Adapted from @sotatek-dev/agentic-core-sdk sse-parser.ts — uses web ReadableStream only.
 */

import type { AgenticUiStreamEvent } from "../chat/chat-types.js";

/**
 * Parse an SSE text/event-stream into an async iterable of UI stream events.
 * Handles chunk boundaries correctly by buffering partial frames.
 */
export async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<AgenticUiStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const event = parseFrame(frame);
        if (event) yield event;
      }
    }

    // Flush remaining buffer
    buffer += decoder.decode();
    if (buffer.trim()) {
      const event = parseFrame(buffer);
      if (event) yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseFrame(frame: string): AgenticUiStreamEvent | null {
  const lines = frame.split("\n");
  const eventLine = lines.find((l) => l.startsWith("event: "));
  const eventName = eventLine?.slice(7).trim();
  if (!eventName) return null;

  const data = lines
    .filter((l) => l.startsWith("data: "))
    .map((l) => l.slice(6))
    .join("\n");

  switch (eventName) {
    case "status": {
      const parsed = safeJSON(data);
      return {
        type: "status",
        stage: parsed.stage ?? "",
        tool: parsed.tool,
      };
    }
    case "token": {
      const parsed = safeJSON(data);
      return {
        type: "token",
        delta: tokenDelta(parsed),
      };
    }
    case "tool_call": {
      const parsed = safeJSON(data);
      return {
        type: "tool_call",
        part: {
          type: "tool_call",
          toolCallId: parsed.toolCallId ?? parsed.tool_call_id,
          toolName: parsed.toolName ?? parsed.tool ?? parsed.name ?? "tool",
          toolArgs: parsed.toolArgs ?? parsed.args ?? {},
          toolState: parsed.toolState ?? "input-available",
          toolResult: parsed.toolResult ?? parsed.result_preview,
          toolError: parsed.toolError,
        },
      };
    }
    case "citations": {
      const parsed = safeJSON(data);
      return {
        type: "citations",
        citations: citationList(parsed),
      };
    }
    case "done":
      return { type: "done" };
    case "error": {
      const parsed = safeJSON(data);
      const msg =
        typeof parsed === "string"
          ? parsed
          : parsed?.message ?? "Stream error";
      return { type: "error", message: String(msg) };
    }
    default:
      return null;
  }
}

function safeJSON(data: string): any {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function tokenDelta(parsed: unknown): string {
  if (typeof parsed === "string") return parsed;
  if (
    parsed &&
    typeof parsed === "object" &&
    "delta" in parsed &&
    typeof parsed.delta === "string"
  ) {
    return parsed.delta;
  }
  return String(parsed);
}

function citationList(parsed: unknown): any[] {
  if (Array.isArray(parsed)) return parsed;
  if (
    parsed &&
    typeof parsed === "object" &&
    "citations" in parsed &&
    Array.isArray(parsed.citations)
  ) {
    return parsed.citations;
  }
  return [];
}
