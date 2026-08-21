import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import {
  CitationPopoverMarker,
  type CitationMarkerProps,
} from "./citation-popover-marker.js";
import type { Citation } from "./chat-types.js";

type Tone = "user" | "assistant" | "error";

const baseSm =
  "text-sm leading-relaxed break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mb-1 [&_table]:w-full [&_table]:text-xs [&_th]:border [&_td]:border [&_th]:px-2 [&_td]:px-2 [&_th]:bg-black/5 [&_hr]:my-3";

const baseXs =
  "text-xs leading-relaxed break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mb-1 [&_table]:w-full [&_table]:text-[0.65rem] [&_th]:border [&_td]:border [&_th]:px-1 [&_td]:px-1 [&_th]:bg-black/5 [&_hr]:my-3";

const toneExtras: Record<Tone, string> = {
  user: "[&_a:not([data-citation])]:text-blue-100 [&_a:not([data-citation])]:underline [&_code]:rounded [&_code]:bg-white/20 [&_code]:px-1 [&_code]:text-[0.9em] [&_pre]:mt-2 [&_pre]:rounded-md [&_pre]:bg-blue-700/50 [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:text-[0.9em] [&_blockquote]:border-white/40",
  assistant:
    "[&_a:not([data-citation])]:text-blue-600 [&_a:not([data-citation])]:underline [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:text-[0.9em] [&_pre]:mt-2 [&_pre]:rounded-md [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:text-[0.9em] [&_blockquote]:border-gray-300",
  error: "[&_a:not([data-citation])]:text-red-700 [&_a:not([data-citation])]:underline [&_code]:rounded [&_code]:bg-red-100 [&_code]:px-1 [&_blockquote]:border-red-200",
};

const CITE_MARKER = /\[(\d+)\]/g;
const CITE_URL_PREFIX = "cite:";

/** Remark plugin that replaces [N] markers with cite:N links. */
function remarkCitations() {
  return (tree: unknown) => {
    visit(
      tree as never,
      "text",
      (node: unknown, index: number | undefined, parent: unknown) => {
        const n = node as { value: string };
        const p = parent as
          | { children: unknown[]; type?: string }
          | undefined;
        if (!p || index === undefined) return;
        if (p.type === "link") return;
        if (!CITE_MARKER.test(n.value)) {
          CITE_MARKER.lastIndex = 0;
          return;
        }
        CITE_MARKER.lastIndex = 0;

        const parts: unknown[] = [];
        let lastEnd = 0;
        let m: RegExpExecArray | null;
        const text = n.value;
        CITE_MARKER.lastIndex = 0;
        while ((m = CITE_MARKER.exec(text)) !== null) {
          const [full, num] = m;
          const start = m.index;
          if (start > lastEnd) {
            parts.push({ type: "text", value: text.slice(lastEnd, start) });
          }
          parts.push({
            type: "link",
            url: `${CITE_URL_PREFIX}${num}`,
            title: null,
            children: [{ type: "text", value: full }],
          });
          lastEnd = start + full.length;
        }
        if (lastEnd < text.length) {
          parts.push({ type: "text", value: text.slice(lastEnd) });
        }

        p.children.splice(index, 1, ...parts);
        return index + parts.length;
      },
    );
  };
}

export type { CitationMarkerProps };

export interface MessageMarkdownProps {
  children: unknown;
  tone: Tone;
  /** Smaller typography for side panels. */
  compact?: boolean;
  /** When provided, [N] markers render as citation indicators. */
  citations?: Citation[];
  /** Custom citation marker component. Receives 1-indexed citation number. */
  citationMarker?: React.ComponentType<CitationMarkerProps>;
  /** Called when an inline `[N]` citation marker is activated. */
  onCitationClick?: (citation: Citation) => void;
}

export function MessageMarkdown({
  children,
  tone,
  compact = false,
  citations,
  citationMarker: CitationMarker = CitationPopoverMarker,
  onCitationClick,
}: MessageMarkdownProps) {
  const cls = `${compact ? baseXs : baseSm} ${toneExtras[tone]}`;
  const text =
    typeof children === "string"
      ? children
      : children == null
        ? ""
        : JSON.stringify(children);

  const hasCitations = !!citations && citations.length > 0;
  const plugins = hasCitations ? [remarkGfm, remarkCitations] : [remarkGfm];

  return (
    <div className={cls}>
      <ReactMarkdown
        remarkPlugins={plugins}
        urlTransform={(url) =>
          url.startsWith(CITE_URL_PREFIX) ? url : defaultUrlTransform(url)
        }
        components={{
          a: ({ node: _node, href, children, ...rest }) => {
            if (
              hasCitations &&
              typeof href === "string" &&
              href.startsWith(CITE_URL_PREFIX)
            ) {
              const n = Number.parseInt(
                href.slice(CITE_URL_PREFIX.length),
                10,
              );
              const citation = citations?.[n - 1];
              if (citation) {
                return (
                  <CitationMarker
                    index={n}
                    citation={citation}
                    onCitationClick={onCitationClick}
                  />
                );
              }
              return <span className="text-muted-foreground">{children}</span>;
            }
            return (
              <a href={href} {...rest}>
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
