import { useState } from "react";
import {
  Check,
  ChevronDown,
  FileSearch,
  Loader2,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/cn.js";

export interface ToolCallCardProps {
  toolName: string;
  toolArgs: unknown;
  toolState:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  toolResult?: unknown;
  toolError?: string;
  className?: string;
}

const TOOL_DISPLAY: Record<string, { label: string; icon: LucideIcon }> = {
  file_search: { label: "Searching knowledge base", icon: FileSearch },
  vector_search: { label: "Searching documents", icon: FileSearch },
  keyword_search: { label: "Searching keywords", icon: FileSearch },
  rerank_documents: { label: "Reranking results", icon: FileSearch },
};

export function ToolCallCard({
  toolName,
  toolArgs,
  toolState,
  toolResult,
  toolError,
  className = "",
}: ToolCallCardProps) {
  const [open, setOpen] = useState(false);
  const display = TOOL_DISPLAY[toolName] ?? { label: toolName, icon: Wrench };
  const Icon = display.icon;
  const running =
    toolState === "input-streaming" || toolState === "input-available";
  const failed = toolState === "output-error";
  const done = toolState === "output-available";

  return (
    <div className={`my-0.5 overflow-hidden rounded-md ${className}`}>
      <div className="flex items-center gap-2 px-1 py-0.5">
        <Icon className="h-3 w-3 shrink-0 text-muted-foreground/60" />
        <span className="flex-1 text-xs text-muted-foreground">
          {display.label}
        </span>
        {running && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />
        )}
        {done && <Check className="h-3 w-3 shrink-0 text-green-500/70" />}
        {failed && <X className="h-3 w-3 shrink-0 text-destructive/70" />}
      </div>

      {(done || failed) && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center gap-1 px-1 py-0.5 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
            />
            <span>{open ? "Hide" : "Show"} details</span>
          </button>
          {open && (
            <div className="max-h-48 overflow-y-auto px-3 pb-2 text-xs">
              <ToolJson label="Args" value={toolArgs} />
              {failed ? (
                <ToolJson
                  label="Error"
                  value={toolError ?? "Unknown error"}
                  tone="error"
                />
              ) : toolResult ? (
                <ToolJson label="Result" value={toolResult} />
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolJson({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: unknown;
  tone?: "muted" | "error";
}) {
  return (
    <div className={cn("mt-1", tone === "error" && "text-destructive")}>
      <div className="mb-1 text-muted-foreground/70">{label}:</div>
      <pre
        className={cn(
          "whitespace-pre-wrap break-all rounded px-2 py-1",
          tone === "error"
            ? "bg-destructive/10"
            : "bg-muted/50 text-muted-foreground",
        )}
      >
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
