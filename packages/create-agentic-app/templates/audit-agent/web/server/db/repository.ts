/**
 * Repository layer for Audit Agent SQLite operations.
 * Provides CRUD for documents, blocks, fields, and rule results.
 */

import { getDb } from "./connection";
import { randomUUID } from "crypto";

// --- Document ---

export interface DocumentRow {
  id: string;
  filename: string;
  status: string;
  created_at: string;
  parsed_at: string | null;
  error_message: string | null;
}

export async function createDocument(
  filename: string,
  status = "pending",
): Promise<DocumentRow> {
  const db = await getDb();
  const id = randomUUID();
  db.run(
    `INSERT INTO documents (id, filename, status) VALUES (?, ?, ?)`,
    [id, filename, status],
  );
  const doc = await getDocument(id);
  if (!doc) throw new Error("Failed to retrieve created document");
  return doc;
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const db = await getDb();
  const stmt = db.prepare(`SELECT * FROM documents WHERE id = ?`);
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as DocumentRow;
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export async function listDocuments(): Promise<DocumentRow[]> {
  const db = await getDb();
  const results: DocumentRow[] = [];
  const stmt = db.prepare(`SELECT * FROM documents ORDER BY created_at DESC`);
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as DocumentRow);
  }
  stmt.free();
  return results;
}

export async function updateDocumentStatus(
  id: string,
  status: string,
  errorMessage?: string,
): Promise<void> {
  const db = await getDb();
  if (status === "ready" || status === "needs_review") {
    db.run(
      `UPDATE documents SET status = ?, parsed_at = datetime('now'), error_message = ? WHERE id = ?`,
      [status, errorMessage ?? null, id],
    );
  } else {
    db.run(
      `UPDATE documents SET status = ?, error_message = ? WHERE id = ?`,
      [status, errorMessage ?? null, id],
    );
  }
}

// --- Document Blocks ---

export interface BlockRow {
  id: string;
  document_id: string;
  page: number;
  block_type: string;
  text: string | null;
  html: string | null;
  bbox_json: string | null;
  metadata_json: string | null;
}

export async function insertBlocks(
  documentId: string,
  blocks: Array<{
    page: number;
    block_type: string;
    text?: string;
    html?: string;
    bbox?: unknown;
    metadata?: unknown;
  }>,
): Promise<void> {
  const db = await getDb();
  for (const block of blocks) {
    db.run(
      `INSERT INTO document_blocks (id, document_id, page, block_type, text, html, bbox_json, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        documentId,
        block.page,
        block.block_type,
        block.text ?? null,
        block.html ?? null,
        block.bbox ? JSON.stringify(block.bbox) : null,
        block.metadata ? JSON.stringify(block.metadata) : null,
      ],
    );
  }
}

export async function getBlocks(documentId: string): Promise<BlockRow[]> {
  const db = await getDb();
  const results: BlockRow[] = [];
  const stmt = db.prepare(
    `SELECT * FROM document_blocks WHERE document_id = ? ORDER BY page, rowid`,
  );
  stmt.bind([documentId]);
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as BlockRow);
  }
  stmt.free();
  return results;
}

export async function getBlock(blockId: string): Promise<BlockRow | null> {
  const db = await getDb();
  const stmt = db.prepare(`SELECT * FROM document_blocks WHERE id = ?`);
  stmt.bind([blockId]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as BlockRow;
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// --- Extracted Fields ---

export interface FieldRow {
  id: string;
  document_id: string;
  field_key: string;
  field_label: string;
  value: string | null;
  unit: string | null;
  confidence: number | null;
  evidence_block_ids_json: string | null;
}

export async function insertFields(
  documentId: string,
  fields: Array<{
    field_key: string;
    field_label: string;
    value?: string;
    unit?: string;
    confidence?: number;
    evidence_block_ids?: string[];
  }>,
): Promise<void> {
  const db = await getDb();
  for (const field of fields) {
    db.run(
      `INSERT INTO extracted_fields (id, document_id, field_key, field_label, value, unit, confidence, evidence_block_ids_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        documentId,
        field.field_key,
        field.field_label,
        field.value ?? null,
        field.unit ?? null,
        field.confidence ?? null,
        field.evidence_block_ids
          ? JSON.stringify(field.evidence_block_ids)
          : null,
      ],
    );
  }
}

export async function getFields(documentId: string): Promise<FieldRow[]> {
  const db = await getDb();
  const results: FieldRow[] = [];
  const stmt = db.prepare(
    `SELECT * FROM extracted_fields WHERE document_id = ?`,
  );
  stmt.bind([documentId]);
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as FieldRow);
  }
  stmt.free();
  return results;
}

// --- Rule Results ---

export interface RuleResultRow {
  id: string;
  document_id: string;
  rule_id: string;
  severity: string;
  status: string;
  message: string | null;
  evidence_block_ids_json: string | null;
}

export async function insertRuleResults(
  documentId: string,
  results: Array<{
    rule_id: string;
    severity?: string;
    status: string;
    message?: string;
    evidence_block_ids?: string[];
  }>,
): Promise<void> {
  const db = await getDb();
  for (const rule of results) {
    db.run(
      `INSERT INTO rule_results (id, document_id, rule_id, severity, status, message, evidence_block_ids_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        documentId,
        rule.rule_id,
        rule.severity ?? "info",
        rule.status,
        rule.message ?? null,
        rule.evidence_block_ids
          ? JSON.stringify(rule.evidence_block_ids)
          : null,
      ],
    );
  }
}

export async function getRuleResults(
  documentId: string,
): Promise<RuleResultRow[]> {
  const db = await getDb();
  const results: RuleResultRow[] = [];
  const stmt = db.prepare(
    `SELECT * FROM rule_results WHERE document_id = ?`,
  );
  stmt.bind([documentId]);
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as RuleResultRow);
  }
  stmt.free();
  return results;
}

// --- Workspace Payload ---

export interface WorkspacePayload {
  document: DocumentRow;
  blocks: BlockRow[];
  fields: FieldRow[];
  rule_results: RuleResultRow[];
}

export async function getWorkspacePayload(
  documentId: string,
): Promise<WorkspacePayload | null> {
  const document = await getDocument(documentId);
  if (!document) return null;

  return {
    document,
    blocks: await getBlocks(documentId),
    fields: await getFields(documentId),
    rule_results: await getRuleResults(documentId),
  };
}
