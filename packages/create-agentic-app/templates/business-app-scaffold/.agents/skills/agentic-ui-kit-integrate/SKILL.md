---
name: agentic-ui-kit-integrate
description: Integrate @sota-agentic-ragx/agentic-core-react chat components into a Next.js app with Tailwind CSS 4 styling.
---

# Agentic UI Kit Integrate

Integrate the Agentic Core React UI Kit into a Next.js application.

## Required Context

Before starting, read these files:
- `web/components/business-chat-shell.tsx` — chat shell component
- `web/app/globals.css` — Tailwind CSS configuration
- `web/next.config.ts` — Next.js config with transpilePackages
- `web/package.json` — dependencies

## Workflow

1. **Install packages** — `npm install @sota-agentic-ragx/agentic-core-react`
2. **Configure Next.js** — Add to `next.config.ts`:
   ```typescript
   transpilePackages: ["@sota-agentic-ragx/agentic-core-react"]
   ```
3. **Configure Tailwind** — Add to `globals.css`:
   ```css
   @source "../node_modules/@sota-agentic-ragx/agentic-core-react/dist";
   ```
4. **Create chat transport** — Use `createHttpProxyTransport`:
   ```typescript
   import { createHttpProxyTransport } from "@sota-agentic-ragx/agentic-core-react"
   const transport = createHttpProxyTransport({ endpoint: "/api/agentic-chat" })
   ```
5. **Use chat hook** — Use `useAgenticChat`:
   ```typescript
   import { useAgenticChat } from "@sota-agentic-ragx/agentic-core-react"
   const { messages, isStreaming, sendMessage } = useAgenticChat({ transport, agentId })
   ```
6. **Render components** — Use `ChatMessageList`, `ChatInput`, `CitationSheet`:
   ```tsx
   import { ChatMessageList, ChatInput, CitationSheet } from "@sota-agentic-ragx/agentic-core-react"
   ```

## Security Constraints

- **NEVER** pass API keys to the React components
- All API calls go through the proxy transport (server-side)
- Use `NEXT_PUBLIC_AGENT_ID` only for agent ID, never for API keys

## Validation Checklist

- [ ] Package installed as dependency
- [ ] Next.js transpilePackages configured
- [ ] Tailwind source path configured
- [ ] Chat transport created with proxy endpoint
- [ ] Chat hook integrated with agent ID
- [ ] Components render correctly
- [ ] Streaming works end-to-end
- [ ] Citations display properly
