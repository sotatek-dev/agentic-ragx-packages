"""Tests for MCP tool functions."""

import json

import pytest


@pytest.mark.asyncio
async def test_get_fields_found():
    from src.tools.get_fields import get_fields

    result = json.loads(await get_fields("doc-001"))
    assert result["document_id"] == "doc-001"
    assert "fields" in result
    assert result["fields"]["company_name"] == "Acme Corp"


@pytest.mark.asyncio
async def test_get_fields_not_found():
    from src.tools.get_fields import get_fields

    result = json.loads(await get_fields("nonexistent"))
    assert "error" in result


@pytest.mark.asyncio
async def test_get_blocks_found():
    from src.tools.get_blocks import get_blocks

    result = json.loads(await get_blocks("doc-001"))
    assert len(result) > 0
    assert all("block_id" in b for b in result)


@pytest.mark.asyncio
async def test_get_blocks_page_filter():
    from src.tools.get_blocks import get_blocks

    result = json.loads(await get_blocks("doc-001", page=1))
    assert all(b["page"] == 1 for b in result)


@pytest.mark.asyncio
async def test_get_blocks_not_found():
    from src.tools.get_blocks import get_blocks

    result = json.loads(await get_blocks("nonexistent"))
    assert "error" in result


@pytest.mark.asyncio
async def test_get_rule_results_found():
    from src.tools.get_rule_results import get_rule_results

    result = json.loads(await get_rule_results("doc-001"))
    assert len(result) > 0
    assert any(r["status"] == "fail" for r in result)


@pytest.mark.asyncio
async def test_get_rule_results_not_found():
    from src.tools.get_rule_results import get_rule_results

    result = json.loads(await get_rule_results("nonexistent"))
    assert "error" in result
