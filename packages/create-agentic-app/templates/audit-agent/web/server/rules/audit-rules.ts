/**
 * Deterministic audit rules engine.
 * Runs over extracted fields and document blocks to produce rule results.
 */

import type { FieldRow, BlockRow } from "../db/repository";

export interface RuleResult {
  rule_id: string;
  severity: "info" | "warning" | "error";
  status: "pass" | "fail" | "warning" | "error";
  message: string;
  evidence_block_ids: string[];
}

interface RuleContext {
  fields: FieldRow[];
  blocks: BlockRow[];
}

type RuleFn = (ctx: RuleContext) => RuleResult | null;

/** Total revenue field must exist. */
const revenueExists: RuleFn = (ctx) => {
  const revenue = ctx.fields.find((f) => f.field_key === "total_revenue");
  if (!revenue) {
    return {
      rule_id: "revenue_exists",
      severity: "warning",
      status: "warning",
      message: "Total revenue field not found in document.",
      evidence_block_ids: [],
    };
  }
  return {
    rule_id: "revenue_exists",
    severity: "info",
    status: "pass",
    message: `Total revenue found: ${revenue.value} ${revenue.unit || ""}`.trim(),
    evidence_block_ids: revenue.evidence_block_ids_json
      ? JSON.parse(revenue.evidence_block_ids_json)
      : [],
  };
};

/** Net income field must exist. */
const netIncomeExists: RuleFn = (ctx) => {
  const field = ctx.fields.find((f) => f.field_key === "net_income");
  if (!field) {
    return {
      rule_id: "net_income_exists",
      severity: "warning",
      status: "warning",
      message: "Net income field not found in document.",
      evidence_block_ids: [],
    };
  }
  return {
    rule_id: "net_income_exists",
    severity: "info",
    status: "pass",
    message: `Net income found: ${field.value} ${field.unit || ""}`.trim(),
    evidence_block_ids: field.evidence_block_ids_json
      ? JSON.parse(field.evidence_block_ids_json)
      : [],
  };
};

/** Assets = Liabilities + Equity (basic balance sheet check). */
const balanceSheetCheck: RuleFn = (ctx) => {
  const assets = ctx.fields.find((f) => f.field_key === "total_assets");
  const liabilities = ctx.fields.find((f) => f.field_key === "total_liabilities");
  const equity = ctx.fields.find((f) => f.field_key === "equity");

  if (!assets || !liabilities || !equity) {
    return {
      rule_id: "balance_sheet_check",
      severity: "info",
      status: "pass",
      message: "Balance sheet check skipped: missing required fields (assets/liabilities/equity).",
      evidence_block_ids: [],
    };
  }

  const assetsVal = parseFloat(assets.value || "0");
  const liabVal = parseFloat(liabilities.value || "0");
  const eqVal = parseFloat(equity.value || "0");

  if (isNaN(assetsVal) || isNaN(liabVal) || isNaN(eqVal)) {
    return {
      rule_id: "balance_sheet_check",
      severity: "warning",
      status: "warning",
      message: "Balance sheet check skipped: non-numeric field values.",
      evidence_block_ids: [],
    };
  }

  const expected = liabVal + eqVal;
  const variance = Math.abs(assetsVal - expected);
  const threshold = assetsVal * 0.01; // 1% tolerance

  if (variance > threshold) {
    return {
      rule_id: "balance_sheet_check",
      severity: "error",
      status: "fail",
      message: `Balance sheet mismatch: Assets (${assetsVal}) ≠ Liabilities (${liabVal}) + Equity (${eqVal}). Variance: ${variance.toFixed(2)}`,
      evidence_block_ids: [
        ...(assets.evidence_block_ids_json ? JSON.parse(assets.evidence_block_ids_json) : []),
        ...(liabilities.evidence_block_ids_json ? JSON.parse(liabilities.evidence_block_ids_json) : []),
        ...(equity.evidence_block_ids_json ? JSON.parse(equity.evidence_block_ids_json) : []),
      ],
    };
  }

  return {
    rule_id: "balance_sheet_check",
    severity: "info",
    status: "pass",
    message: "Balance sheet is balanced within 1% tolerance.",
    evidence_block_ids: [],
  };
};

/** High-confidence extraction check. */
const extractionConfidence: RuleFn = (ctx) => {
  const lowConfidenceFields = ctx.fields.filter(
    (f) => f.confidence !== null && f.confidence < 0.7,
  );

  if (lowConfidenceFields.length > 0) {
    return {
      rule_id: "extraction_confidence",
      severity: "warning",
      status: "warning",
      message: `${lowConfidenceFields.length} field(s) have low extraction confidence (<0.7): ${lowConfidenceFields.map((f) => f.field_key).join(", ")}`,
      evidence_block_ids: lowConfidenceFields.flatMap((f) =>
        f.evidence_block_ids_json ? JSON.parse(f.evidence_block_ids_json) : [],
      ),
    };
  }

  return {
    rule_id: "extraction_confidence",
    severity: "info",
    status: "pass",
    message: "All extracted fields have acceptable confidence.",
    evidence_block_ids: [],
  };
};

/** Check that document has text blocks (not empty). */
const documentNotEmpty: RuleFn = (ctx) => {
  const textBlocks = ctx.blocks.filter((b) => b.text && b.text.trim().length > 0);
  if (textBlocks.length === 0) {
    return {
      rule_id: "document_not_empty",
      severity: "error",
      status: "fail",
      message: "Document contains no text blocks after parsing.",
      evidence_block_ids: [],
    };
  }
  return {
    rule_id: "document_not_empty",
    severity: "info",
    status: "pass",
    message: `Document has ${textBlocks.length} text block(s).`,
    evidence_block_ids: [],
  };
};

const ALL_RULES: RuleFn[] = [
  documentNotEmpty,
  revenueExists,
  netIncomeExists,
  balanceSheetCheck,
  extractionConfidence,
];

export function runAuditRules(ctx: RuleContext): RuleResult[] {
  return ALL_RULES.map((rule) => rule(ctx)).filter(Boolean) as RuleResult[];
}
