# Audit Agent MCP Server

FastMCP server exposing audit business tools to Agentic Core agent.

## Tools

| Tool | Description |
|------|-------------|
| `lookup_evidence` | Find evidence blocks by text search or page |
| `get_extracted_fields` | Get extracted financial fields |
| `check_financial_statement_rules` | Get audit rule results |
| `summarize_audit_findings` | Aggregate audit findings summary |

## Setup

```bash
pip install -e ".[dev]"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUDIT_AGENT_DB_PATH` | Yes | Path to SQLite database |
| `AUDIT_MCP_PORT` | No | MCP server port (default: 8765) |

## Run

```bash
python -m src.app
```

## Test

```bash
pytest -q
```

## Architecture

The MCP server reads from the same SQLite database as the web app. It is read-only — all writes happen through the web app's upload route.

```text
Core Agent -> MCP provider -> Audit MCP server
  -> SQLite reader -> documents/blocks/fields/rules
  -> structured tool result with evidence IDs
```
