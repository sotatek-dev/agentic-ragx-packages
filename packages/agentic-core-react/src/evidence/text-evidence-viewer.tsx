export interface TextEvidenceViewerProps {
  /** Plain text content to display. */
  content: string;
  className?: string;
}

/** Simple plain-text evidence viewer. No backend fetch — content is provided. */
export function TextEvidenceViewer({
  content,
  className = "",
}: TextEvidenceViewerProps) {
  if (!content) {
    return (
      <p className="p-4 text-sm italic text-muted-foreground">
        No content available.
      </p>
    );
  }

  return (
    <pre
      className={`h-full w-full overflow-auto p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 ${className}`}
    >
      {content}
    </pre>
  );
}
