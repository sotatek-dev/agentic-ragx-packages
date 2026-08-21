/**
 * Adapters for converting app-specific data into the normalized EvidenceDocument contract.
 * These let consumers map their own API shapes without coupling the package to any backend.
 */

import type {
  EvidenceBlock,
  EvidenceDocument,
  EvidenceResource,
} from "./evidence-types.js";

/** Shape of a KB preview block from the current backend API. */
export interface KbPreviewBlockInput {
  id: string;
  type: string;
  page: number | null;
  page_index: number | null;
  section: string;
  text: string;
  normalized_text: string | null;
  raw_html: string | null;
  bbox: number[] | null;
  polygon: number[][] | null;
  source_display_width_pt: number | null;
  source_display_height_pt: number | null;
  rotation: number | null;
  resources?: Array<{
    key: string;
    signed_url: string;
    mime_type: string;
    byte_size: number;
  }>;
}

/** Shape of a KB preview response from the current backend API. */
export interface KbPreviewDataInput {
  url: string;
  filename: string;
  size: number;
  status: string;
  chunk_count: number;
  created_at: string;
  blocks: KbPreviewBlockInput[];
}

/** Infer document kind from filename extension. */
function inferKind(filename: string): EvidenceDocument["kind"] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "md" || ext === "markdown") return "markdown";
  return "text";
}

/** Compute page index from a KB block's page/page_index fields. */
function pageIndexForBlock(block: KbPreviewBlockInput): number | null {
  if (typeof block.page_index === "number") return block.page_index;
  if (typeof block.page === "number" && block.page > 0) return block.page - 1;
  return null;
}

/** Convert a KB preview block into a normalized EvidenceBlock. */
export function mapKbBlock(block: KbPreviewBlockInput): EvidenceBlock {
  return {
    id: block.id,
    type: block.type,
    pageIndex: pageIndexForBlock(block),
    section: block.section || undefined,
    text: block.normalized_text ?? block.text,
    html: block.raw_html,
    resources: (block.resources ?? []).map(
      (r): EvidenceResource => ({
        key: r.key,
        signed_url: r.signed_url,
        mime_type: r.mime_type,
        byte_size: r.byte_size,
      }),
    ),
    bbox: block.bbox,
    polygon: block.polygon,
    sourceSize:
      block.source_display_width_pt && block.source_display_height_pt
        ? {
            width: block.source_display_width_pt,
            height: block.source_display_height_pt,
          }
        : null,
    rotation: block.rotation,
  };
}

/**
 * Convert a full KB preview response into a normalized EvidenceDocument.
 * This is the primary adapter for the current backend's preview API shape.
 */
export function mapKbPreviewToEvidenceDocument(
  data: KbPreviewDataInput,
): EvidenceDocument {
  return {
    id: data.filename,
    filename: data.filename,
    previewUrl: data.url,
    kind: inferKind(data.filename),
    pageCount: null,
    blocks: data.blocks.map(mapKbBlock),
  };
}
