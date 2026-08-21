/** Agentic Core client — entry point for the SDK. */

import { AgentsResource } from "./agents.js";
import { DocumentsResource } from "./documents.js";

export interface AgenticCoreClientOptions {
  /** Base URL of the Agentic Core API (no trailing slash). */
  baseUrl: string;
  /** API key for Bearer authentication. */
  apiKey: string;
  /** Optional custom fetch implementation (defaults to globalThis.fetch). */
  fetch?: typeof globalThis.fetch;
}

/**
 * Client for the Agentic Core API.
 *
 * Node/server-only — API keys are service credentials and must not be
 * exposed in browser bundles.
 *
 * @example
 * ```ts
 * const client = new AgenticCoreClient({
 *   baseUrl: "https://core.example.com",
 *   apiKey: process.env.AGENTIC_CORE_API_KEY!,
 * });
 *
 * const { events, conversationId } = await client.agents.invokeStream({
 *   agentId: "abc-123",
 *   message: "What is Qdrant?",
 * });
 *
 * for await (const event of events) {
 *   if (event.type === "token") process.stdout.write(event.delta);
 * }
 * ```
 */
export class AgenticCoreClient {
  readonly agents: AgentsResource;
  readonly documents: DocumentsResource;

  constructor(options: AgenticCoreClientOptions) {
    const fetchFn = options.fetch ?? globalThis.fetch;
    const baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.agents = new AgentsResource(baseUrl, options.apiKey, fetchFn);
    this.documents = new DocumentsResource(baseUrl, options.apiKey, fetchFn);
  }
}
