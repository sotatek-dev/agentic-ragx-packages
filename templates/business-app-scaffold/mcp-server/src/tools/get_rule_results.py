"""MCP tool: get_rule_results — return sample validation/rule outcomes."""

import json

from src import repository


async def get_rule_results(document_id: str) -> str:
    """Return sample validation/rule outcomes for a document.

    Args:
        document_id: The document identifier (e.g., "doc-001").
    """
    result = repository.get_rule_results(document_id)
    if result is None:
        return json.dumps({"error": f"Document '{document_id}' not found."})
    return json.dumps(result, indent=2)
