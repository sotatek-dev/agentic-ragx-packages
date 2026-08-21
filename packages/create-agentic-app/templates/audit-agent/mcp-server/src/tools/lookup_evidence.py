"""MCP tool: lookup_evidence — find evidence blocks in a document."""

import json

from src import repository


async def lookup_evidence(
    document_id: str, query: str | None = None, page: int | None = None
) -> str:
    """Find evidence blocks in a document by text search or page number.

    Args:
        document_id: The document identifier.
        query: Optional text to search for within blocks.
        page: Optional page number to filter blocks.
    """
    blocks = repository.search_blocks(document_id, query, page)
    if blocks is None:
        return json.dumps({
            "document_id": document_id,
            "blocks": [],
            "message": f"Document '{document_id}' not found.",
        })
    return json.dumps({
        "document_id": document_id,
        "blocks": blocks,
        "count": len(blocks),
    })
