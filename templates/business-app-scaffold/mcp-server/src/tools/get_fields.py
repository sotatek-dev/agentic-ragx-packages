"""MCP tool: get_fields — return extracted finance fields for a sample document."""

import json

from src import repository


async def get_fields(document_id: str) -> str:
    """Return extracted finance fields for a sample document.

    Args:
        document_id: The document identifier (e.g., "doc-001").
    """
    result = repository.get_fields(document_id)
    if result is None:
        return json.dumps({"error": f"Document '{document_id}' not found."})
    return json.dumps(result, indent=2)
