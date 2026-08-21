/**
 * Chat state reducer for useAgenticChat.
 *
 * Manages message list, streaming state, and tool call lifecycle
 * without coupling to any transport or UI framework.
 */

import type {
  AgenticUiMessage,
  AgenticUiStreamEvent,
  MessagePart,
  StreamStatusData,
  ToolCallPart,
} from "./chat-types.js";

/** State managed by the chat reducer. */
export interface ChatState {
  messages: AgenticUiMessage[];
  isStreaming: boolean;
  streamStatus: StreamStatusData | null;
}

/** Actions dispatched to the chat reducer. */
export type ChatAction =
  | { type: "append_user_message"; message: AgenticUiMessage }
  | { type: "append_assistant_message"; message: AgenticUiMessage }
  | { type: "token"; delta: string }
  | { type: "tool_call"; part: ToolCallPart }
  | { type: "citations"; citations: AgenticUiMessage["citations"] }
  | { type: "status"; status: StreamStatusData }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "set_streaming"; value: boolean };

export const INITIAL_CHAT_STATE: ChatState = {
  messages: [],
  isStreaming: false,
  streamStatus: null,
};

/** Pure reducer for chat state transitions. */
export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "append_user_message":
      return {
        ...state,
        messages: [...state.messages, action.message],
      };

    case "append_assistant_message":
      return {
        ...state,
        messages: [...state.messages, action.message],
        isStreaming: true,
        streamStatus: null,
      };

    case "token":
      return {
        ...state,
        messages: appendTokenToLastAssistant(state.messages, action.delta),
      };

    case "tool_call":
      return {
        ...state,
        messages: applyToolCallToLastAssistant(state.messages, action.part),
      };

    case "citations":
      return {
        ...state,
        messages: attachCitationsToLastAssistant(
          state.messages,
          action.citations,
        ),
      };

    case "status":
      return { ...state, streamStatus: action.status };

    case "done":
      return {
        ...state,
        isStreaming: false,
        streamStatus: null,
        messages: finalizeLastAssistant(state.messages),
      };

    case "error":
      return {
        ...state,
        isStreaming: false,
        streamStatus: null,
        messages: failLastAssistant(state.messages, action.message),
      };

    case "set_streaming":
      return { ...state, isStreaming: action.value };

    default:
      return state;
  }
}

// --- Helpers ---

function appendTokenToLastAssistant(
  messages: AgenticUiMessage[],
  token: string,
): AgenticUiMessage[] {
  const lastIdx = messages.length - 1;
  if (lastIdx < 0) return messages;
  const msg = messages[lastIdx];
  if (msg.role !== "assistant") return messages;

  const parts = msg.parts ?? [];
  const last = parts[parts.length - 1];
  let newParts: MessagePart[];
  if (last?.type === "text") {
    newParts = [
      ...parts.slice(0, -1),
      { type: "text", text: last.text + token },
    ];
  } else {
    newParts = [...parts, { type: "text", text: token }];
  }

  // Derive content from text parts to keep content/parts in sync.
  const newContent = newParts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  return [
    ...messages.slice(0, -1),
    { ...msg, content: newContent, parts: newParts },
  ];
}

function applyToolCallToLastAssistant(
  messages: AgenticUiMessage[],
  part: ToolCallPart,
): AgenticUiMessage[] {
  const lastIdx = messages.length - 1;
  if (lastIdx < 0) return messages;
  const msg = messages[lastIdx];
  if (msg.role !== "assistant") return messages;

  const parts = msg.parts ?? [];
  const existingIdx = findLastToolPartIndex(
    parts,
    part.toolName,
    part.toolCallId,
  );

  if (existingIdx < 0) {
    return [
      ...messages.slice(0, -1),
      { ...msg, parts: [...parts, part] },
    ];
  }

  const updated = parts.map((p, i) => {
    if (i !== existingIdx || p.type !== "tool_call") return p;
    return {
      ...p,
      ...part,
      toolArgs:
        hasToolArgs(part.toolArgs) && Object.keys(part.toolArgs as object).length > 0
          ? part.toolArgs
          : p.toolArgs,
      toolResult: part.toolResult ?? p.toolResult,
    };
  });

  return [...messages.slice(0, -1), { ...msg, parts: updated }];
}

function attachCitationsToLastAssistant(
  messages: AgenticUiMessage[],
  citations: AgenticUiMessage["citations"],
): AgenticUiMessage[] {
  const lastIdx = messages.length - 1;
  if (lastIdx < 0) return messages;
  const msg = messages[lastIdx];
  if (msg.role !== "assistant") return messages;
  return [...messages.slice(0, -1), { ...msg, citations }];
}

function finalizeLastAssistant(
  messages: AgenticUiMessage[],
): AgenticUiMessage[] {
  const lastIdx = messages.length - 1;
  if (lastIdx < 0) return messages;
  const msg = messages[lastIdx];
  if (msg.role !== "assistant") return messages;

  const parts = (msg.parts ?? []).map((p) =>
    p.type === "tool_call" &&
    (p.toolState === "input-streaming" || p.toolState === "input-available")
      ? { ...p, toolState: "output-available" as const }
      : p,
  );

  return [...messages.slice(0, -1), { ...msg, streaming: false, parts }];
}

function failLastAssistant(
  messages: AgenticUiMessage[],
  errorMessage: string,
): AgenticUiMessage[] {
  const lastIdx = messages.length - 1;
  if (lastIdx < 0) return messages;
  const msg = messages[lastIdx];
  if (msg.role !== "assistant") return messages;

  const failedToolParts = (msg.parts ?? [])
    .filter(
      (p): p is ToolCallPart =>
        p.type === "tool_call" &&
        (p.toolState === "input-streaming" || p.toolState === "input-available"),
    )
    .map((p) => ({ ...p, toolState: "output-error" as const, toolError: errorMessage }));

  return [
    ...messages.slice(0, -1),
    {
      ...msg,
      content: errorMessage,
      streaming: false,
      error: true,
      parts: [...failedToolParts, { type: "text" as const, text: errorMessage }],
    },
  ];
}

function findLastToolPartIndex(
  parts: MessagePart[],
  toolName: string,
  toolCallId?: string,
): number {
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part.type !== "tool_call") continue;
    if (toolCallId && part.toolCallId === toolCallId) return i;
    if (!toolCallId && part.toolName === toolName) return i;
  }
  return -1;
}

function hasToolArgs(value: unknown): boolean {
  return !(typeof value === "object" && value !== null && Object.keys(value).length === 0);
}
