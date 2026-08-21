import { describe, it, expect } from "vitest";
import type {
  Citation,
  ToolCallPart,
  AgenticUiMessage,
  AgenticUiStreamEvent,
  AgenticChatTransport,
  EvidenceDocument,
  EvidenceBlock,
} from "../src/index.js";

describe("@sota-agentic-ragx/agentic-core-react public entry", () => {
  it("exports all chat types", () => {
    const citation: Citation = { chunk_id: "c1", source: "doc.pdf" };
    const tool: ToolCallPart = {
      type: "tool_call",
      toolName: "search",
      toolArgs: {},
      toolState: "input-available",
    };
    const msg: AgenticUiMessage = {
      id: "1",
      role: "assistant",
      content: "hello",
      citations: [citation],
      parts: [{ type: "text", text: "hello" }, tool],
    };
    expect(msg.id).toBe("1");
    expect(msg.parts).toHaveLength(2);
  });

  it("exports transport types", () => {
    const transport: AgenticChatTransport = {
      sendMessage: async () => ({
        events: (async function* () {})(),
      }),
    };
    expect(typeof transport.sendMessage).toBe("function");
  });

  it("exports evidence types", () => {
    const block: EvidenceBlock = {
      id: "b1",
      type: "Text",
      pageIndex: 0,
      text: "content",
    };
    const doc: EvidenceDocument = {
      id: "d1",
      filename: "doc.pdf",
      kind: "pdf",
      blocks: [block],
    };
    expect(doc.blocks).toHaveLength(1);
  });

  it("exports stream event union", () => {
    const events: AgenticUiStreamEvent[] = [
      { type: "status", stage: "thinking" },
      { type: "token", delta: "hi" },
      { type: "done" },
      { type: "error", message: "fail" },
    ];
    expect(events).toHaveLength(4);
  });
});
