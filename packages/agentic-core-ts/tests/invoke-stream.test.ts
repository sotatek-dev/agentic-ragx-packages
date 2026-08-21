import { describe, it, expect } from "vitest";
import { AgenticCoreClient } from "../src/client.js";
import { AgenticHttpError, redactSensitive } from "../src/errors.js";
import { parseSSEStream } from "../src/sse-parser.js";
import type { AgenticStreamEvent } from "../src/events.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sseFrame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sseBody(...frames: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = frames.map((f) => encoder.encode(f));
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
  });
}

function mockFetch(
  response: { status?: number; body?: string; headers?: Record<string, string> },
) {
  const status = response.status ?? 200;
  const body = response.body ?? "";
  const headers = new Headers(response.headers ?? {});
  return async () =>
    new Response(body, { status, headers });
}

function mockStreamingFetch(frames: string[], headers: Record<string, string> = {}) {
  const body = sseBody(...frames);
  return async () =>
    new Response(body, {
      status: 200,
      headers: { "content-type": "text/event-stream", ...headers },
    });
}

async function collectEvents(gen: AsyncGenerator<AgenticStreamEvent>): Promise<AgenticStreamEvent[]> {
  const events: AgenticStreamEvent[] = [];
  for await (const ev of gen) events.push(ev);
  return events;
}

// ---------------------------------------------------------------------------
// SSE parser tests
// ---------------------------------------------------------------------------

describe("parseSSEStream", () => {
  it("parses token and done events", async () => {
    const body = sseBody(
      sseFrame("token", "Hello"),
      sseFrame("token", " world"),
      sseFrame("done", ""),
    );
    const events = await collectEvents(parseSSEStream(body));
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: "token", delta: "Hello" });
    expect(events[1]).toEqual({ type: "token", delta: " world" });
    expect(events[2]).toEqual({ type: "done" });
  });

  it("parses token events with object delta payloads", async () => {
    const body = sseBody(sseFrame("token", { delta: "Hello" }));
    const events = await collectEvents(parseSSEStream(body));
    expect(events).toEqual([{ type: "token", delta: "Hello" }]);
  });

  it("parses status events with tool", async () => {
    const body = sseBody(
      sseFrame("status", { stage: "retrieving", tool: "file_search" }),
    );
    const events = await collectEvents(parseSSEStream(body));
    expect(events[0]).toEqual({ type: "status", stage: "retrieving", tool: "file_search" });
  });

  it("parses tool_call events", async () => {
    const body = sseBody(
      sseFrame("tool_call", {
        toolCallId: "tc1",
        toolName: "file_search",
        toolArgs: { q: "test" },
        toolState: "input-available",
      }),
    );
    const events = await collectEvents(parseSSEStream(body));
    expect(events[0]).toMatchObject({ type: "tool_call", toolName: "file_search" });
  });

  it("parses citations events", async () => {
    const body = sseBody(
      sseFrame("citations", [{ source: "doc.pdf", chunk_id: "c1" }]),
    );
    const events = await collectEvents(parseSSEStream(body));
    expect(events[0]).toMatchObject({
      type: "citations",
      citations: [{ source: "doc.pdf", chunk_id: "c1" }],
    });
  });

  it("parses proxy-wrapped citations events", async () => {
    const body = sseBody(
      sseFrame("citations", { citations: [{ source: "doc.pdf", chunk_id: "c1" }] }),
    );
    const events = await collectEvents(parseSSEStream(body));
    expect(events[0]).toMatchObject({
      type: "citations",
      citations: [{ source: "doc.pdf", chunk_id: "c1" }],
    });
  });

  it("parses error events", async () => {
    const body = sseBody(
      sseFrame("error", { message: "LLM timeout" }),
    );
    const events = await collectEvents(parseSSEStream(body));
    expect(events[0]).toEqual({ type: "error", message: "LLM timeout" });
  });

  it("handles chunk boundaries correctly", async () => {
    // Split a frame across two chunks
    const encoder = new TextEncoder();
    const fullFrame = sseFrame("token", "split");
    const mid = Math.floor(fullFrame.length / 2);
    const chunk1 = encoder.encode(fullFrame.slice(0, mid));
    const chunk2 = encoder.encode(fullFrame.slice(mid));

    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.close();
      },
    });

    const events = await collectEvents(parseSSEStream(body));
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: "token", delta: "split" });
  });
});

// ---------------------------------------------------------------------------
// Client tests
// ---------------------------------------------------------------------------

describe("AgenticCoreClient", () => {
  it("invokeStream sends bearer auth and parses events", async () => {
    const frames = [
      sseFrame("status", { stage: "thinking" }),
      sseFrame("token", "Hi"),
      sseFrame("done", ""),
    ];
    const client = new AgenticCoreClient({
      baseUrl: "https://api.example.com/",
      apiKey: "sk-test-123",
      fetch: mockStreamingFetch(frames, { "X-Conversation-Id": "conv-1" }),
    });

    const result = await client.agents.invokeStream({
      agentId: "agent-1",
      message: "hello",
    });

    expect(result.conversationId).toBe("conv-1");
    const events = await collectEvents(result.events);
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: "status", stage: "thinking", tool: undefined });
    expect(events[1]).toEqual({ type: "token", delta: "Hi" });
    expect(events[2]).toEqual({ type: "done" });
  });

  it("throws AgenticHttpError for non-2xx", async () => {
    const client = new AgenticCoreClient({
      baseUrl: "https://api.example.com",
      apiKey: "sk-test",
      fetch: mockFetch({ status: 404, body: '{"detail":"Agent not found"}' }),
    });

    await expect(
      client.agents.invokeStream({ agentId: "bad", message: "hi" }),
    ).rejects.toThrow(AgenticHttpError);
  });

  it("does not include API key in error messages", async () => {
    const client = new AgenticCoreClient({
      baseUrl: "https://api.example.com",
      apiKey: "sk-super-secret-key",
      fetch: mockFetch({ status: 401, body: '{"detail":"Unauthorized"}' }),
    });

    try {
      await client.agents.invokeStream({ agentId: "x", message: "hi" });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AgenticHttpError);
      expect((err as Error).message).not.toContain("sk-super-secret-key");
    }
  });
});

// ---------------------------------------------------------------------------
// redactSensitive tests
// ---------------------------------------------------------------------------

describe("redactSensitive", () => {
  it("redacts key= values", () => {
    expect(redactSensitive("key=abc123")).toBe("key=[REDACTED]");
  });

  it("redacts authorization header values", () => {
    expect(redactSensitive("authorization: Bearer sk-secret")).toBe("authorization: [REDACTED]");
  });

  it("preserves non-sensitive text", () => {
    expect(redactSensitive("normal text")).toBe("normal text");
  });
});
