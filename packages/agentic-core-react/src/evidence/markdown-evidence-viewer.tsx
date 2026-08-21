import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MarkdownEvidenceViewerProps {
  /** Markdown content to render. */
  content: string;
  className?: string;
}

/** Markdown evidence viewer. No backend fetch — content is provided. */
export function MarkdownEvidenceViewer({
  content,
  className = "",
}: MarkdownEvidenceViewerProps) {
  if (!content) {
    return (
      <p className="p-4 text-sm italic text-muted-foreground">
        No content available.
      </p>
    );
  }

  return (
    <div className={`h-full w-full overflow-auto p-6 ${className}`}>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
