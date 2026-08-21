import {
  ChevronLeft,
  ChevronRight,
  Focus,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react";

const BUTTON_CLASS =
  "inline-flex min-h-11 min-w-11 touch-manipulation cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 disabled:cursor-not-allowed disabled:opacity-40";

export function PdfViewerStatus({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-72 items-center justify-center p-6 text-center text-sm text-slate-600"
      role="status"
    >
      <span className="animate-pulse motion-reduce:animate-none">
        {message}
      </span>
    </div>
  );
}

export function PdfViewerError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-slate-800">
        PDF preview could not be loaded.
      </p>
      <p className="max-w-sm text-xs leading-5 text-slate-600">
        The secure link may have expired. Refresh it and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={`${BUTTON_CLASS} gap-2 border border-slate-300 bg-white px-3`}
      >
        <RefreshCw aria-hidden="true" size={16} />
        Retry Preview
      </button>
    </div>
  );
}

interface PdfViewerToolbarProps {
  pageIndex: number;
  totalPages: number;
  zoom: number;
  fitWidth: boolean;
  minZoom: number;
  maxZoom: number;
  onPageChange: (pageIndex: number) => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitWidth: () => void;
  onReset: () => void;
}

export function PdfViewerToolbar({
  pageIndex,
  totalPages,
  zoom,
  fitWidth,
  minZoom,
  maxZoom,
  onPageChange,
  onZoomOut,
  onZoomIn,
  onFitWidth,
  onReset,
}: PdfViewerToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-2"
      role="toolbar"
      aria-label="PDF controls"
    >
      <button
        type="button"
        className={BUTTON_CLASS}
        aria-label="Previous Page"
        onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
        disabled={pageIndex === 0}
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>
      <span className="min-w-24 text-center text-sm tabular-nums text-slate-700" aria-live="polite">
        Page {pageIndex + 1} / {totalPages}
      </span>
      <button
        type="button"
        className={BUTTON_CLASS}
        aria-label="Next Page"
        onClick={() => onPageChange(Math.min(totalPages - 1, pageIndex + 1))}
        disabled={pageIndex >= totalPages - 1}
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          className={BUTTON_CLASS}
          aria-label="Zoom Out"
          onClick={onZoomOut}
          disabled={!fitWidth && zoom <= minZoom}
        >
          <Minus aria-hidden="true" size={17} />
        </button>
        <span className="w-14 text-center text-xs tabular-nums text-slate-600">
          {fitWidth ? "Fit" : `${Math.round(zoom * 100)}%`}
        </span>
        <button
          type="button"
          className={BUTTON_CLASS}
          aria-label="Zoom In"
          onClick={onZoomIn}
          disabled={!fitWidth && zoom >= maxZoom}
        >
          <Plus aria-hidden="true" size={17} />
        </button>
        <button
          type="button"
          className={BUTTON_CLASS}
          aria-label="Fit Page Width"
          onClick={onFitWidth}
          aria-pressed={fitWidth}
        >
          <Maximize2 aria-hidden="true" size={17} />
        </button>
        <button
          type="button"
          className={BUTTON_CLASS}
          aria-label="Reset Zoom"
          onClick={onReset}
        >
          <Focus aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  );
}
