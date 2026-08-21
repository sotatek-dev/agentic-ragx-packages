/** Typed errors for the Agentic Core SDK. */

/** Thrown when the API returns a non-2xx response. */
export class AgenticHttpError extends Error {
  readonly statusCode: number;
  readonly detail: string;

  constructor(statusCode: number, detail: string) {
    super(`Agentic Core API error ${statusCode}: ${detail}`);
    this.name = "AgenticHttpError";
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

/** Thrown when the SSE stream cannot be parsed. */
export class AgenticStreamParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgenticStreamParseError";
  }
}

/**
 * Redact sensitive values from a string.
 * Matches patterns like key=..., secret=..., token=..., password=..., authorization=...
 */
export function redactSensitive(value: string): string {
  return value.replace(
    /((?:key|secret|token|password|authorization)\s*[=:]\s*).+/gi,
    "$1[REDACTED]",
  );
}
