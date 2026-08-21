/** @sotatek-dev/agentic-core-sdk — Node/server TypeScript SDK for Agentic Core API. */

export { AgenticCoreClient } from "./client.js";
export type { AgenticCoreClientOptions } from "./client.js";

export { AgentsResource } from "./agents.js";
export type { InvokeStreamOptions, InvokeStreamResult } from "./agents.js";

export { DocumentsResource } from "./documents.js";
export type {
  ParseOptions,
  ParseResult,
  ParsedPage,
  ParsedBlock,
} from "./documents.js";

export type {
  AgenticStreamEvent,
  StatusEvent,
  TokenEvent,
  ToolCallEvent,
  CitationsEvent,
  Citation,
  DoneEvent,
  ErrorEvent,
} from "./events.js";

export { AgenticHttpError, AgenticStreamParseError, redactSensitive } from "./errors.js";

export { parseSSEStream } from "./sse-parser.js";
