/**
 * Schema validator for extraction JSON.
 * Validates that extracted fields conform to the expected structure.
 */

import type { ExtractionResult } from "./extraction-provider";

export interface ValidationError {
  path: string;
  message: string;
}

export function validateExtraction(data: unknown): {
  valid: boolean;
  errors: ValidationError[];
  result: ExtractionResult | null;
} {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ path: "root", message: "Expected object" }], result: null };
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.fields)) {
    errors.push({ path: "fields", message: "Expected array" });
    return { valid: false, errors, result: null };
  }

  for (let i = 0; i < obj.fields.length; i++) {
    const field = obj.fields[i];
    const prefix = `fields[${i}]`;

    if (!field || typeof field !== "object") {
      errors.push({ path: prefix, message: "Expected object" });
      continue;
    }

    if (typeof field.field_key !== "string" || !field.field_key) {
      errors.push({ path: `${prefix}.field_key`, message: "Expected non-empty string" });
    }
    if (typeof field.field_label !== "string" || !field.field_label) {
      errors.push({ path: `${prefix}.field_label`, message: "Expected non-empty string" });
    }
    if (field.value !== undefined && field.value !== null && typeof field.value !== "string") {
      errors.push({ path: `${prefix}.value`, message: "Expected string or null" });
    }
    if (field.confidence !== undefined && (typeof field.confidence !== "number" || field.confidence < 0 || field.confidence > 1)) {
      errors.push({ path: `${prefix}.confidence`, message: "Expected number 0-1" });
    }
    if (field.evidence_block_ids !== undefined && !Array.isArray(field.evidence_block_ids)) {
      errors.push({ path: `${prefix}.evidence_block_ids`, message: "Expected array" });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, result: null };
  }

  return { valid: true, errors: [], result: data as ExtractionResult };
}
