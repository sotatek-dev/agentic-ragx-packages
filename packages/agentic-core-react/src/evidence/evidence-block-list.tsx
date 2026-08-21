import { useMemo } from "react";
import { FileText, Image, Table2, Type, type LucideIcon } from "lucide-react";
import { SanitizedHtmlBlock } from "./sanitized-html-block.js";
import type { EvidenceBlock } from "./evidence-types.js";

const TYPE_META: Record<string, { icon: LucideIcon; accent: string }> = {
  Page: { icon: FileText, accent: "border-l-slate-400" },
  Text: { icon: Type, accent: "border-l-slate-400" },
  Section: { icon: FileText, accent: "border-l-sky-500" },
  Table: { icon: Table2, accent: "border-l-emerald-500" },
  Figure: { icon: Image, accent: "border-l-amber-500" },
};

export interface EvidenceBlockListProps {
  /** All blocks in the document. */
  blocks: EvidenceBlock[];
  /** Current page index (0-based). */
  pageIndex: number;
  /** Currently selected block, or null. */
  selectedBlock: EvidenceBlock | null;
  /** Callback when a block is selected. */
  onSelectBlock: (block: EvidenceBlock) => void;
  className?: string;
}

export function EvidenceBlockList({
  blocks,
  pageIndex,
  selectedBlock,
  onSelectBlock,
  className = "",
}: EvidenceBlockListProps) {
  const pageBlocks = useMemo(
    () =>
      blocks.filter((block) => {
        return (
          block.pageIndex === pageIndex ||
          (pageIndex === 0 && block.pageIndex === null)
        );
      }),
    [blocks, pageIndex],
  );

  return (
    <section
      className={`flex h-full min-h-0 flex-col bg-white ${className}`}
      aria-label="Evidence Blocks"
    >
      <header className="flex items-center border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h2 className="text-sm font-semibold text-slate-800">
          Page {pageIndex + 1} Blocks
        </h2>
        <span className="ml-2 text-xs tabular-nums text-slate-500">
          {pageBlocks.length}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain p-3">
        {pageBlocks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
            No Blocks on This Page
          </p>
        ) : (
          <div className="space-y-3">
            {pageBlocks.map((block, index) => {
              const selected = selectedBlock?.id === block.id;
              const meta = TYPE_META[block.type] ?? TYPE_META.Text;
              const Icon = meta.icon;
              return (
                <article
                  key={`${block.id}-${index}`}
                  data-block-id={block.id}
                  className={`rounded-lg border border-l-4 bg-white shadow-sm ${meta.accent} ${
                    selected
                      ? "border-sky-600 ring-2 ring-sky-200"
                      : "border-y-slate-200 border-r-slate-200"
                  }`}
                  aria-current={selected ? "true" : undefined}
                >
                  <button
                    type="button"
                    onClick={() => onSelectBlock(block)}
                    className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-t-md px-3 py-2 text-left transition-colors duration-200 hover:bg-slate-50"
                    aria-label={`Select ${block.type || "Text"} block`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="shrink-0 text-slate-500"
                      size={17}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                      {block.type || "Unknown Block"}
                    </span>
                    {block.section ? (
                      <span className="max-w-32 truncate rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {block.section}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        Block
                      </span>
                    )}
                  </button>
                  <div className="border-t border-slate-100 p-3">
                    <SanitizedHtmlBlock
                      html={block.html ?? null}
                      normalizedText={block.text}
                      resources={block.resources ?? []}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
