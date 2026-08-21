# Audit Agent Dogfood App

Standalone Audit Agent example app that dogfoods Agentic Core APIs, SDK, React UI, and MCP runtime.

## Architecture

```text
examples/audit-agent/
  web/          Next.js workspace (upload, document view, chat)
  mcp-server/   FastMCP server exposing audit tools to Core agent
  scripts/      Registration and validation helpers
```

**Boundary rule:** No imports from `backend/` or Core Python internals. The app talks to Core via `@sotatek-dev/agentic-core-sdk`, HTTP, and MCP only.

## Quick Start

### Prerequisites

- Node.js >= 18
- Python >= 3.11
- Running Agentic Core instance

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your Core URL, API key, and agent ID
```

### 2. Start MCP server

```bash
cd mcp-server
pip install -e ".[dev]"
python -m src.app
```

### 3. Register skill with Core

```bash
cd scripts
node register-audit-skill.mjs
```

### 4. Start web app

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3001.

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Scope | Description |
|----------|-------|-------------|
| `AGENTIC_CORE_BASE_URL` | Server | Core API base URL |
| `AGENTIC_CORE_API_KEY` | Server | Core API key (never exposed to browser) |
| `AGENTIC_CORE_AGENT_ID` | Public | Agent ID for chat |
| `AUDIT_LLM_API_KEY` | Server | LLM key for field extraction |
| `AUDIT_LLM_MODEL` | Server | LLM model for extraction |
| `AUDIT_AGENT_DB_PATH` | Server | SQLite database path |

## Manual E2E Checklist

1. Start Core and create scoped API key
2. Start Audit MCP server
3. Run registration script
4. Start Audit web app
5. Upload a sample financial PDF
6. Verify parsed blocks, extracted fields, rule results
7. Ask chat to explain failed rules with evidence
8. Confirm no API keys in browser DevTools Network tab

## Testing

```bash
# Web tests
cd web && npm test

# MCP tests
cd mcp-server && pytest -q

# Boundary scan
rg "from ['\"]?backend|backend/" examples/audit-agent
```
