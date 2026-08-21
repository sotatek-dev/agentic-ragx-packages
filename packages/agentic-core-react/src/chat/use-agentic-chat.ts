/**
 * React hook for Agentic Core chat with streaming support.
 *
 * Manages message state, streaming lifecycle, and transport interaction.
 * One active send per hook instance — calling send while streaming is a no-op.
 */

import { useCallback, useReducer, useRef } from "react";
import type { AgenticChatTransport } from "../transport/transport-types.js";
import type {
  AgenticUiMessage,
  AgenticUiStreamEvent,
  Citation,
  StreamStatusData,
} from "./chat-types.js";
import {
  chatReducer,
  INITIAL_CHAT_STATE,
  type ChatState,
} from "./chat-state.js";

export interface UseAgenticChatOptions {
  /** Transport to use for sending messages. */
  transport: AgenticChatTransport;
  /** Agent ID to send messages to. */
  agentId: string;
  /** Optional initial conversation ID for resuming. */
  conversationId?: string | null;
}

export interface UseAgenticChatReturn {
  /** Current message list. */
  messages: AgenticUiMessage[];
  /** Whether a stream is in progress. */
  isStreaming: boolean;
  /** Current stream status (stage/action). */
  streamStatus: StreamStatusData | null;
  /** Send a user message. No-op if already streaming. */
  sendMessage: (text: string) => Promise<void>;
}

/** Generate a random ID (crypto.randomUUID fallback). */
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useAgenticChat(
  options: UseAgenticChatOptions,
): UseAgenticChatReturn {
  const { transport, agentId } = options;
  const conversationIdRef = useRef(options.conversationId ?? null);
  const [state, dispatch] = useReducer(chatReducer, INITIAL_CHAT_STATE);

  const sendMessage = useCallback(
    async (text: string) => {
      if (state.isStreaming) return;

      const userMsg: AgenticUiMessage = {
        id: generateId(),
        role: "user",
        content: text,
        parts: [{ type: "text", text }],
        citations: [],
      };
      dispatch({ type: "append_user_message", message: userMsg });

      const assistantId = generateId();
      const assistantMsg: AgenticUiMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        parts: [],
        citations: [],
        streaming: true,
      };
      dispatch({ type: "append_assistant_message", message: assistantMsg });

      try {
        const result = await transport.sendMessage({
          agentId,
          message: text,
          conversationId: conversationIdRef.current,
        });

        if (result.conversationId) {
          conversationIdRef.current = result.conversationId;
        }

        for await (const event of result.events) {
          applyEvent(event, dispatch);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? redactSensitive(err.message) : "Unknown error";
        dispatch({ type: "error", message: msg });
      }
    },
    [transport, agentId, state.isStreaming],
  );

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    streamStatus: state.streamStatus,
    sendMessage,
  };
}

function applyEvent(
  event: AgenticUiStreamEvent,
  dispatch: (action: ReturnType<typeof dispatchWrapper>) => void,
): void {
  switch (event.type) {
    case "status":
      dispatch({
        type: "status",
        status: { stage: event.stage, action: event.tool },
      });
      break;
    case "token":
      dispatch({ type: "token", delta: event.delta });
      break;
    case "tool_call":
      dispatch({ type: "tool_call", part: event.part });
      break;
    case "citations":
      dispatch({ type: "citations", citations: event.citations });
      break;
    case "done":
      dispatch({ type: "done" });
      break;
    case "error":
      dispatch({
        type: "error",
        message: redactSensitive(event.message),
      });
      break;
  }
}

/** Wrapper to satisfy TypeScript — dispatch expects ChatAction. */
function dispatchWrapper(action: ChatAction): ChatAction {
  return action;
}

/** Redact potential secrets from error messages shown in UI. */
function redactSensitive(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]")
    .replace(/[Aa]pi[_-]?[Kk]ey[=:]\s*\S+/gi, "api_key=[REDACTED]")
    .replace(/sk-[A-Za-z0-9]{20,}/g, "sk-[REDACTED]");
}

// Re-export for internal use
type ChatAction = Parameters<typeof chatReducer>[1];
