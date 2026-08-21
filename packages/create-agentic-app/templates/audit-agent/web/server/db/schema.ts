/**
 * SQLite schema for the Audit Agent app.
 * Tables: documents, document_blocks, extracted_fields, rule_results.
 */

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  parsed_at TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS document_blocks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  page INTEGER NOT NULL,
  block_type TEXT NOT NULL,
  text TEXT,
  html TEXT,
  bbox_json TEXT,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS extracted_fields (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  value TEXT,
  unit TEXT,
  confidence REAL,
  evidence_block_ids_json TEXT
);

CREATE TABLE IF NOT EXISTS rule_results (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  rule_id TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  status TEXT NOT NULL DEFAULT 'pass',
  message TEXT,
  evidence_block_ids_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_blocks_document ON document_blocks(document_id);
CREATE INDEX IF NOT EXISTS idx_fields_document ON extracted_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_rules_document ON rule_results(document_id);
`;
