import { describe, it, expect } from "vitest";
import {
  mapKbPreviewToEvidenceDocument,
  mapKbBlock,
} from "../src/evidence/evidence-adapters.js";
import type { KbPreviewDataInput } from "../src/index.js";

const SAMPLE_PREVIEW: KbPreviewDataInput = {
  url: "https://example.com/preview.pdf",
  filename: "report.pdf",
  size: 1024,
  status: "ready",
  chunk_count: 5,
  created_at: "2026-08-11T00:00:00Z",
  blocks: [
    {
      id: "b1",
      type: "Section",
      page: 1,
      page_index: 0,
      section: "Introduction",
      text: "Hello world",
      normalized_text: "Hello world normalized",
      raw_html: "<p>Hello world</p>",
      bbox: [10, 20, 100, 50],
      polygon: null,
      source_display_width_pt: 595,
      source_display_height_pt: 842,
      rotation: 0,
      resources: [
        {
          key: "img1",
          signed_url: "https://example.com/img1.png",
          mime_type: "image/png",
          byte_size: 1234,
        },
      ],
    },
    {
      id: "b2",
      type: "Text",
      page: 2,
      page_index: 1,
      section: "",
      text: "Page two content",
      normalized_text: null,
      raw_html: null,
      bbox: null,
      polygon: [
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100],
      ],
      source_display_width_pt: null,
      source_display_height_pt: null,
      rotation: null,
    },
  ],
};

describe("mapKbBlock", () => {
  it("maps normalized_text over text", () => {
    const block = mapKbBlock(SAMPLE_PREVIEW.blocks[0]);
    expect(block.text).toBe("Hello world normalized");
  });

  it("falls back to text when normalized_text is null", () => {
    const block = mapKbBlock(SAMPLE_PREVIEW.blocks[1]);
    expect(block.text).toBe("Page two content");
  });

  it("computes page index from page field", () => {
    const block = mapKbBlock(SAMPLE_PREVIEW.blocks[0]);
    expect(block.pageIndex).toBe(0);
  });

  it("preserves resources", () => {
    const block = mapKbBlock(SAMPLE_PREVIEW.blocks[0]);
    expect(block.resources).toHaveLength(1);
    expect(block.resources![0].key).toBe("img1");
  });

  it("preserves polygon", () => {
    const block = mapKbBlock(SAMPLE_PREVIEW.blocks[1]);
    expect(block.polygon).toHaveLength(4);
  });

  it("computes sourceSize from width/height", () => {
    const block = mapKbBlock(SAMPLE_PREVIEW.blocks[0]);
    expect(block.sourceSize).toEqual({ width: 595, height: 842 });
  });

  it("sets sourceSize to null when dimensions missing", () => {
    const block = mapKbBlock(SAMPLE_PREVIEW.blocks[1]);
    expect(block.sourceSize).toBeNull();
  });
});

describe("mapKbPreviewToEvidenceDocument", () => {
  it("maps full preview data", () => {
    const doc = mapKbPreviewToEvidenceDocument(SAMPLE_PREVIEW);
    expect(doc.filename).toBe("report.pdf");
    expect(doc.previewUrl).toBe("https://example.com/preview.pdf");
    expect(doc.kind).toBe("pdf");
    expect(doc.blocks).toHaveLength(2);
  });

  it("infers kind from extension", () => {
    const textDoc = mapKbPreviewToEvidenceDocument({
      ...SAMPLE_PREVIEW,
      filename: "notes.txt",
    });
    expect(textDoc.kind).toBe("text");

    const mdDoc = mapKbPreviewToEvidenceDocument({
      ...SAMPLE_PREVIEW,
      filename: "readme.md",
    });
    expect(mdDoc.kind).toBe("markdown");
  });

  it("uses filename as id", () => {
    const doc = mapKbPreviewToEvidenceDocument(SAMPLE_PREVIEW);
    expect(doc.id).toBe("report.pdf");
  });
});
