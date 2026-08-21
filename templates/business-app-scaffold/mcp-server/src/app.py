"""FastMCP server entrypoint — registers audit-like finance tools."""

from mcp.server.fastmcp import FastMCP

from src.tools.get_blocks import get_blocks
from src.tools.get_fields import get_fields
from src.tools.get_rule_results import get_rule_results

PROMPT_FRAGMENT = """Use finance document tools only for the sample document. \
Cite fields as [Field: key], blocks as [Block: id, page N], and rule results as [Rule: id]. \
If a tool returns no matching data, say what could not be checked."""

mcp = FastMCP(
    "Finance Audit Sample",
    instructions=PROMPT_FRAGMENT,
)

# Register tools
mcp.tool()(get_fields)
mcp.tool()(get_blocks)
mcp.tool()(get_rule_results)


def main():
    """Run the MCP server."""
    mcp.run(transport="streamable-http")


if __name__ == "__main__":
    main()
