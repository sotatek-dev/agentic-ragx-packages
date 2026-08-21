/**
 * Tests for the deterministic audit rules engine.
 */

import { describe, it, expect } from "vitest";
import { runAuditRules } from "../server/rules/audit-rules";
import type { FieldRow, BlockRow } from "../server/db/repository";

describe("runAuditRules", () => {
  const makeField = (overrides: Partial<FieldRow>): FieldRow => ({
    id: "f1",
    document_id: "doc-1",
    field_key: "x",
    field_label: "X",
    value: null,
    unit: null,
    confidence: null,
    evidence_block_ids_json: null,
    ...overrides,
  });

  const makeBlock = (overrides: Partial<BlockRow>): BlockRow => ({
    id: "b1",
    document_id: "doc-1",
    page: 1,
    block_type: "text",
    text: "content",
    html: null,
    bbox_json: null,
    metadata_json: null,
    ...overrides,
  });

  it("flags empty document", () => {
    const results = runAuditRules({ fields: [], blocks: [] });
    const docRule = results.find((r) => r.rule_id === "document_not_empty");
    expect(docRule!.status).toBe("fail");
  });

  it("passes when document has text blocks", () => {
    const results = runAuditRules({
      fields: [],
      blocks: [makeBlock({ text: "Some content" })],
    });
    const docRule = results.find((r) => r.rule_id === "document_not_empty");
    expect(docRule!.status).toBe("pass");
  });

  it("warns when revenue field missing", () => {
    const results = runAuditRules({
      fields: [makeField({ field_key: "other", field_label: "Other" })],
      blocks: [makeBlock({})],
    });
    const rule = results.find((r) => r.rule_id === "revenue_exists");
    expect(rule!.status).toBe("warning");
  });

  it("passes when revenue field present", () => {
    const results = runAuditRules({
      fields: [
        makeField({ field_key: "total_revenue", field_label: "Revenue", value: "1000" }),
      ],
      blocks: [makeBlock({})],
    });
    const rule = results.find((r) => r.rule_id === "revenue_exists");
    expect(rule!.status).toBe("pass");
  });

  it("passes balance sheet when balanced", () => {
    const results = runAuditRules({
      fields: [
        makeField({ field_key: "total_assets", value: "1000" }),
        makeField({ field_key: "total_liabilities", value: "600" }),
        makeField({ field_key: "equity", value: "400" }),
      ],
      blocks: [makeBlock({})],
    });
    const rule = results.find((r) => r.rule_id === "balance_sheet_check");
    expect(rule!.status).toBe("pass");
  });

  it("fails balance sheet when mismatched", () => {
    const results = runAuditRules({
      fields: [
        makeField({ field_key: "total_assets", value: "1000" }),
        makeField({ field_key: "total_liabilities", value: "600" }),
        makeField({ field_key: "equity", value: "200" }),
      ],
      blocks: [makeBlock({})],
    });
    const rule = results.find((r) => r.rule_id === "balance_sheet_check");
    expect(rule!.status).toBe("fail");
  });

  it("warns on low confidence fields", () => {
    const results = runAuditRules({
      fields: [
        makeField({ field_key: "x", confidence: 0.5 }),
      ],
      blocks: [makeBlock({})],
    });
    const rule = results.find((r) => r.rule_id === "extraction_confidence");
    expect(rule!.status).toBe("warning");
  });

  it("passes when all fields have high confidence", () => {
    const results = runAuditRules({
      fields: [
        makeField({ field_key: "total_revenue", value: "100", confidence: 0.9 }),
        makeField({ field_key: "net_income", value: "50", confidence: 0.95 }),
      ],
      blocks: [makeBlock({})],
    });
    const rule = results.find((r) => r.rule_id === "extraction_confidence");
    expect(rule!.status).toBe("pass");
  });
});
