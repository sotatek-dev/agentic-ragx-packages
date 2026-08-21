/**
 * POST /api/documents/upload
 *
 * Upload a document, parse via Core SDK, extract fields, run rules.
 * Returns full workspace payload.
 */

import { NextRequest, NextResponse } from "next/server";
import { AgenticHttpError } from "@sotatek-dev/agentic-core-sdk";
import { getCoreClient } from "@/server/core-client/client";
import {
  createDocument,
  insertBlocks,
  insertFields,
  insertRuleResults,
  updateDocumentStatus,
  getWorkspacePayload,
} from "@/server/db/repository";
import { validateExtraction } from "@/server/extraction/validate-extraction";
import { LlmExtractionProvider } from "@/server/extraction/llm-extraction-provider";
import { runAuditRules } from "@/server/rules/audit-rules";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/tiff",
  "text/plain",
  "text/csv",
];

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ detail: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ detail: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { detail: "File too large (max 50MB)" },
      { status: 413 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { detail: `Unsupported file type: ${file.type}` },
      { status: 415 },
    );
  }

  // Create document record
  const document = await createDocument(file.name, "processing");

  try {
    // Parse via Core SDK
    const client = getCoreClient();
    const parseResult = await client.documents.parse(file, {
      filename: file.name,
      mode: "auto",
    });

    // Store parsed blocks
    const blocks = (parseResult as any).blocks || (parseResult as any).pages?.flatMap((p: any) => p.blocks) || [];
    const blockRows = blocks.map((b: any) => ({
      page: b.page || 1,
      block_type: b.type || b.block_type || "text",
      text: b.text || b.content || null,
      html: b.html || null,
      bbox: b.bbox || null,
      metadata: b.metadata || null,
    }));
    await insertBlocks(document.id, blockRows);

    // Run extraction
    const { LlmExtractionProvider } = await import(
      "@/server/extraction/llm-extraction-provider"
    );
    const extractor = new LlmExtractionProvider();
    const storedBlocks = (
      await import("@/server/db/repository")
    ).getBlocks;

    const blockData = await storedBlocks(document.id);
    let extractionResult;

    try {
      extractionResult = await extractor.extract({
        documentId: document.id,
        filename: file.name,
        blocks: blockData.map((b) => ({
          id: b.id,
          page: b.page,
          block_type: b.block_type,
          text: b.text,
        })),
      });
    } catch (err) {
      // Extraction failed — mark needs_review but keep parsed blocks
      await updateDocumentStatus(
        document.id,
        "needs_review",
        `Extraction failed: ${err instanceof Error ? err.message : "unknown error"}`,
      );
      const payload = await getWorkspacePayload(document.id);
      return NextResponse.json(payload, { status: 200 });
    }

    // Validate extraction
    const validation = validateExtraction(extractionResult);
    if (!validation.valid) {
      await updateDocumentStatus(
        document.id,
        "needs_review",
        `Extraction validation failed: ${validation.errors.map((e) => e.message).join(", ")}`,
      );
      const payload = await getWorkspacePayload(document.id);
      return NextResponse.json(payload, { status: 200 });
    }

    // Store fields
    const fields = validation.result!.fields.map((f) => ({
      field_key: f.field_key,
      field_label: f.field_label,
      value: f.value,
      unit: f.unit,
      confidence: f.confidence,
      evidence_block_ids: f.evidence_block_ids,
    }));
    await insertFields(document.id, fields);

    // Run rules
    const allFields = (await import("@/server/db/repository")).getFields;
    const fieldData = await allFields(document.id);
    const ruleResults = runAuditRules({ fields: fieldData, blocks: blockData });
    await insertRuleResults(
      document.id,
      ruleResults.map((r) => ({
        rule_id: r.rule_id,
        severity: r.severity,
        status: r.status,
        message: r.message,
        evidence_block_ids: r.evidence_block_ids,
      })),
    );

    // Mark ready
    const hasErrors = ruleResults.some((r) => r.status === "fail");
    await updateDocumentStatus(
      document.id,
      hasErrors ? "needs_review" : "ready",
    );

    const payload = await getWorkspacePayload(document.id);
    return NextResponse.json(payload, { status: 201 });
  } catch (err) {
    if (err instanceof AgenticHttpError) {
      const statusMap: Record<number, { status: string; msg: string }> = {
        401: { status: "auth_error", msg: "Core API authentication failed" },
        403: { status: "auth_error", msg: "Core API access denied" },
        415: { status: "unsupported", msg: "Unsupported file type for Core parser" },
        502: { status: "parse_failed", msg: "Core parser unavailable" },
        504: { status: "parse_failed", msg: "Core parser timeout" },
      };
      const mapped = statusMap[err.statusCode];
      if (mapped) {
        await updateDocumentStatus(document.id, mapped.status, mapped.msg);
        const payload = await getWorkspacePayload(document.id);
        return NextResponse.json(payload, { status: 200 });
      }
    }

    await updateDocumentStatus(
      document.id,
      "parse_failed",
      err instanceof Error ? err.message : "Unknown error",
    );
    const payload = await getWorkspacePayload(document.id);
    return NextResponse.json(payload, { status: 200 });
  }
}
