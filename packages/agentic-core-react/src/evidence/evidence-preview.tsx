/**
 * Evidence preview router.
 * Renders the appropriate viewer based on document kind.
 * PDF rendering uses the built-in PdfEvidenceViewer (requires react-pdf peer dep).
 */

import { useCallback, useState, type ReactNode } from "react";
import { TextEvidenceViewer } from "./text-evidence-viewer.js";
import { MarkdownEvidenceViewer } from "./markdown-evidence-viewer.js";
import { PdfEvidenceViewer } from "./pdf-evidence-viewer.js";
import { transformEvidencePolygon, transformCellBbox } from "./evidence-geometry.js";
import type { EvidenceBlock, EvidenceDocument } from "./evidence-types.js";
import type { EvidenceDimensions } from "./evidence-geometry.js";

export interface EvidencePreviewProps {
  /** The evidence document to render. */
  document: EvidenceDocument;
  /** Current page index (0-based, for PDF). */
  pageIndex?: number;
  /** Callback when page changes (PDF). */
  onPageChange?: (pageIndex: number) => void;
  /** Currently selected block for overlay (PDF). */
  selectedBlock?: EvidenceBlock | null;
  /**
   * Custom overlay renderer for PDF pages.
   * If not provided, uses the selectedBlock's bbox/polygon for a default highlight.
   */
  overlayRenderer?: (args: {
    pageIndex: number;
    canonical: EvidenceDimensions;
    rendered: EvidenceDimensions;
  }) => ReactNode;
  /** Text content for text/markdown kinds (if not embedded in document blocks). */
  content?: string;
  /** Callback to refresh an expired signed preview URL. */
  onRefreshPreviewUrl?: () => Promise<void> | void;
  className?: string;
}

/** Default overlay that highlights the selectedBlock's geometry. */
function DefaultBlockOverlay({
  block,
  canonical,
  rendered,
}: {
  block: EvidenceBlock;
  canonical: EvidenceDimensions;
  rendered: EvidenceDimensions;
}) {
  const polygon = block.polygon?.length
    ? transformEvidencePolygon(block.polygon, canonical, rendered)
    : null;
  const rect =
    !polygon && block.bbox
      ? transformCellBbox(block.bbox, canonical, rendered)
      : null;

  if (polygon) {
    const points = polygon.map((p) => `${p.x},${p.y}`).join(" ");
    return (
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <polygon
          points={points}
          className="fill-sky-400/20 stroke-sky-700"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (!rect) return null;
  return (
    <div
      className="pointer-events-none absolute border-2 border-sky-700 bg-sky-400/20 shadow-[0_0_0_9999px_rgba(15,23,42,0.08)]"
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      aria-hidden="true"
    />
  );
}

function pageIndexForBlock(block: EvidenceBlock): number | null {
  return block.pageIndex;
}

export function EvidencePreview({
  document,
  pageIndex: controlledPageIndex,
  onPageChange,
  selectedBlock,
  overlayRenderer,
  content,
  onRefreshPreviewUrl,
  className = "",
}: EvidencePreviewProps) {
  const { kind } = document;
  const [internalPage, setInternalPage] = useState(0);
  const pageIndex = controlledPageIndex ?? internalPage;

  const handlePageChange = useCallback(
    (page: number) => {
      setInternalPage(page);
      onPageChange?.(page);
    },
    [onPageChange],
  );

  if (kind === "text") {
    const textContent = content ?? extractTextFromBlocks(document.blocks);
    return <TextEvidenceViewer content={textContent} className={className} />;
  }

  if (kind === "markdown") {
    const mdContent = content ?? extractTextFromBlocks(document.blocks);
    return (
      <MarkdownEvidenceViewer content={mdContent} className={className} />
    );
  }

  if (kind === "pdf") {
    const selectedPageIndex = selectedBlock
      ? pageIndexForBlock(selectedBlock)
      : null;
    const pageDimensions =
      selectedBlock?.sourceSize ??
      (selectedBlock?.sourceSize
        ? { width: selectedBlock.sourceSize.width, height: selectedBlock.sourceSize.height }
        : undefined);

    return (
      <div className={className}>
        <PdfEvidenceViewer
          document={{
            id: document.id,
            page_count: document.pageCount ?? null,
            source_display_width_pt: selectedBlock?.sourceSize?.width,
            source_display_height_pt: selectedBlock?.sourceSize?.height,
            pdf_rotation: selectedBlock?.rotation,
          }}
          previewUrl={document.previewUrl}
          pageIndex={pageIndex}
          onPageChange={handlePageChange}
          onRefreshSource={onRefreshPreviewUrl}
          pageDimensions={pageDimensions}
          pageRotation={selectedBlock?.rotation ?? undefined}
          overlayRenderer={
            overlayRenderer ??
            ((args) =>
              selectedBlock && selectedPageIndex === args.pageIndex ? (
                <DefaultBlockOverlay
                  block={selectedBlock}
                  canonical={args.canonical}
                  rendered={args.rendered}
                />
              ) : null)
          }
        />
      </div>
    );
  }

  return (
    <p className={`p-4 text-sm italic text-muted-foreground ${className}`}>
      Unsupported document kind: {kind}
    </p>
  );
}

function extractTextFromBlocks(blocks: EvidenceBlock[]): string {
  return blocks
    .map((b) => b.text)
    .filter(Boolean)
    .join("\n\n");
}
