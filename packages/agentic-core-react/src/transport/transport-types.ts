/** Transport type contracts for @sotatek-dev/agentic-core-react. */

import type { AgenticUiStreamEvent } from "../chat/chat-types.js";

/** Input for sending a message through the transport. */
export interface AgenticSendMessageInput {
  agentId: string;
  message: string;
  conversationId?: string | null;
  metadata?: Record<string, unknown>;
}

/** Result returned by the transport after sending a message. */
export interface AgenticStreamResult {
  conversationId?: string | null;
  events: AsyncIterable<AgenticUiStreamEvent>;
}

/** Transport interface that the chat hook uses to send messages. */
export interface AgenticChatTransport {
  sendMessage(input: AgenticSendMessageInput): Promise<AgenticStreamResult>;
}

/** Options for creating the default HTTP proxy transport. */
export interface HttpProxyTransportOptions {
  /** App-owned proxy endpoint, e.g. "/api/agentic-chat". Must NOT be the Core /v1 endpoint. */
  endpoint: string;
  /** Custom fetch implementation (defaults to global fetch). */
  fetch?: typeof globalThis.fetch;
}
