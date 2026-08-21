/** Chat type contracts for @sota-agentic-ragx/agentic-core-react. */

/** A single citation returned by the agent. */
export interface Citation {
  source?: string | null;
  page?: string | number | null;
  section?: string | null;
  chunk_id: string;
  score?: number | null;
  text?: string | null;
}

/** A tool call rendered inside an assistant message. */
export interface ToolCallPart {
  type: "tool_call";
  toolCallId?: string;
  toolName: string;
  toolArgs: unknown;
  toolState:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  toolResult?: unknown;
  toolError?: string;
}

/** A text or tool-call segment inside a message. */
export type MessagePart = { type: "text"; text: string } | ToolCallPart;

/** A chat message displayed by the UI components. */
export interface AgenticUiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  streaming?: boolean;
  error?: boolean;
  parts?: MessagePart[];
}

/** Stream status data attached to a streaming assistant message. */
export interface StreamStatusData {
  stage: string;
  step?: number;
  action?: string;
  thought?: string;
}

/** Events emitted by useAgenticChat that the UI consumes. */
export type AgenticUiStreamEvent =
  | { type: "status"; stage: string; tool?: string }
  | { type: "token"; delta: string }
  | { type: "tool_call"; part: ToolCallPart }
  | { type: "citations"; citations: Citation[] }
  | { type: "done" }
  | { type: "error"; message: string };
