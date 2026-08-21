import { useEffect } from "react";
import { MessageMarkdown } from "./message-markdown.js";
import type { Citation } from "./chat-types.js";

export interface CitationSheetProps {
  citations: Citation[];
  open: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * Lightweight slide-over panel for citation details.
 * No external UI library dependency — uses a portal-safe overlay pattern.
 */
export function CitationSheet({
  citations,
  open,
  onClose,
  className = "",
}: CitationSheetProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Citations"
        className={`fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l border-border bg-background shadow-xl ${className}`}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">
            Citations ({citations.length})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 p-4">
            {citations.map((c, i) => {
              const hasPage =
                typeof c.page === "number" ? c.page > 0 : !!c.page;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-muted/30 p-3 text-sm transition-colors hover:border-primary/30"
                >
                  <p className="truncate font-medium text-primary">
                    {c.source ?? "Unknown source"}
                  </p>
                  <p className="mt-0.5 flex flex-wrap gap-1 text-xs text-muted-foreground">
                    {hasPage && <span>Page {c.page}</span>}
                    {hasPage && c.section && <span>·</span>}
                    {c.section && <span>{c.section}</span>}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground/60">
                    {c.chunk_id}
                  </p>
                  {c.text && (
                    <div className="mt-2 max-h-60 overflow-y-auto border-t border-border pt-2 text-foreground">
                      <MessageMarkdown tone="assistant" compact>
                        {c.text}
                      </MessageMarkdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
