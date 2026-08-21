/**
 * Tests for the document repository layer.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createDocument,
  getDocument,
  listDocuments,
  updateDocumentStatus,
  insertBlocks,
  getBlocks,
  insertFields,
  getFields,
  insertRuleResults,
  getRuleResults,
  getWorkspacePayload,
} from "../server/db/repository";
import { resetDb } from "../server/db/connection";

describe("document repository", () => {
  beforeEach(() => {
    resetDb();
  });

  it("creates and retrieves a document", async () => {
    const doc = await createDocument("test.pdf", "pending");
    expect(doc.id).toBeTruthy();
    expect(doc.filename).toBe("test.pdf");
    expect(doc.status).toBe("pending");

    const retrieved = await getDocument(doc.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.filename).toBe("test.pdf");
  });

  it("lists documents ordered by created_at desc", async () => {
    await createDocument("a.pdf");
    await createDocument("b.pdf");
    const docs = await listDocuments();
    expect(docs.length).toBe(2);
  });

  it("updates document status", async () => {
    const doc = await createDocument("test.pdf", "processing");
    await updateDocumentStatus(doc.id, "ready");
    const updated = await getDocument(doc.id);
    expect(updated!.status).toBe("ready");
    expect(updated!.parsed_at).toBeTruthy();
  });

  it("updates document status with error", async () => {
    const doc = await createDocument("test.pdf", "processing");
    await updateDocumentStatus(doc.id, "parse_failed", "Core unavailable");
    const updated = await getDocument(doc.id);
    expect(updated!.status).toBe("parse_failed");
    expect(updated!.error_message).toBe("Core unavailable");
  });

  it("inserts and retrieves blocks", async () => {
    const doc = await createDocument("test.pdf");
    await insertBlocks(doc.id, [
      { page: 1, block_type: "text", text: "Hello world" },
      { page: 1, block_type: "table", text: "| A | B |", html: "<table>" },
    ]);
    const blocks = await getBlocks(doc.id);
    expect(blocks.length).toBe(2);
    expect(blocks[0].text).toBe("Hello world");
    expect(blocks[1].html).toBe("<table>");
  });

  it("inserts and retrieves fields", async () => {
    const doc = await createDocument("test.pdf");
    await insertFields(doc.id, [
      {
        field_key: "revenue",
        field_label: "Total Revenue",
        value: "1000000",
        unit: "USD",
        confidence: 0.95,
        evidence_block_ids: ["blk-1"],
      },
    ]);
    const fields = await getFields(doc.id);
    expect(fields.length).toBe(1);
    expect(fields[0].field_key).toBe("revenue");
    expect(fields[0].confidence).toBe(0.95);
  });

  it("inserts and retrieves rule results", async () => {
    const doc = await createDocument("test.pdf");
    await insertRuleResults(doc.id, [
      {
        rule_id: "balance_check",
        severity: "error",
        status: "fail",
        message: "Mismatch",
      },
    ]);
    const rules = await getRuleResults(doc.id);
    expect(rules.length).toBe(1);
    expect(rules[0].status).toBe("fail");
  });

  it("returns workspace payload with all data", async () => {
    const doc = await createDocument("test.pdf", "ready");
    await insertBlocks(doc.id, [{ page: 1, block_type: "text", text: "Content" }]);
    await insertFields(doc.id, [{ field_key: "x", field_label: "X", value: "1" }]);
    await insertRuleResults(doc.id, [{ rule_id: "r1", status: "pass" }]);

    const payload = await getWorkspacePayload(doc.id);
    expect(payload).toBeTruthy();
    expect(payload!.document.id).toBe(doc.id);
    expect(payload!.blocks.length).toBe(1);
    expect(payload!.fields.length).toBe(1);
    expect(payload!.rule_results.length).toBe(1);
  });

  it("returns null for nonexistent document", async () => {
    const payload = await getWorkspacePayload("nonexistent");
    expect(payload).toBeNull();
  });
});
