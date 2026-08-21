# Audit Agent Web App

Next.js workspace for financial document audit.

## Features

- **Upload** — Upload PDF/image documents, parse via Core API
- **Document View** — Inspect parsed blocks (text, tables)
- **Extracted Fields** — View LLM-extracted financial fields with confidence scores
- **Rule Results** — See audit rule outcomes (pass/fail/warning)
- **Chat** — Ask questions about audit findings, grounded in evidence

## Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `AGENTIC_CORE_BASE_URL` | Server | Core API base URL |
| `AGENTIC_CORE_API_KEY` | Server | Core API key (never exposed to browser) |
| `AGENTIC_CORE_AGENT_ID` | Public | Agent ID for chat |
| `AUDIT_LLM_API_KEY` | Server | LLM key for field extraction |
| `AUDIT_LLM_MODEL` | Server | LLM model (default: gpt-4o) |
| `AUDIT_AGENT_DB_PATH` | Server | SQLite database path |

## Scripts

```bash
npm run dev    # Start dev server on port 3001
npm test       # Run tests
npm run lint   # TypeScript typecheck
npm run build  # Production build
```

## Architecture

All Core/LLM calls are server-side API routes. The browser never sees API keys.

```text
Browser -> Next.js API routes -> Core SDK / LLM provider
Browser -> SQLite (via server routes only)
```
