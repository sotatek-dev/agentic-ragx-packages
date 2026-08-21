import { describe, it, expect } from "vitest";
import {
  chatReducer,
  INITIAL_CHAT_STATE,
  type ChatState,
} from "../src/chat/chat-state.js";
import type { AgenticUiMessage, ToolCallPart } from "../src/index.js";

function assistantMsg(
  overrides: Partial<AgenticUiMessage> = {},
): AgenticUiMessage {
  return {
    id: "a1",
    role: "assistant",
    content: "",
    parts: [],
    citations: [],
    streaming: true,
    ...overrides,
  };
}

describe("chatReducer", () => {
  it("appends user message", () => {
    const userMsg: AgenticUiMessage = {
      id: "u1",
      role: "user",
      content: "hello",
      citations: [],
    };
    const state = chatReducer(INITIAL_CHAT_STATE, {
      type: "append_user_message",
      message: userMsg,
    });
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe("user");
  });

  it("appends assistant message and sets streaming", () => {
    const state = chatReducer(INITIAL_CHAT_STATE, {
      type: "append_assistant_message",
      message: assistantMsg(),
    });
    expect(state.messages).toHaveLength(1);
    expect(state.isStreaming).toBe(true);
    expect(state.streamStatus).toBeNull();
  });

  it("appends token to last assistant text part", () => {
    let state: ChatState = {
      ...INITIAL_CHAT_STATE,
      messages: [assistantMsg({ parts: [{ type: "text", text: "hel" }] })],
    };
    state = chatReducer(state, { type: "token", delta: "lo" });
    expect(state.messages[0].content).toBe("hello");
    const parts = state.messages[0].parts ?? [];
    expect(parts[0]).toEqual({ type: "text", text: "hello" });
  });

  it("creates new text part when last part is not text", () => {
    const toolPart: ToolCallPart = {
      type: "tool_call",
      toolName: "search",
      toolArgs: {},
      toolState: "input-available",
    };
    let state: ChatState = {
      ...INITIAL_CHAT_STATE,
      messages: [assistantMsg({ parts: [toolPart] })],
    };
    state = chatReducer(state, { type: "token", delta: "hi" });
    const parts = state.messages[0].parts ?? [];
    expect(parts).toHaveLength(2);
    expect(parts[1]).toEqual({ type: "text", text: "hi" });
  });

  it("adds new tool call to parts", () => {
    const toolPart: ToolCallPart = {
      type: "tool_call",
      toolName: "search",
      toolArgs: { q: "test" },
      toolState: "input-available",
    };
    const state = chatReducer(
      { ...INITIAL_CHAT_STATE, messages: [assistantMsg()] },
      { type: "tool_call", part: toolPart },
    );
    const parts = state.messages[0].parts ?? [];
    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("tool_call");
  });

  it("merges existing tool call by toolCallId", () => {
    const existing: ToolCallPart = {
      type: "tool_call",
      toolCallId: "tc1",
      toolName: "search",
      toolArgs: { q: "old" },
      toolState: "input-streaming",
    };
    const update: ToolCallPart = {
      type: "tool_call",
      toolCallId: "tc1",
      toolName: "search",
      toolArgs: { q: "new" },
      toolState: "output-available",
      toolResult: { preview: "ok", source_count: 1, truncated: false },
    };
    const state = chatReducer(
      {
        ...INITIAL_CHAT_STATE,
        messages: [assistantMsg({ parts: [existing] })],
      },
      { type: "tool_call", part: update },
    );
    const parts = state.messages[0].parts ?? [];
    expect(parts).toHaveLength(1);
    if (parts[0].type === "tool_call") {
      expect(parts[0].toolState).toBe("output-available");
      expect(parts[0].toolArgs).toEqual({ q: "new" });
    }
  });

  it("attaches citations to last assistant", () => {
    const state = chatReducer(
      {
        ...INITIAL_CHAT_STATE,
        messages: [assistantMsg()],
      },
      {
        type: "citations",
        citations: [{ chunk_id: "c1", source: "doc.pdf" }],
      },
    );
    expect(state.messages[0].citations).toEqual([
      { chunk_id: "c1", source: "doc.pdf" },
    ]);
  });

  it("done finalizes pending tool calls", () => {
    const tool: ToolCallPart = {
      type: "tool_call",
      toolName: "search",
      toolArgs: {},
      toolState: "input-available",
    };
    const state = chatReducer(
      {
        ...INITIAL_CHAT_STATE,
        messages: [assistantMsg({ parts: [tool] })],
      },
      { type: "done" },
    );
    expect(state.isStreaming).toBe(false);
    const parts = state.messages[0].parts ?? [];
    if (parts[0].type === "tool_call") {
      expect(parts[0].toolState).toBe("output-available");
    }
  });

  it("error marks assistant as failed", () => {
    const state = chatReducer(
      {
        ...INITIAL_CHAT_STATE,
        isStreaming: true,
        messages: [assistantMsg()],
      },
      { type: "error", message: "Network fail" },
    );
    expect(state.isStreaming).toBe(false);
    expect(state.messages[0].error).toBe(true);
    expect(state.messages[0].content).toBe("Network fail");
  });

  it("error fails pending tool calls", () => {
    const tool: ToolCallPart = {
      type: "tool_call",
      toolName: "search",
      toolArgs: {},
      toolState: "input-streaming",
    };
    const state = chatReducer(
      {
        ...INITIAL_CHAT_STATE,
        isStreaming: true,
        messages: [assistantMsg({ parts: [tool] })],
      },
      { type: "error", message: "Timeout" },
    );
    const parts = state.messages[0].parts ?? [];
    const toolOut = parts.find((p) => p.type === "tool_call");
    if (toolOut?.type === "tool_call") {
      expect(toolOut.toolState).toBe("output-error");
    }
  });

  it("sets stream status", () => {
    const state = chatReducer(INITIAL_CHAT_STATE, {
      type: "status",
      status: { stage: "react_start" },
    });
    expect(state.streamStatus).toEqual({ stage: "react_start" });
  });
});
