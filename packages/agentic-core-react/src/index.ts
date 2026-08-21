/** @sotatek-dev/agentic-core-react — React 19 chat, citation, and evidence preview components. */

// Chat types
export type {
  Citation,
  ToolCallPart,
  MessagePart,
  AgenticUiMessage,
  StreamStatusData,
  AgenticUiStreamEvent,
} from "./chat/chat-types.js";

// Chat components
export { ChatInput, type ChatInputProps } from "./chat/chat-input.js";
export { UserMessage, type UserMessageProps } from "./chat/user-message.js";
export {
  AssistantMessage,
  type AssistantMessageProps,
} from "./chat/assistant-message.js";
export {
  ChatMessageList,
  type ChatMessageListProps,
} from "./chat/chat-message-list.js";
export { ToolCallCard, type ToolCallCardProps } from "./chat/tool-call-card.js";
export {
  CitationSheet,
  type CitationSheetProps,
} from "./chat/citation-sheet.js";
export {
  MessageMarkdown,
  type MessageMarkdownProps,
} from "./chat/message-markdown.js";

// Chat utilities
export { resolveConfig, type StageConfig } from "./chat/stream-config.js";

// Chat hook
export {
  useAgenticChat,
  type UseAgenticChatOptions,
  type UseAgenticChatReturn,
} from "./chat/use-agentic-chat.js";

// Chat state (for advanced usage / testing)
export {
  chatReducer,
  INITIAL_CHAT_STATE,
  type ChatState,
  type ChatAction,
} from "./chat/chat-state.js";

// Transport types
export type {
  AgenticSendMessageInput,
  AgenticStreamResult,
  AgenticChatTransport,
  HttpProxyTransportOptions,
} from "./transport/transport-types.js";

// Transport implementations
export { createHttpProxyTransport } from "./transport/http-proxy-transport.js";
export { parseSSEStream } from "./transport/sse-parser.js";

// Evidence types
export type {
  EvidenceResource,
  EvidenceBlock,
  EvidenceDocument,
} from "./evidence/evidence-types.js";

// Evidence components
export {
  EvidencePreview,
  type EvidencePreviewProps,
} from "./evidence/evidence-preview.js";
export {
  TextEvidenceViewer,
  type TextEvidenceViewerProps,
} from "./evidence/text-evidence-viewer.js";
export {
  MarkdownEvidenceViewer,
  type MarkdownEvidenceViewerProps,
} from "./evidence/markdown-evidence-viewer.js";
export {
  EvidenceBlockList,
  type EvidenceBlockListProps,
} from "./evidence/evidence-block-list.js";
export {
  SanitizedHtmlBlock,
  sanitizeBlockHtml,
  type SanitizedHtmlBlockProps,
  type SanitizedHtmlResource,
} from "./evidence/sanitized-html-block.js";

// PDF viewer (requires react-pdf peer dep)
export {
  PdfEvidenceViewer,
  type PdfEvidenceViewerProps,
  type PdfViewerDocumentMeta,
  type RenderedPage,
} from "./evidence/pdf-evidence-viewer.js";
export {
  PdfViewerToolbar,
  PdfViewerStatus,
  PdfViewerError,
} from "./evidence/pdf-viewer-toolbar.js";

// Evidence geometry helpers
export {
  transformEvidencePoint,
  transformEvidencePolygon,
  transformCellBbox,
  type EvidenceDimensions,
  type EvidencePoint,
  type EvidenceBbox,
  type RenderedEvidencePoint,
  type RenderedEvidenceRect,
} from "./evidence/evidence-geometry.js";

// Evidence adapters
export {
  mapKbPreviewToEvidenceDocument,
  mapKbBlock,
  type KbPreviewBlockInput,
  type KbPreviewDataInput,
} from "./evidence/evidence-adapters.js";

// Utility
export { cn } from "./lib/cn.js";
