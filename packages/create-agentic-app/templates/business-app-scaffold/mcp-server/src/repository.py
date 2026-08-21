"""Repository for sample finance document data."""

from src.sample_data import SAMPLE_DOCUMENTS


def get_document(document_id: str) -> dict | None:
    """Get a document by ID."""
    return SAMPLE_DOCUMENTS.get(document_id)


def get_fields(document_id: str) -> dict | None:
    """Get extracted fields for a document."""
    doc = get_document(document_id)
    if doc is None:
        return None
    return {
        "document_id": doc["document_id"],
        "filename": doc["filename"],
        "fields": doc["fields"],
    }


def get_blocks(document_id: str, page: int | None = None) -> list[dict] | None:
    """Get text/table blocks for a document, optionally filtered by page."""
    doc = get_document(document_id)
    if doc is None:
        return None
    blocks = doc["blocks"]
    if page is not None:
        blocks = [b for b in blocks if b["page"] == page]
    return blocks


def get_rule_results(document_id: str) -> list[dict] | None:
    """Get rule validation results for a document."""
    doc = get_document(document_id)
    if doc is None:
        return None
    return doc["rule_results"]
