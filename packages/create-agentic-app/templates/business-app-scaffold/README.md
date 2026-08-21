# Business App Scaffold Template

A reusable template proving a separate business app can integrate with Agentic Core over HTTP/MCP. Uses `@sota-agentic-ragx/agentic-core-react` for chat UI, `@sota-agentic-ragx/agentic-core-sdk` for server proxy, and Python FastMCP for business tools.

## Architecture

```text
Browser
  → web UI (@sota-agentic-ragx/agentic-core-react)
  → /api/agentic-chat/{agentId}/message (server proxy)
  → @sota-agentic-ragx/agentic-core-sdk
  → Core /v1/agents/{id}/invoke
  → MCP provider discovers tools
  → mcp-server get_fields/get_blocks/get_rule_results
  → Core SSE stream
  → React chat UI
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- Running Agentic Core backend with API key

## Quick Start

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your Core API key and agent ID
```

### 2. Start MCP server

```bash
cd mcp-server
pip install -e .
mcp-server
```

### 3. Register skill with Core

```bash
cd scripts
node register-core-skill.mjs
```

### 4. Start web app

```bash
cd web
npm install
npm run dev
```

### 5. Chat

Open http://localhost:3001, enter your agent ID, and ask:
> "What finance fields are available and which rules failed?"

## Components

| Component | Stack | Purpose |
|-----------|-------|---------|
| `web/` | Next.js 15 + React 19 | Chat UI with server-side API key proxy |
| `mcp-server/` | Python FastMCP | Audit-like finance document tools |
| `scripts/` | Node.js | Idempotent skill registration |

## Core Capabilities Used

- **Agent Invoke API**: `/v1/agents/{id}/invoke` with SSE streaming
- **Skill CRUD API**: `/v1/skills*` for metadata management
- **Document Processing API**: `/v1/document-processing/parse` for file parsing (optional)
- **MCP Runtime Skills**: Core discovers tools from MCP server

## Security

- `AGENTIC_CORE_API_KEY` is server-only — never exposed to browser
- MCP token is referenced by env var name, not stored as raw value
- All tools are read-only
- No real customer data in sample

## Production Hardening

- Use HTTPS for non-localhost MCP endpoints
- Add authentication/authorization to MCP server
- Replace static sample data with real business data store
- Add rate limiting and error monitoring
- Use proper secret management (not .env files)
