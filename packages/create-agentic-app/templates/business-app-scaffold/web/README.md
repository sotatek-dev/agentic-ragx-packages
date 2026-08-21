# Business App Web

Minimal Next.js chat app using `@sota-agentic-ragx/agentic-core-react` and `@sota-agentic-ragx/agentic-core-sdk`.

## Setup

```bash
npm install
cp .env.example .env  # Configure AGENTIC_CORE_BASE_URL and AGENTIC_CORE_API_KEY
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AGENTIC_CORE_BASE_URL` | Yes | Core API base URL |
| `AGENTIC_CORE_API_KEY` | Yes | API key (server-only, never exposed to browser) |
| `NEXT_PUBLIC_AGENT_ID` | No | Default agent ID (can be entered in UI) |

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Chat UI |
| `/api/agentic-chat/[agentId]/message` | SSE proxy to Core |
| `/api/documents/parse` | Document parse proxy to Core |

## Testing

```bash
npm test
```
