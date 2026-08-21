"""MCP tool: get_blocks — return text/table block snippets for a sample document."""

import json

from src import repository


async def get_blocks(document_id: str, page: int | None = None) -> str:
    """Return text/table block snippets for a sample document.

    Args:
        document_id: The document identifier (e.g., "doc-001").
        page: Optional page number to filter blocks.
    """
    result = repository.get_blocks(document_id, page)
    if result is None:
        return json.dumps({"error": f"Document '{document_id}' not found."})
    return json.dumps(result, indent=2)
