import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText } from "lucide-react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Citation } from "./chat-types.js";

export type CitationMarkerProps = {
  index: number;
  citation: Citation;
  onCitationClick?: (citation: Citation) => void;
};

export function CitationPopoverMarker({
  index,
  citation,
  onCitationClick,
}: CitationMarkerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const rootRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hasPage =
    typeof citation.page === "number" ? citation.page > 0 : !!citation.page;

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ left: rect.left, top: rect.bottom + 6 });
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    updatePosition();
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const activate = () => {
    onCitationClick?.(citation);
    if (!onCitationClick) setOpen((current) => !current);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    activate();
  };

  const popover =
    open &&
    createPortal(
      <div
        ref={popoverRef}
        className="fixed z-50 w-96 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md"
        style={{
          left: Math.max(8, Math.min(position.left, window.innerWidth - 400)),
          top: position.top,
        }}
      >
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="min-w-0 flex-1 truncate text-xs font-medium">
            {citation.source ?? "Unknown source"}
          </p>
          {hasPage && (
            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[0.65rem] font-medium text-primary">
              Page {citation.page}
            </span>
          )}
        </div>
        <div className="mt-2 max-h-56 overflow-auto text-xs leading-relaxed text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_table]:w-full [&_table]:text-[0.65rem] [&_th]:border [&_td]:border [&_th]:bg-black/5 [&_th]:px-1 [&_td]:px-1">
          {citation.text ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              urlTransform={defaultUrlTransform}
            >
              {citation.text}
            </ReactMarkdown>
          ) : (
            <p className="italic text-muted-foreground/70">
              No preview available.
            </p>
          )}
        </div>
        {citation.section && (
          <p className="mt-2 truncate text-[0.65rem] text-muted-foreground/60">
            Section: {citation.section}
          </p>
        )}
      </div>,
      document.body,
    );

  return (
    <span ref={rootRef} className="relative inline-flex align-baseline">
      <span
        className="mx-0.5 inline-flex h-4 min-w-4 cursor-pointer items-center justify-center rounded-full bg-primary/10 px-1 align-baseline text-[0.625rem] font-semibold text-primary transition-colors hover:bg-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/40"
        title={`${citation.source ?? "Unknown"}${hasPage ? ` - p.${citation.page}` : ""}`}
        data-citation
        role="button"
        tabIndex={0}
        aria-label={`Citation ${index}: ${citation.source ?? "source"}`}
        aria-expanded={open}
        onClick={activate}
        onKeyDown={handleKeyDown}
      >
        {index}
      </span>
      {popover}
    </span>
  );
}
