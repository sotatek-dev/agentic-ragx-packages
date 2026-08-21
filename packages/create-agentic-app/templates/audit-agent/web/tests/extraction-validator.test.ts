/**
 * Tests for extraction schema validator.
 */

import { describe, it, expect } from "vitest";
import { validateExtraction } from "../server/extraction/validate-extraction";

describe("validateExtraction", () => {
  it("validates correct extraction result", () => {
    const data = {
      fields: [
        {
          field_key: "revenue",
          field_label: "Total Revenue",
          value: "1000000",
          unit: "USD",
          confidence: 0.95,
          evidence_block_ids: ["blk-1"],
        },
      ],
    };
    const result = validateExtraction(data);
    expect(result.valid).toBe(true);
    expect(result.result!.fields.length).toBe(1);
  });

  it("rejects non-object input", () => {
    const result = validateExtraction(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toBe("Expected object");
  });

  it("rejects missing fields array", () => {
    const result = validateExtraction({ not_fields: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toBe("fields");
  });

  it("rejects field with missing field_key", () => {
    const data = {
      fields: [{ field_label: "X", value: "1" }],
    };
    const result = validateExtraction(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("field_key"))).toBe(true);
  });

  it("rejects field with invalid confidence", () => {
    const data = {
      fields: [
        {
          field_key: "x",
          field_label: "X",
          confidence: 1.5,
        },
      ],
    };
    const result = validateExtraction(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("confidence"))).toBe(true);
  });

  it("accepts field without optional fields", () => {
    const data = {
      fields: [
        { field_key: "x", field_label: "X" },
      ],
    };
    const result = validateExtraction(data);
    expect(result.valid).toBe(true);
  });

  it("rejects non-array evidence_block_ids", () => {
    const data = {
      fields: [
        {
          field_key: "x",
          field_label: "X",
          evidence_block_ids: "not-array",
        },
      ],
    };
    const result = validateExtraction(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("evidence_block_ids"))).toBe(true);
  });
});
