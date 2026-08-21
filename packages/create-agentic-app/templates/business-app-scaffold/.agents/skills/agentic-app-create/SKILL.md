---
name: agentic-app-create
description: Scaffold a new Agentic Core business app with Next.js chat UI, server proxy, and MCP server from the business-app template.
---

# Agentic App Create

Scaffold a new Agentic Core business app from the `business-app` template.

## Required Context

Before starting, read these files:
- `package.json` — current project dependencies
- `.env.example` — required environment variables
- `web/README.md` — web app setup instructions
- `mcp-server/README.md` — MCP server setup instructions

## Workflow

1. **Copy template** — Use `create-agentic-app` CLI or manually copy from `templates/business-app-scaffold/`
2. **Configure environment** — Copy `.env.example` to `.env` and set:
   - `AGENTIC_CORE_BASE_URL` — Core API endpoint
   - `AGENTIC_CORE_API_KEY` — Server-only API key (never expose to browser)
   - `AGENTIC_CORE_AGENT_ID` — Agent ID for chat
3. **Install dependencies** — Run `npm install` in `web/` directory
4. **Start MCP server** — Run `cd mcp-server && pip install -e . && mcp-server`
5. **Register skill** — Run `cd scripts && node register-core-skill.mjs`
6. **Start web app** — Run `cd web && npm run dev`

## Security Constraints

- **NEVER** expose `AGENTIC_CORE_API_KEY` in browser/client code
- All API calls must go through the Next.js server proxy (`/api/agentic-chat/`)
- Store MCP token references by env-var name, not raw values
- Use `.env.example` for documentation, `.env` for secrets (gitignored)

## Validation Checklist

- [ ] `.env` configured with valid Core URL and API key
- [ ] MCP server starts without errors
- [ ] Skill registration succeeds (check Core admin)
- [ ] Web app loads at http://localhost:3001
- [ ] Chat sends messages and receives streaming responses
- [ ] No API keys visible in browser DevTools Network tab
