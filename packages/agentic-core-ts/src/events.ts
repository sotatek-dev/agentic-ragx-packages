/** SSE stream events emitted by the Agentic Core /v1 invoke endpoint. */

export interface StatusEvent {
  type: "status";
  stage: string;
  tool?: string;
}

export interface TokenEvent {
  type: "token";
  delta: string;
}

export interface ToolCallEvent {
  type: "tool_call";
  toolCallId?: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  toolState: string;
  toolResult?: { preview: string; source_count: number; truncated: boolean };
  toolError?: string;
}

export interface Citation {
  source?: string;
  page?: string | number;
  section?: string;
  chunk_id: string;
  score?: number;
  text?: string;
}

export interface CitationsEvent {
  type: "citations";
  citations: Citation[];
}

export interface DoneEvent {
  type: "done";
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

/** Discriminated union of all stream events. */
export type AgenticStreamEvent =
  | StatusEvent
  | TokenEvent
  | ToolCallEvent
  | CitationsEvent
  | DoneEvent
  | ErrorEvent;
