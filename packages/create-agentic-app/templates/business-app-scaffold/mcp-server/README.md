# Business App MCP Server

> Part of the [Business App Scaffold](../README.md) template. Run `scripts/register-core-skill.mjs` to register tools with Core.

Sample FastMCP server with audit-like finance document tools. This is a **demonstration server** using static sample data -- it is NOT a production Audit system and contains no real customer data.

## Installation

```bash
pip install -e .
```

For development (includes test dependencies):

```bash
pip install -e ".[dev]"
```

## Running

```bash
# Via the installed entrypoint
mcp-server

# Or directly
python -m src.app
```

The server starts with Streamable HTTP transport.

## Available Tools

| Tool | Description |
|------|-------------|
| `get_fields` | Return extracted finance fields for a document (company name, revenue, audit opinion, etc.) |
| `get_blocks` | Return text/table block snippets, optionally filtered by page |
| `get_rule_results` | Return validation rule outcomes (pass/fail/warning) |

## Sample Document

The server ships with one sample document (`doc-001`) representing a fictional audit report for "Acme Corp". All data is static and read-only.

## Testing

```bash
pytest -v
```
