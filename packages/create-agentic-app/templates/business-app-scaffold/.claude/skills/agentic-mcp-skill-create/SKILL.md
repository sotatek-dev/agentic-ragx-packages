---
name: agentic-mcp-skill-create
description: Create and register an MCP server with custom tools that extend an Agentic Core agent's capabilities.
---

# Agentic MCP Skill Create

Create an MCP (Model Context Protocol) server with custom tools and register it as a skill in Agentic Core.

## Required Context

Before starting, read these files:
- `mcp-server/src/app.py` — existing MCP server example
- `mcp-server/src/tools/` — tool implementation examples
- `scripts/register-core-skill.mjs` — skill registration script
- `mcp-server/pyproject.toml` — Python project configuration

## Workflow

1. **Create MCP server** — Use Python FastMCP:
   ```python
   from mcp.server.fastmcp import FastMCP
   
   mcp = FastMCP("my-tools")
   
   @mcp.tool()
   def my_tool(param: str) -> str:
       """Tool description for LLM."""
       return f"Result: {param}"
   ```

2. **Define tools** — Each tool needs:
   - Clear name and description
   - Typed parameters (use Pydantic models for complex inputs)
   - Return structured data (dict/list, not raw strings)
   - Error handling with meaningful messages

3. **Configure environment** — Add to `.env`:
   ```
   MY_MCP_TOKEN=sk-optional-auth-token
   ```

4. **Register with Core** — Run registration script:
   ```bash
   cd scripts
   node register-core-skill.mjs
   ```
   This creates a Skill in Core linked to your MCP endpoint.

5. **Test tools** — Verify in Core admin:
   - Check Admin → Developer → Apps → your app → Integration Status
   - Tool call errors appear in agent's tool_calls response field

## Security Constraints

- MCP auth tokens are referenced by env-var name, never stored as raw values
- Use `mcp_auth_token_ref=MY_MCP_TOKEN` in skill registration
- Core reads the token from the named env-var at runtime
- All tools should be read-only unless explicitly designed for writes

## Validation Checklist

- [ ] MCP server starts without errors
- [ ] Tools have clear descriptions
- [ ] Parameters are properly typed
- [ ] Registration script succeeds
- [ ] Tools appear in Core admin
- [ ] Agent can call tools during conversation
- [ ] Error handling works correctly
