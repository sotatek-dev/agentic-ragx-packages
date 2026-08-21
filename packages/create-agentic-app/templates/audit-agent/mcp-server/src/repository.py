"""Read-only repository for Audit Agent SQLite database."""

import json
import os
import sqlite3
from pathlib import Path


def _get_db_path() -> str:
    return os.environ.get("AUDIT_AGENT_DB_PATH", "./audit-agent.db")


def _get_connection() -> sqlite3.Connection:
    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def get_document(document_id: str) -> dict | None:
    """Get a document by ID."""
    conn = _get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM documents WHERE id = ?", (document_id,)
        ).fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        conn.close()


def get_blocks(document_id: str, page: int | None = None) -> list[dict] | None:
    """Get document blocks, optionally filtered by page."""
    conn = _get_connection()
    try:
        # Check document exists
        doc = conn.execute(
            "SELECT id FROM documents WHERE id = ?", (document_id,)
        ).fetchone()
        if doc is None:
            return None

        if page is not None:
            rows = conn.execute(
                "SELECT * FROM document_blocks WHERE document_id = ? AND page = ? ORDER BY rowid",
                (document_id, page),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM document_blocks WHERE document_id = ? ORDER BY page, rowid",
                (document_id,),
            ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_fields(document_id: str, keys: list[str] | None = None) -> dict | None:
    """Get extracted fields for a document, optionally filtered by field keys."""
    conn = _get_connection()
    try:
        doc = conn.execute(
            "SELECT id, filename FROM documents WHERE id = ?", (document_id,)
        ).fetchone()
        if doc is None:
            return None

        rows = conn.execute(
            "SELECT * FROM extracted_fields WHERE document_id = ?",
            (document_id,),
        ).fetchall()

        fields = [dict(r) for r in rows]
        if keys:
            fields = [f for f in fields if f["field_key"] in keys]

        return {
            "document_id": doc["id"],
            "filename": doc["filename"],
            "fields": fields,
        }
    finally:
        conn.close()


def get_rule_results(
    document_id: str, rule_ids: list[str] | None = None
) -> list[dict] | None:
    """Get rule results for a document, optionally filtered by rule IDs."""
    conn = _get_connection()
    try:
        doc = conn.execute(
            "SELECT id FROM documents WHERE id = ?", (document_id,)
        ).fetchone()
        if doc is None:
            return None

        rows = conn.execute(
            "SELECT * FROM rule_results WHERE document_id = ?",
            (document_id,),
        ).fetchall()

        results = [dict(r) for r in rows]
        if rule_ids:
            results = [r for r in results if r["rule_id"] in rule_ids]

        return results
    finally:
        conn.close()


def search_blocks(document_id: str, query: str | None = None, page: int | None = None) -> list[dict] | None:
    """Search blocks by text content, optionally filtered by page."""
    conn = _get_connection()
    try:
        doc = conn.execute(
            "SELECT id FROM documents WHERE id = ?", (document_id,)
        ).fetchone()
        if doc is None:
            return None

        sql = "SELECT * FROM document_blocks WHERE document_id = ?"
        params: list = [document_id]

        if page is not None:
            sql += " AND page = ?"
            params.append(page)

        if query:
            sql += " AND text LIKE ?"
            params.append(f"%{query}%")

        sql += " ORDER BY page, rowid"
        rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
