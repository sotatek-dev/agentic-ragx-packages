"""Tests for MCP tool functions against seeded SQLite."""

import json
import os
import sqlite3
import tempfile

import pytest

# Set DB path before importing tools
_test_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["AUDIT_AGENT_DB_PATH"] = _test_db.name
_test_db.close()


def _seed_db():
    """Seed a temporary SQLite DB with test data."""
    conn = sqlite3.connect(_test_db.name)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY, filename TEXT, status TEXT,
            created_at TEXT, parsed_at TEXT, error_message TEXT
        );
        CREATE TABLE IF NOT EXISTS document_blocks (
            id TEXT PRIMARY KEY, document_id TEXT, page INTEGER,
            block_type TEXT, text TEXT, html TEXT,
            bbox_json TEXT, metadata_json TEXT
        );
        CREATE TABLE IF NOT EXISTS extracted_fields (
            id TEXT PRIMARY KEY, document_id TEXT, field_key TEXT,
            field_label TEXT, value TEXT, unit TEXT,
            confidence REAL, evidence_block_ids_json TEXT
        );
        CREATE TABLE IF NOT EXISTS rule_results (
            id TEXT PRIMARY KEY, document_id TEXT, rule_id TEXT,
            severity TEXT, status TEXT, message TEXT,
            evidence_block_ids_json TEXT
        );
    """)
    conn.execute(
        "INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?)",
        ("doc-001", "test-report.pdf", "ready", "2026-08-17", "2026-08-17", None),
    )
    conn.execute(
        "INSERT INTO document_blocks VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ("blk-001", "doc-001", 1, "text", "Revenue was $42.5M", None, None, None),
    )
    conn.execute(
        "INSERT INTO document_blocks VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ("blk-002", "doc-001", 2, "text", "Net income $8.2M", None, None, None),
    )
    conn.execute(
        "INSERT INTO extracted_fields VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ("f1", "doc-001", "total_revenue", "Total Revenue", "42500000", "USD", 0.95, '["blk-001"]'),
    )
    conn.execute(
        "INSERT INTO extracted_fields VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ("f2", "doc-001", "net_income", "Net Income", "8200000", "USD", 0.90, '["blk-002"]'),
    )
    conn.execute(
        "INSERT INTO rule_results VALUES (?, ?, ?, ?, ?, ?, ?)",
        ("r1", "doc-001", "revenue_exists", "info", "pass", "Revenue found", '["blk-001"]'),
    )
    conn.execute(
        "INSERT INTO rule_results VALUES (?, ?, ?, ?, ?, ?, ?)",
        ("r2", "doc-001", "balance_sheet_check", "error", "fail", "Mismatch", '["blk-001","blk-002"]'),
    )
    conn.commit()
    conn.close()


_seed_db()


@pytest.mark.asyncio
async def test_lookup_evidence_found():
    from src.tools.lookup_evidence import lookup_evidence

    result = json.loads(await lookup_evidence("doc-001"))
    assert result["document_id"] == "doc-001"
    assert result["count"] == 2


@pytest.mark.asyncio
async def test_lookup_evidence_with_query():
    from src.tools.lookup_evidence import lookup_evidence

    result = json.loads(await lookup_evidence("doc-001", query="Revenue"))
    assert result["count"] == 1


@pytest.mark.asyncio
async def test_lookup_evidence_with_page():
    from src.tools.lookup_evidence import lookup_evidence

    result = json.loads(await lookup_evidence("doc-001", page=2))
    assert result["count"] == 1
    assert result["blocks"][0]["page"] == 2


@pytest.mark.asyncio
async def test_lookup_evidence_not_found():
    from src.tools.lookup_evidence import lookup_evidence

    result = json.loads(await lookup_evidence("nonexistent"))
    assert result["blocks"] == []
    assert "not found" in result["message"]


@pytest.mark.asyncio
async def test_get_extracted_fields_found():
    from src.tools.get_extracted_fields import get_extracted_fields

    result = json.loads(await get_extracted_fields("doc-001"))
    assert result["document_id"] == "doc-001"
    assert len(result["fields"]) == 2


@pytest.mark.asyncio
async def test_get_extracted_fields_filtered():
    from src.tools.get_extracted_fields import get_extracted_fields

    result = json.loads(await get_extracted_fields("doc-001", keys=["total_revenue"]))
    assert len(result["fields"]) == 1
    assert result["fields"][0]["field_key"] == "total_revenue"


@pytest.mark.asyncio
async def test_get_extracted_fields_not_found():
    from src.tools.get_extracted_fields import get_extracted_fields

    result = json.loads(await get_extracted_fields("nonexistent"))
    assert result["fields"] == []


@pytest.mark.asyncio
async def test_check_rules_found():
    from src.tools.check_financial_statement_rules import check_financial_statement_rules

    result = json.loads(await check_financial_statement_rules("doc-001"))
    assert result["document_id"] == "doc-001"
    assert len(result["rule_results"]) == 2
    assert result["summary"]["fail"] == 1
    assert result["summary"]["pass"] == 1


@pytest.mark.asyncio
async def test_check_rules_filtered():
    from src.tools.check_financial_statement_rules import check_financial_statement_rules

    result = json.loads(await check_financial_statement_rules("doc-001", rule_ids=["revenue_exists"]))
    assert len(result["rule_results"]) == 1


@pytest.mark.asyncio
async def test_check_rules_not_found():
    from src.tools.check_financial_statement_rules import check_financial_statement_rules

    result = json.loads(await check_financial_statement_rules("nonexistent"))
    assert result["rule_results"] == []


@pytest.mark.asyncio
async def test_summarize_found():
    from src.tools.summarize_audit_findings import summarize_audit_findings

    result = json.loads(await summarize_audit_findings("doc-001"))
    assert result["document_id"] == "doc-001"
    assert result["summary"]["total_fields"] == 2
    assert result["summary"]["failed"] == 1
    assert len(result["summary"]["failed_rule_messages"]) == 1


@pytest.mark.asyncio
async def test_summarize_not_found():
    from src.tools.summarize_audit_findings import summarize_audit_findings

    result = json.loads(await summarize_audit_findings("nonexistent"))
    assert result["summary"] is None
