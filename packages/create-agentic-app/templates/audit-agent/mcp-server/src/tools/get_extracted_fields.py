"""MCP tool: get_extracted_fields — return extracted fields for a document."""

import json

from src import repository


async def get_extracted_fields(
    document_id: str, keys: list[str] | None = None
) -> str:
    """Return extracted fields for a document, optionally filtered by field keys.

    Args:
        document_id: The document identifier.
        keys: Optional list of field keys to filter by (e.g., ["total_revenue", "net_income"]).
    """
    result = repository.get_fields(document_id, keys)
    if result is None:
        return json.dumps({
            "document_id": document_id,
            "fields": [],
            "message": f"Document '{document_id}' not found.",
        })
    return json.dumps(result)
