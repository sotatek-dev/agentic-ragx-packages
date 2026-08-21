"""MCP tool: check_financial_statement_rules — return rule results for a document."""

import json

from src import repository


async def check_financial_statement_rules(
    document_id: str, rule_ids: list[str] | None = None
) -> str:
    """Return audit rule results for a document, optionally filtered by rule IDs.

    Args:
        document_id: The document identifier.
        rule_ids: Optional list of rule IDs to filter by.
    """
    results = repository.get_rule_results(document_id, rule_ids)
    if results is None:
        return json.dumps({
            "document_id": document_id,
            "rule_results": [],
            "message": f"Document '{document_id}' not found.",
        })

    summary = {
        "pass": sum(1 for r in results if r["status"] == "pass"),
        "fail": sum(1 for r in results if r["status"] == "fail"),
        "warning": sum(1 for r in results if r["status"] == "warning"),
        "error": sum(1 for r in results if r["status"] == "error"),
    }

    return json.dumps({
        "document_id": document_id,
        "rule_results": results,
        "summary": summary,
    })
