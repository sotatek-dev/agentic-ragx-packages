/**
 * LLM-backed extraction provider. Uses AUDIT_LLM_API_KEY and AUDIT_LLM_MODEL
 * to extract structured fields from parsed document blocks.
 */

import type { ExtractionProvider, ExtractionResult } from "./extraction-provider";

const EXTRACTION_PROMPT = `You are a financial document extraction assistant.
Given the text blocks from a financial document, extract the following fields:
- company_name: The company or entity name
- fiscal_year: The fiscal year or reporting period
- total_revenue: Total revenue/sales figure
- net_income: Net income/profit
- total_assets: Total assets
- total_liabilities: Total liabilities
- equity: Shareholders' equity
- audit_opinion: Audit opinion if present
- auditor: Auditor name if present

Return a JSON object with a "fields" array. Each field has:
- field_key: snake_case identifier
- field_label: human-readable label
- value: the extracted value as string
- unit: currency or unit if applicable
- confidence: 0.0-1.0 confidence score
- evidence_block_ids: array of block IDs that contain evidence for this field

Only extract fields that are clearly present in the document. If a field cannot be found, omit it.
Return ONLY valid JSON, no markdown fences.`;

export class LlmExtractionProvider implements ExtractionProvider {
  async extract(params: {
    documentId: string;
    filename: string;
    blocks: Array<{ id: string; page: number; block_type: string; text: string | null }>;
  }): Promise<ExtractionResult> {
    const apiKey = process.env.AUDIT_LLM_API_KEY;
    const model = process.env.AUDIT_LLM_MODEL || "gpt-4o";

    if (!apiKey) {
      throw new Error("AUDIT_LLM_API_KEY must be set for LLM extraction");
    }

    // Build block text for the prompt
    const blockTexts = params.blocks
      .filter((b) => b.text)
      .map((b) => `[Block: ${b.id}, page ${b.page}] ${b.text}`)
      .join("\n\n");

    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          {
            role: "user",
            content: `Document: ${params.filename}\n\nBlocks:\n${blockTexts}`,
          },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM extraction failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("LLM returned empty response");
    }

    try {
      const parsed = JSON.parse(content);
      return { fields: parsed.fields || [] };
    } catch {
      throw new Error("LLM returned invalid JSON");
    }
  }
}
