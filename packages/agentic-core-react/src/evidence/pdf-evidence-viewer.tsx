/**
 * PDF Evidence Viewer.
 * Wraps react-pdf with toolbar, zoom, fit-width, auto-recovery,
 * and overlay rendering for evidence block highlights.
 *
 * react-pdf is an optional peer dependency — the import is lazy
 * so the rest of the package works without it.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { EvidenceDimensions } from "./evidence-geometry.js";
import {
  PdfViewerToolbar,
  PdfViewerError,
  PdfViewerStatus,
} from "./pdf-viewer-toolbar.js";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const FALLBACK_PAGE = { width: 595.26, height: 841.86 };

type ReactPdfModule = Pick<
  typeof import("react-pdf"),
  "Document" | "Page"
>;

/** Minimal per-document metadata the viewer needs. */
export interface PdfViewerDocumentMeta {
  id: string;
  page_count: number | null;
  source_display_width_pt?: number | null;
  source_display_height_pt?: number | null;
  pdf_rotation?: number | null;
}

export interface RenderedPage extends EvidenceDimensions {
  pageIndex: number;
}

export interface PdfEvidenceViewerProps {
  document: PdfViewerDocumentMeta;
  previewUrl?: string;
  pageIndex: number;
  onPageChange: (page: number) => void;
  onPageReady?: (pageIndex: number) => void;
  onRenderReady?: (page: RenderedPage) => void;
  /** Called when the PDF fails to load — typically to refresh an expired signed URL. */
  onRefreshSource?: () => Promise<void> | void;
  /** Override per-page canonical dimensions. */
  pageDimensions?: EvidenceDimensions;
  pageRotation?: number;
  /** Reports total page count once the PDF loads. */
  onDocumentLoad?: (numPages: number) => void;
  /** Renders evidence overlays once the page has finished rendering. */
  overlayRenderer?: (args: {
    pageIndex: number;
    canonical: EvidenceDimensions;
    rendered: EvidenceDimensions;
  }) => ReactNode;
}

interface RenderState extends EvidenceDimensions {
  pageIndex: number;
  ready: boolean;
}

export function PdfEvidenceViewer({
  document,
  previewUrl,
  pageIndex,
  onPageChange,
  onPageReady,
  onRenderReady,
  onRefreshSource,
  pageDimensions,
  pageRotation,
  onDocumentLoad,
  overlayRenderer,
}: PdfEvidenceViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const autoRecoveryUsed = useRef(false);
  const recoveryInFlight = useRef(false);
  const [reactPdf, setReactPdf] = useState<ReactPdfModule>();
  const [availableWidth, setAvailableWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [sourceError, setSourceError] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [render, setRender] = useState<RenderState>();

  // Lazy-load react-pdf so the package works without it installed.
  useEffect(() => {
    let active = true;
    import("react-pdf").then((module) => {
      module.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      if (active) setReactPdf({ Document: module.Document, Page: module.Page });
    }).catch(() => {
      // react-pdf not installed — stay in loading state
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const update = () =>
      setAvailableWidth(Math.max(0, element.clientWidth - 32));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setRender(undefined);
    setSourceError(false);
  }, [pageIndex, previewUrl]);

  useEffect(() => {
    autoRecoveryUsed.current = false;
    recoveryInFlight.current = false;
  }, [document.id]);

  const canonical = useMemo<EvidenceDimensions>(
    () => ({
      width:
        pageDimensions?.width ??
        document.source_display_width_pt ??
        FALLBACK_PAGE.width,
      height:
        pageDimensions?.height ??
        document.source_display_height_pt ??
        FALLBACK_PAGE.height,
    }),
    [
      document.source_display_height_pt,
      document.source_display_width_pt,
      pageDimensions,
    ],
  );

  const targetWidth = Math.max(
    1,
    fitWidth && availableWidth
      ? Math.min(availableWidth, canonical.width * MAX_ZOOM)
      : canonical.width * zoom,
  );
  const predictedHeight = targetWidth * (canonical.height / canonical.width);
  const totalPages = Math.max(1, document.page_count ?? 1);
  const currentRender = render?.pageIndex === pageIndex ? render : undefined;
  const rotation = pageRotation ?? document.pdf_rotation ?? undefined;

  const refreshPreview = useCallback(async () => {
    recoveryInFlight.current = true;
    setRecovering(true);
    setSourceError(false);
    try {
      await onRefreshSource?.();
    } catch {
      setSourceError(true);
    } finally {
      recoveryInFlight.current = false;
      setRecovering(false);
    }
  }, [onRefreshSource]);

  const handleSourceError = useCallback(() => {
    if (recoveryInFlight.current) return;
    if (!autoRecoveryUsed.current) {
      autoRecoveryUsed.current = true;
      void refreshPreview();
      return;
    }
    setRecovering(false);
    setSourceError(true);
  }, [refreshPreview]);

  const handleRetry = useCallback(() => {
    autoRecoveryUsed.current = true;
    void refreshPreview();
  }, [refreshPreview]);

  const handlePageLoad = useCallback(
    (loadedPage: { width: number; height: number }) => {
      setRender({
        pageIndex,
        width: loadedPage.width,
        height: loadedPage.height,
        ready: false,
      });
      onPageReady?.(pageIndex);
    },
    [onPageReady, pageIndex],
  );

  const handleRender = useCallback(
    (loadedPage: { width: number; height: number }) => {
      autoRecoveryUsed.current = false;
      const next = {
        pageIndex,
        width: loadedPage.width,
        height: loadedPage.height,
        ready: true,
      };
      setRender(next);
      onRenderReady?.({ pageIndex, width: next.width, height: next.height });
    },
    [onRenderReady, pageIndex],
  );

  const renderedDimensions = currentRender ?? {
    width: targetWidth,
    height: predictedHeight,
  };
  const overlayReady = Boolean(currentRender?.ready);

  return (
    <section
      className="flex h-full min-h-0 flex-col bg-slate-100"
      aria-label="PDF Evidence Viewer"
    >
      <PdfViewerToolbar
        pageIndex={pageIndex}
        totalPages={totalPages}
        zoom={zoom}
        fitWidth={fitWidth}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onPageChange={onPageChange}
        onZoomOut={() => {
          setFitWidth(false);
          setZoom((v) => Math.max(MIN_ZOOM, v - ZOOM_STEP));
        }}
        onZoomIn={() => {
          setFitWidth(false);
          setZoom((v) => Math.min(MAX_ZOOM, v + ZOOM_STEP));
        }}
        onFitWidth={() => setFitWidth(true)}
        onReset={() => {
          setZoom(1);
          setFitWidth(false);
        }}
      />

      <div
        ref={viewportRef}
        className="flex-1 overflow-auto overscroll-contain p-4"
      >
        {!previewUrl ? (
          <PdfViewerStatus message="Preparing Secure Preview…" />
        ) : sourceError ? (
          <PdfViewerError onRetry={handleRetry} />
        ) : recovering || !reactPdf ? (
          <PdfViewerStatus
            message={
              recovering
                ? "Refreshing Secure Preview…"
                : "Loading PDF Viewer…"
            }
          />
        ) : (
          <div
            className="relative mx-auto overflow-hidden bg-white shadow-md"
            style={{
              width: renderedDimensions.width,
              height: renderedDimensions.height,
            }}
            aria-busy={!currentRender?.ready}
          >
            <reactPdf.Document
              file={previewUrl}
              loading={<PdfViewerStatus message="Loading PDF…" />}
              error={null}
              onLoadError={handleSourceError}
              onSourceError={handleSourceError}
              onLoadSuccess={(pdf) => {
                recoveryInFlight.current = false;
                onDocumentLoad?.(pdf.numPages);
              }}
            >
              <reactPdf.Page
                key={`${previewUrl}:${pageIndex}`}
                pageIndex={pageIndex}
                width={targetWidth}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <PdfViewerStatus
                    message={`Rendering Page ${pageIndex + 1}…`}
                  />
                }
                error={null}
                onLoadSuccess={handlePageLoad}
                onRenderSuccess={handleRender}
                onLoadError={handleSourceError}
                onRenderError={handleSourceError}
              />
            </reactPdf.Document>
            {overlayReady &&
              overlayRenderer?.({
                pageIndex,
                canonical,
                rendered: currentRender!,
              })}
          </div>
        )}
      </div>
    </section>
  );
}
