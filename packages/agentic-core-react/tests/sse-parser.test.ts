import { describe, it, expect } from "vitest";
import { parseSSEStream } from "../src/transport/sse-parser.js";
import type { AgenticUiStreamEvent } from "../src/index.js";

/** Helper: create a ReadableStream from SSE text frames. */
function streamFromFrames(...frames: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = frames.map((f) => encoder.encode(f));
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

/** Collect all events from an async iterable. */
async function collect(
  stream: AsyncIterable<AgenticUiStreamEvent>,
): Promise<AgenticUiStreamEvent[]> {
  const events: AgenticUiStreamEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

describe("parseSSEStream", () => {
  it("parses token events", async () => {
    const stream = streamFromFrames(
      'event: token\ndata: "hello"\n\n',
      'event: token\ndata: " world"\n\n',
    );
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([
      { type: "token", delta: "hello" },
      { type: "token", delta: " world" },
    ]);
  });

  it("parses token events with object delta payloads", async () => {
    const stream = streamFromFrames(
      'event: token\ndata: {"delta":"hello"}\n\n',
    );
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ type: "token", delta: "hello" }]);
  });

  it("parses status events", async () => {
    const stream = streamFromFrames(
      'event: status\ndata: {"stage":"thinking"}\n\n',
    );
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ type: "status", stage: "thinking", tool: undefined }]);
  });

  it("parses tool_call events", async () => {
    const stream = streamFromFrames(
      'event: tool_call\ndata: {"toolName":"search","toolArgs":{"q":"test"},"toolState":"input-available"}\n\n',
    );
    const events = await collect(parseSSEStream(stream));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("tool_call");
    if (events[0].type === "tool_call") {
      expect(events[0].part.toolName).toBe("search");
      expect(events[0].part.toolState).toBe("input-available");
    }
  });

  it("parses citations events", async () => {
    const stream = streamFromFrames(
      'event: citations\ndata: [{"chunk_id":"c1","source":"doc.pdf"}]\n\n',
    );
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([
      { type: "citations", citations: [{ chunk_id: "c1", source: "doc.pdf" }] },
    ]);
  });

  it("parses proxy-wrapped citations events", async () => {
    const stream = streamFromFrames(
      'event: citations\ndata: {"citations":[{"chunk_id":"c1","source":"doc.pdf"}]}\n\n',
    );
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([
      { type: "citations", citations: [{ chunk_id: "c1", source: "doc.pdf" }] },
    ]);
  });

  it("parses done events", async () => {
    const stream = streamFromFrames("event: done\ndata: \n\n");
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ type: "done" }]);
  });

  it("parses error events", async () => {
    const stream = streamFromFrames(
      'event: error\ndata: {"message":"Something went wrong"}\n\n',
    );
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([
      { type: "error", message: "Something went wrong" },
    ]);
  });

  it("handles error as plain string", async () => {
    const stream = streamFromFrames('event: error\ndata: "fail"\n\n');
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ type: "error", message: "fail" }]);
  });

  it("ignores unknown event types", async () => {
    const stream = streamFromFrames(
      'event: unknown\ndata: {"x":1}\n\n',
      'event: done\ndata: \n\n',
    );
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ type: "done" }]);
  });

  it("handles chunk boundaries (partial frames)", async () => {
    const stream = streamFromFrames(
      'event: token\ndata: "hel',
      'lo"\n\nevent: done\ndata: \n\n',
    );
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([
      { type: "token", delta: "hello" },
      { type: "done" },
    ]);
  });

  it("handles tool_call with legacy field names", async () => {
    const stream = streamFromFrames(
      'event: tool_call\ndata: {"tool":"vector_search","args":{"q":"test"},"tool_call_id":"tc1"}\n\n',
    );
    const events = await collect(parseSSEStream(stream));
    expect(events).toHaveLength(1);
    if (events[0].type === "tool_call") {
      expect(events[0].part.toolName).toBe("vector_search");
      expect(events[0].part.toolCallId).toBe("tc1");
    }
  });
});
