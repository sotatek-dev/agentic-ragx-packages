import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { MessageMarkdown } from "./message-markdown.js";
import { ToolCallCard } from "./tool-call-card.js";
import { resolveConfig } from "./stream-config.js";
import { cn } from "../lib/cn.js";
import type {
  AgenticUiMessage,
  Citation,
  StreamStatusData,
} from "./chat-types.js";

const MAX_VISIBLE_CITATIONS = 3;

interface CitationPillsProps {
  citations: Citation[];
  onCitationClick: (citations: Citation[]) => void;
}

function CitationPills({ citations, onCitationClick }: CitationPillsProps) {
  const visible = citations.slice(0, MAX_VISIBLE_CITATIONS);
  const hidden = citations.length - MAX_VISIBLE_CITATIONS;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {visible.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onCitationClick(citations)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs transition-colors hover:bg-accent"
        >
          <FileText className="h-3 w-3" />
          {c.source ?? "Unknown"}
          {(typeof c.page === "number" ? c.page > 0 : !!c.page)
            ? ` · p.${c.page}`
            : ""}
        </button>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => onCitationClick(citations)}
          className="inline-flex cursor-pointer items-center rounded-full bg-secondary px-2 py-0.5 text-xs"
        >
          +{hidden} more source{hidden === 1 ? "" : "s"}
        </button>
      )}
    </div>
  );
}

export interface AssistantMessageProps {
  message: AgenticUiMessage;
  onCitationClick: (citations: Citation[]) => void;
  streamStatus?: StreamStatusData | null;
  className?: string;
}

export function AssistantMessage({
  message,
  onCitationClick,
  streamStatus,
  className = "",
}: AssistantMessageProps) {
  const parts = message.parts ?? [];
  const hasParts = parts.length > 0;
  const hasVisibleText = hasParts
    ? parts.some((part) => part.type === "text" && part.text.trim())
    : message.content.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex gap-3 ${className}`}
    >
      {/* Avatar */}
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
        A
      </div>

      <div className="max-w-[85%] min-w-0 flex-1">
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm ${
            message.error
              ? "border border-destructive/30 bg-destructive/10 text-destructive"
              : "bg-muted/50 text-foreground"
          }`}
        >
          {hasParts ? (
            parts.map((part, i) => {
              if (part.type === "text") {
                if (!part.text.trim()) return null;
                return (
                  <div key={i}>
                    <MessageMarkdown
                      tone={message.error ? "error" : "assistant"}
                      citations={message.citations}
                      onCitationClick={(citation) => onCitationClick([citation])}
                    >
                      {part.text}
                    </MessageMarkdown>
                    {message.streaming &&
                      hasVisibleText &&
                      i === parts.length - 1 && (
                        <span className="animate-blink ml-0.5 inline-block h-4 w-0.5 bg-current align-text-bottom" />
                      )}
                  </div>
                );
              }
              return (
                <ToolCallCard
                  key={`tool-${i}`}
                  toolName={part.toolName}
                  toolArgs={part.toolArgs}
                  toolState={part.toolState}
                  toolResult={part.toolResult}
                  toolError={part.toolError}
                />
              );
            })
          ) : (
            <>
              <MessageMarkdown
                tone={message.error ? "error" : "assistant"}
                citations={message.citations}
                onCitationClick={(citation) => onCitationClick([citation])}
              >
                {message.content}
              </MessageMarkdown>
              {message.streaming && (
                <span className="animate-blink ml-0.5 inline-block h-4 w-0.5 bg-current align-text-bottom" />
              )}
            </>
          )}
          {message.streaming && streamStatus && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              {(() => {
                const cfg = resolveConfig(
                  streamStatus.stage,
                  streamStatus.action,
                );
                const Icon = cfg.icon;
                return (
                  <>
                    <Icon className={cn("h-3 w-3 shrink-0", cfg.colour)} />
                    <span>{cfg.label}</span>
                    {streamStatus.step != null && (
                      <span className="text-muted-foreground/60">
                        Step {streamStatus.step}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          {message.citations.length > 0 && (
            <CitationPills
              citations={message.citations}
              onCitationClick={onCitationClick}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
