"""Sample finance document data for the MCP server."""

SAMPLE_DOCUMENTS = {
    "doc-001": {
        "document_id": "doc-001",
        "filename": "sample-audit-report.pdf",
        "fields": {
            "company_name": "Acme Corp",
            "fiscal_year": "2025",
            "total_revenue": "$42.5M",
            "net_income": "$8.2M",
            "audit_opinion": "Unqualified",
            "auditor": "Deloitte LLP",
            "report_date": "2025-03-15",
        },
        "blocks": [
            {
                "block_id": "blk-001",
                "page": 1,
                "type": "text",
                "content": "Acme Corp reported total revenue of $42.5M for fiscal year 2025, representing a 12% increase from the prior year.",
            },
            {
                "block_id": "blk-002",
                "page": 1,
                "type": "table",
                "content": (
                    "| Metric | FY2025 | FY2024 | Change |\n"
                    "|--------|--------|--------|--------|\n"
                    "| Revenue | $42.5M | $37.9M | +12% |\n"
                    "| Net Income | $8.2M | $6.1M | +34% |\n"
                    "| EBITDA | $12.8M | $10.2M | +26% |"
                ),
            },
            {
                "block_id": "blk-003",
                "page": 2,
                "type": "text",
                "content": "The audit committee reviewed internal controls and found no material weaknesses. One significant deficiency was noted in inventory management.",
            },
            {
                "block_id": "blk-004",
                "page": 3,
                "type": "text",
                "content": "Going concern: The auditor has issued an unqualified opinion with no going concern emphasis.",
            },
        ],
        "rule_results": [
            {
                "rule_id": "rule-001",
                "name": "Revenue Consistency Check",
                "status": "pass",
                "detail": "Revenue figures are consistent across financial statements.",
            },
            {
                "rule_id": "rule-002",
                "name": "Debt-to-Equity Ratio",
                "status": "pass",
                "detail": "Debt-to-equity ratio of 0.45 is within acceptable range.",
            },
            {
                "rule_id": "rule-003",
                "name": "Inventory Turnover",
                "status": "fail",
                "detail": "Inventory turnover decreased from 6.2 to 4.8, below the 5.0 threshold.",
            },
            {
                "rule_id": "rule-004",
                "name": "Related Party Transactions",
                "status": "pass",
                "detail": "No undisclosed related party transactions found.",
            },
            {
                "rule_id": "rule-005",
                "name": "Revenue Recognition Policy",
                "status": "warning",
                "detail": "Revenue recognition policy changed in Q3. Impact: +$1.2M one-time adjustment.",
            },
        ],
    }
}
