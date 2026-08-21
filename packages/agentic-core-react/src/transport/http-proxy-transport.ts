/**
 * Default HTTP proxy transport for @sota-agentic-ragx/agentic-core-react.
 *
 * Calls an app-owned proxy endpoint (never the Core /v1 endpoint directly).
 * The proxy is responsible for authentication and API key injection.
 */

import type { AgenticUiStreamEvent } from "../chat/chat-types.js";
import type {
  AgenticChatTransport,
  AgenticSendMessageInput,
  AgenticStreamResult,
  HttpProxyTransportOptions,
} from "./transport-types.js";
import { parseSSEStream } from "./sse-parser.js";

const ERROR_MAP: Record<number, string> = {
  401: "Session does not have access.",
  403: "Session does not have access.",
  404: "Agent not found or unavailable.",
  429: "Rate limit exceeded. Please try again later.",
};

/** Create an HTTP transport that calls an app-owned proxy. */
export function createHttpProxyTransport(
  options: HttpProxyTransportOptions,
): AgenticChatTransport {
  const { endpoint, fetch: customFetch } = options;
  const doFetch = customFetch ?? globalThis.fetch;

  return {
    async sendMessage(
      input: AgenticSendMessageInput,
    ): Promise<AgenticStreamResult> {
      const body = {
        message: input.message,
        conversation_id: input.conversationId ?? null,
        ...input.metadata,
      };

      let response: Response;
      try {
        response = await doFetch(`${endpoint}/${input.agentId}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        throw new Error(`Cannot reach the proxy at ${endpoint}.`);
      }

      if (!response.ok) {
        const msg = ERROR_MAP[response.status] ?? `Proxy error: HTTP ${response.status}`;
        throw new Error(msg);
      }

      if (!response.body) {
        throw new Error("Proxy returned an empty response body.");
      }

      return {
        events: parseSSEStream(response.body),
      };
    },
  };
}
