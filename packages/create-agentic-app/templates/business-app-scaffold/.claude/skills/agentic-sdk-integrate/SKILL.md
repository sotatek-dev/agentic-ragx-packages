---
name: agentic-sdk-integrate
description: Integrate @sota-agentic-ragx/agentic-core-sdk into a Next.js app with server-side proxy for secure API key handling.
---

# Agentic SDK Integrate

Integrate the Agentic Core TypeScript SDK into a Next.js application with a server-side proxy pattern.

## Required Context

Before starting, read these files:
- `web/app/api/agentic-chat/[agentId]/message/route.ts` — existing proxy route
- `web/app/api/documents/parse/route.ts` — document parse proxy
- `web/server/core-client/client.ts` — SDK client factory
- `web/.env.example` — required environment variables

## Workflow

1. **Install package** — `npm install @sota-agentic-ragx/agentic-core-sdk`
2. **Create server client** — Create `server/core-client/client.ts`:
   ```typescript
   import { AgenticCoreClient } from "@sota-agentic-ragx/agentic-core-sdk"
   
   export function getCoreClient(): AgenticCoreClient {
     const baseUrl = process.env.AGENTIC_CORE_BASE_URL!
     const apiKey = process.env.AGENTIC_CORE_API_KEY!
     return new AgenticCoreClient({ baseUrl, apiKey })
   }
   ```
3. **Create proxy route** — Create `app/api/agentic-chat/[agentId]/message/route.ts`:
   - Accept POST with `{ message, conversation_id? }`
   - Create `AgenticCoreClient` with server-only credentials
   - Call `client.agents.invokeStream()` and proxy SSE events
   - Map `AgenticHttpError` to appropriate HTTP status codes
4. **Create document proxy** (optional) — Create `app/api/documents/parse/route.ts`:
   - Accept multipart form with file upload
   - Call `client.documents.parse()` and return result
5. **Configure environment** — Add to `.env`:
   ```
   AGENTIC_CORE_BASE_URL=http://localhost:8000
   AGENTIC_CORE_API_KEY=sk-your-key
   ```

## Security Constraints

- **NEVER** import `@sota-agentic-ragx/agentic-core-sdk` in client components
- **NEVER** expose `AGENTIC_CORE_API_KEY` with `NEXT_PUBLIC_` prefix
- All SDK calls must be in server-side code only (API routes, server components)
- Use `AgenticHttpError` for error handling, never leak internal error details

## Validation Checklist

- [ ] SDK installed as dependency
- [ ] Server client factory created
- [ ] Proxy route handles SSE streaming
- [ ] Error mapping works (401, 403, 404, 429, 500)
- [ ] No SDK imports in client components
- [ ] API key not visible in browser DevTools
