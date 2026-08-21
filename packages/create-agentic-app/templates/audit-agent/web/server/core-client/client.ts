/**
 * Core SDK client factory. Server-only — reads env vars at call time.
 */

import { AgenticCoreClient } from "@sotatek-dev/agentic-core-sdk";

let clientInstance: AgenticCoreClient | null = null;

export function getCoreClient(): AgenticCoreClient {
  if (clientInstance) return clientInstance;

  const baseUrl = process.env.AGENTIC_CORE_BASE_URL;
  const apiKey = process.env.AGENTIC_CORE_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "AGENTIC_CORE_BASE_URL and AGENTIC_CORE_API_KEY must be set",
    );
  }

  clientInstance = new AgenticCoreClient({ baseUrl, apiKey });
  return clientInstance;
}
