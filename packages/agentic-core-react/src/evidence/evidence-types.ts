/** Evidence type contracts for @sotatek-dev/agentic-core-react. */

/** A normalized evidence resource (image, attachment) referenced by a block. */
export interface EvidenceResource {
  key: string;
  signed_url: string;
  mime_type: string;
  byte_size: number;
}

/** A single block/chunk within an evidence document. */
export interface EvidenceBlock {
  id: string;
  type: string;
  pageIndex: number | null;
  section?: string | null;
  text: string;
  html?: string | null;
  resources?: EvidenceResource[];
  bbox?: number[] | null;
  polygon?: number[][] | null;
  sourceSize?: { width: number; height: number } | null;
  rotation?: number | null;
}

/** A normalized evidence document for preview rendering. */
export interface EvidenceDocument {
  id: string;
  filename: string;
  previewUrl?: string;
  kind: "pdf" | "text" | "markdown";
  pageCount?: number | null;
  blocks: EvidenceBlock[];
}
