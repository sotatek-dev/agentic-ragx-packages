/**
 * Sanitized HTML block renderer.
 * Adapted from frontend/components/ui/sanitized-html-block.tsx.
 * Renders HTML through DOMPurify with strict allowlists.
 */

import DOMPurify from "dompurify";
import { useCallback, useMemo, useSyncExternalStore, type SyntheticEvent } from "react";

export interface SanitizedHtmlResource {
  key: string;
  signed_url: string;
  mime_type: string;
  byte_size: number;
}

const ALLOWED_TAGS = [
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b",
  "em", "i", "u", "s", "small", "sub", "sup", "blockquote", "ul", "ol",
  "li", "dl", "dt", "dd", "table", "thead", "tbody", "tfoot", "tr", "th",
  "td", "caption", "colgroup", "col", "pre", "code", "span", "div", "img",
];

const ALLOWED_ATTR = [
  "alt", "title", "src", "width", "height", "colspan", "rowspan", "scope",
  "aria-label", "role", "data-missing-resource",
];

const RESOURCE_REFRESH_FALLBACK_DELAY_MS = 1_000;

function safeResourceUrl(url: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function resourceKeyFromSource(source: string): string {
  const withoutScheme = source.startsWith("resource://")
    ? source.slice(11)
    : source;
  return withoutScheme.replace(/^\.\//, "").replace(/^images\//, "");
}

/** Sanitize block HTML, resolving resource:// image sources. */
export function sanitizeBlockHtml(
  html: string,
  resources: SanitizedHtmlResource[],
): string {
  if (typeof DOMParser === "undefined" || !html.trim()) return "";
  const document = new DOMParser().parseFromString(html, "text/html");
  const approved = new Map(
    resources
      .filter((r) => safeResourceUrl(r.signed_url))
      .map((r) => [r.key, r.signed_url]),
  );

  document.querySelectorAll("img").forEach((image) => {
    const resourceKey = image.getAttribute("data-resource-key")?.trim();
    const source = image.getAttribute("src")?.trim() ?? "";
    const resolved = approved.get(resourceKey || resourceKeyFromSource(source));
    if (resolved) {
      image.setAttribute("src", resolved);
      image.removeAttribute("srcset");
      image.removeAttribute("data-resource-key");
      if (!image.hasAttribute("alt")) image.setAttribute("alt", "Document image");
      image.setAttribute("loading", "lazy");
      return;
    }
    const fallback = document.createElement("span");
    fallback.setAttribute("role", "img");
    fallback.setAttribute(
      "aria-label",
      image.getAttribute("alt") || "Image unavailable",
    );
    fallback.setAttribute("data-missing-resource", "true");
    fallback.textContent = image.getAttribute("alt") || "Image unavailable";
    image.replaceWith(fallback);
  });

  return DOMPurify.sanitize(document.body.innerHTML, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [...ALLOWED_ATTR, "loading"],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "form", "iframe", "object", "embed", "video", "audio"],
    FORBID_ATTR: ["style", "srcset"],
  });
}

function replaceImageWithFallback(image: HTMLImageElement) {
  const fallback = document.createElement("span");
  fallback.setAttribute("role", "img");
  fallback.setAttribute("aria-label", "Image resource unavailable");
  fallback.setAttribute("data-missing-resource", "true");
  fallback.textContent = "Image resource unavailable";
  image.replaceWith(fallback);
}

export interface SanitizedHtmlBlockProps {
  html: string | null;
  normalizedText: string | null;
  resources?: SanitizedHtmlResource[];
  onResourceError?: (resourceUrl: string) => Promise<boolean> | boolean;
  className?: string;
}

export function SanitizedHtmlBlock({
  html,
  normalizedText,
  resources = [],
  onResourceError,
  className = "",
}: SanitizedHtmlBlockProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const sanitized = useMemo(
    () => (mounted ? sanitizeBlockHtml(html ?? "", resources) : ""),
    [html, mounted, resources],
  );

  const handleImageError = useCallback(
    (event: SyntheticEvent<HTMLDivElement>) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      const image = event.target;
      const failedUrl = image.currentSrc || image.src;
      void Promise.resolve(onResourceError?.(failedUrl) ?? false).then(
        (refreshing) => {
          if (!image.isConnected) return;
          if (refreshing) {
            window.setTimeout(() => {
              const currentUrl = image.currentSrc || image.src;
              if (image.isConnected && currentUrl === failedUrl)
                replaceImageWithFallback(image);
            }, RESOURCE_REFRESH_FALLBACK_DELAY_MS);
            return;
          }
          replaceImageWithFallback(image);
        },
      );
    },
    [onResourceError],
  );

  if (!html?.trim()) {
    return normalizedText?.trim() ? (
      <p className={`whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 ${className}`}>
        {normalizedText}
      </p>
    ) : (
      <p className={`text-sm italic text-slate-500 ${className}`}>
        No Rich Content Available
      </p>
    );
  }

  if (!mounted) {
    return (
      <p className={`text-sm text-slate-500 ${className}`} role="status">
        Preparing Rich Content…
      </p>
    );
  }

  if (!sanitized.trim()) {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
          Rich Content Unavailable
        </p>
        {normalizedText?.trim() && (
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {normalizedText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`sanitized-html-block prose prose-slate max-w-none break-words text-sm ${className}`}
      onErrorCapture={handleImageError}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
