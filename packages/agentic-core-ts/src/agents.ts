/** Agents resource — invoke agent with streaming. */

import type { AgenticStreamEvent } from "./events.js";
import { AgenticHttpError } from "./errors.js";
import { parseSSEStream } from "./sse-parser.js";

export interface InvokeStreamOptions {
  agentId: string;
  message: string;
  conversationId?: string;
}

export interface InvokeStreamResult {
  /** Async iterable of typed stream events. */
  events: AsyncGenerator<AgenticStreamEvent>;
  /** Conversation ID from the X-Conversation-Id response header. */
  conversationId: string | null;
}

/** Agents resource bound to a client configuration. */
export class AgentsResource {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly fetchFn: typeof globalThis.fetch,
  ) {}

  /**
   * Invoke an agent and return a typed async iterable of stream events.
   *
   * The API key is sent as a Bearer token. It is never included in error messages.
   */
  async invokeStream(options: InvokeStreamOptions): Promise<InvokeStreamResult> {
    const url = `${this.baseUrl}/v1/agents/${options.agentId}/invoke`;

    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          message: options.message,
          conversation_id: options.conversationId,
          stream: true,
        }),
      });
    } catch (err) {
      throw new AgenticHttpError(0, `Network error: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const body = await response.text();
        const parsed = JSON.parse(body);
        detail = parsed.detail ?? body;
      } catch {
        // use default detail
      }
      throw new AgenticHttpError(response.status, detail);
    }

    if (!response.body) {
      throw new AgenticHttpError(0, "Response body is empty");
    }

    const conversationId = response.headers.get("X-Conversation-Id");
    const events = parseSSEStream(response.body);

    return { events, conversationId };
  }
}
