# @sota-agentic-ragx

<div align="center">

<h3>Developer packages for building AI-powered business applications</h3>

<a href="https://www.npmjs.com/package/@sota-agentic-ragx/agentic-core-sdk">
  <img src="https://img.shields.io/npm/v/@sota-agentic-ragx/agentic-core-sdk.svg?style=flat-square" alt="npm version" />
</a>
<a href="https://www.npmjs.com/package/@sota-agentic-ragx/agentic-core-react">
  <img src="https://img.shields.io/npm/v/@sota-agentic-ragx/agentic-core-react.svg?style=flat-square" alt="npm version" />
</a>
<a href="./LICENSE">
  <img src="https://img.shields.io/npm/l/@sota-agentic-ragx/agentic-core-sdk.svg?style=flat-square" alt="license" />
</a>

</div>

---

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@sota-agentic-ragx/agentic-core-sdk`](./packages/agentic-core-ts) | Node/TypeScript SDK for server-side API integration | ![](https://img.shields.io/npm/v/@sota-agentic-ragx/agentic-core-sdk?style=flat-square) |
| [`@sota-agentic-ragx/agentic-core-react`](./packages/agentic-core-react) | React 19 chat UI components and evidence preview | ![](https://img.shields.io/npm/v/@sota-agentic-ragx/agentic-core-react?style=flat-square) |
| [`@sota-agentic-ragx/create-agentic-app`](./packages/create-agentic-app) | CLI scaffold for new business apps | ![](https://img.shields.io/npm/v/@sota-agentic-ragx/create-agentic-app?style=flat-square) |

## Quick Start

### 1. Scaffold a new app

```bash
npx @sota-agentic-ragx/create-agentic-app --template business-app --name my-app
cd my-app
```

### 2. Install SDK (server-side)

```bash
npm install @sota-agentic-ragx/agentic-core-sdk
```

```typescript
import { AgenticCoreClient } from "@sota-agentic-ragx/agentic-core-sdk"

const client = new AgenticCoreClient({
  baseUrl: process.env.AGENTIC_CORE_BASE_URL!,
  apiKey: process.env.AGENTIC_CORE_API_KEY!,
})

const { events } = await client.agents.invokeStream({
  agentId: "your-agent-id",
  message: "What are the Q2 revenue figures?",
})

for await (const event of events) {
  if (event.type === "token") process.stdout.write(event.delta)
}
```

### 3. Install React UI Kit (client-side)

```bash
npm install @sota-agentic-ragx/agentic-core-react
```

```tsx
import {
  ChatMessageList,
  ChatInput,
  useAgenticChat,
  createHttpProxyTransport,
} from "@sota-agentic-ragx/agentic-core-react"

const transport = createHttpProxyTransport({ endpoint: "/api/agentic-chat" })

function Chat() {
  const { messages, isStreaming, sendMessage } = useAgenticChat({
    transport,
    agentId: "your-agent-id",
  })

  return (
    <div className="flex flex-col h-full">
      <ChatMessageList messages={messages} />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  )
}
```

## Architecture

```text
Browser (React UI Kit)
  → /api/agentic-chat (your server proxy)
    → Agentic Core API
      → LLM + Tools + Knowledge Bases
    ← SSE stream
  ← Chat UI updates
```

**Important:** The SDK is server-only. Never expose API keys in browser code. All browser requests go through your server proxy.

## Features

### SDK (`@sota-agentic-ragx/agentic-core-sdk`)

- **Streaming** — Real-time token streaming via SSE
- **Agent Invoke** — Send messages and receive responses
- **Document Processing** — Parse PDFs, images, and extract tables
- **Error Handling** — Typed errors with status codes
- **Zero Dependencies** — Lightweight, no external deps

### React UI Kit (`@sota-agentic-ragx/agentic-core-react`)

- **Chat Components** — MessageList, ChatInput, ToolCallCard
- **Citation Support** — Inline markers with popover details
- **Evidence Preview** — PDF, text, and markdown viewers
- **Streaming State** — Real-time status updates
- **Tailwind CSS 4** — Utility-first styling

### CLI (`@sota-agentic-ragx/create-agentic-app`)

- **Templates** — Pre-built app scaffolds
- **Skills** — Generated Claude/Codex agent skills
- **MCP Server** — Tool server template included

## Requirements

- Node.js 18+
- React 19+ (for UI Kit)
- Tailwind CSS 4 (for UI Kit)

## Security

- **Server-only API keys** — Never expose in browser code
- **Proxy pattern** — Browser calls your server, not Core directly
- **MCP tokens** — Referenced by env-var name, not stored as raw values

## API Reference

### SDK

| Class/Function | Description |
|----------------|-------------|
| `AgenticCoreClient` | Main client for Core API |
| `AgentsResource` | Agent invoke and streaming |
| `DocumentsResource` | Document parsing |
| `AgenticHttpError` | HTTP error with status code |
| `parseSSEStream` | SSE stream parser |

### React UI Kit

| Component | Description |
|-----------|-------------|
| `ChatMessageList` | Scrollable message list |
| `ChatInput` | Textarea with send button |
| `ToolCallCard` | Tool invocation display |
| `CitationSheet` | Citation details panel |
| `EvidencePreview` | Document viewer |
| `useAgenticChat` | Chat state hook |
| `createHttpProxyTransport` | HTTP proxy factory |

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](../LICENSE)
