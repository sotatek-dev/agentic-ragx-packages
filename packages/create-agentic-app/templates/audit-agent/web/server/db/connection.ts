/**
 * SQLite connection manager using sql.js (pure JS, no native deps).
 * Single shared in-memory or file-backed database.
 */

import initSqlJs, { Database } from "sql.js";
import { SCHEMA_SQL } from "./schema";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  const dbPath = process.env.AUDIT_AGENT_DB_PATH;

  if (dbPath && dbPath !== ":memory:" && dbPath !== "./audit-agent.db") {
    // File-backed mode: load existing DB if present
    const fs = await import("fs");
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      dbInstance = new SQL.Database(buffer);
    } else {
      dbInstance = new SQL.Database();
    }
  } else {
    // In-memory mode (default for dev/tests)
    dbInstance = new SQL.Database();
  }

  // Initialize schema
  dbInstance.run(SCHEMA_SQL);
  return dbInstance;
}

/** Save DB to file (for file-backed mode). */
export async function saveDb(): Promise<void> {
  if (!dbInstance) return;
  const dbPath = process.env.AUDIT_AGENT_DB_PATH;
  if (!dbPath || dbPath === ":memory:" || dbPath === "./audit-agent.db") return;

  const fs = await import("fs");
  const data = dbInstance.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

/** Reset DB instance (for tests). */
export function resetDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
