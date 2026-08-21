"""MCP tool: summarize_audit_findings — aggregate audit findings for a document."""

import json

from src import repository


async def summarize_audit_findings(document_id: str) -> str:
    """Summarize audit findings: failed rules, top evidence, field coverage.

    Args:
        document_id: The document identifier.
    """
    # Get document
    doc = repository.get_document(document_id)
    if doc is None:
        return json.dumps({
            "document_id": document_id,
            "summary": None,
            "message": f"Document '{document_id}' not found.",
        })

    # Get fields
    fields_result = repository.get_fields(document_id)
    fields = fields_result["fields"] if fields_result else []

    # Get rules
    rule_results = repository.get_rule_results(document_id) or []

    # Aggregate
    failed_rules = [r for r in rule_results if r["status"] in ("fail", "error")]
    warning_rules = [r for r in rule_results if r["status"] == "warning"]

    # Collect evidence block IDs from failed rules
    evidence_ids = set()
    for rule in failed_rules:
        if rule.get("evidence_block_ids_json"):
            try:
                ids = json.loads(rule["evidence_block_ids_json"])
                evidence_ids.update(ids)
            except (json.JSONDecodeError, TypeError):
                pass

    return json.dumps({
        "document_id": document_id,
        "filename": doc["filename"],
        "status": doc["status"],
        "summary": {
            "total_fields": len(fields),
            "total_rules": len(rule_results),
            "passed": sum(1 for r in rule_results if r["status"] == "pass"),
            "failed": len(failed_rules),
            "warnings": len(warning_rules),
            "failed_rule_messages": [r["message"] for r in failed_rules],
            "warning_rule_messages": [r["message"] for r in warning_rules],
            "evidence_block_ids": list(evidence_ids),
        },
    })
