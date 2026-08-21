# @sotatek-dev/agentic-core-sdk

Node/server TypeScript SDK for the Agentic Core API. Invokes agents via `/v1/agents/{id}/invoke` with API-key authentication and typed async iterable streaming.

## Install

```bash
npm install @sotatek-dev/agentic-core-sdk
```

## Usage

```typescript
import { AgenticCoreClient } from "@sotatek-dev/agentic-core-sdk";

const client = new AgenticCoreClient({
  baseUrl: "https://core.example.com",
  apiKey: process.env.AGENTIC_CORE_API_KEY!,
});

const { events, conversationId } = await client.agents.invokeStream({
  agentId: "abc-123",
  message: "What is Qdrant?",
});

for await (const event of events) {
  switch (event.type) {
    case "token":
      process.stdout.write(event.delta);
      break;
    case "status":
      console.error(`[${event.stage}]`, event.tool ?? "");
      break;
    case "tool_call":
      console.error(`Tool: ${event.toolName} (${event.toolState})`);
      break;
    case "citations":
      for (const c of event.citations) {
        console.error(`  Cite: ${c.source} p.${c.page} (${c.chunk_id})`);
      }
      break;
    case "done":
      console.error("\n--- Done ---");
      break;
    case "error":
      console.error("Error:", event.message);
      break;
  }
}

console.log("Conversation:", conversationId);
```

## Events

| Event | Fields | Description |
|-------|--------|-------------|
| `status` | `stage`, `tool?` | Status update (building_agent, thinking, retrieving, retrieved) |
| `token` | `delta` | LLM text streaming |
| `tool_call` | `toolCallId`, `toolName`, `toolArgs`, `toolState`, `toolResult`, `toolError` | Tool invocation state |
| `citations` | `citations[]` | Citations from retrieval |
| `done` | — | Stream completed |
| `error` | `message` | Stream failed |

## Errors

- `AgenticHttpError` — non-2xx response (includes status code and detail)
- `AgenticStreamParseError` — malformed SSE stream
- API keys are never included in error messages

## Security

- **Node/server-only** — API keys are service credentials, not for browser use
- Bearer authentication via `Authorization` header
- API keys redacted from all error messages

## Development

```bash
npm install
npm test
npm run build
```
