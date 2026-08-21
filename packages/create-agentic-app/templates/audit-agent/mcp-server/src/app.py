"""FastMCP server entrypoint — registers audit business tools."""

import os

from mcp.server.fastmcp import FastMCP

from src.tools.lookup_evidence import lookup_evidence
from src.tools.get_extracted_fields import get_extracted_fields
from src.tools.check_financial_statement_rules import check_financial_statement_rules
from src.tools.summarize_audit_findings import summarize_audit_findings

PROMPT_FRAGMENT = (
    "Use audit tools to inspect document evidence, extracted fields, "
    "and rule results. Cite fields as [Field: key], blocks as [Block: id, page N], "
    "and rule results as [Rule: id]. If a tool returns no matching data, "
    "say what could not be checked."
)

mcp = FastMCP(
    "Audit Agent Dogfood",
    instructions=PROMPT_FRAGMENT,
)

# Register tools
mcp.tool()(lookup_evidence)
mcp.tool()(get_extracted_fields)
mcp.tool()(check_financial_statement_rules)
mcp.tool()(summarize_audit_findings)


def main():
    """Run the MCP server."""
    port = int(os.environ.get("AUDIT_MCP_PORT", "8765"))
    mcp.run(transport="streamable-http")


if __name__ == "__main__":
    main()
