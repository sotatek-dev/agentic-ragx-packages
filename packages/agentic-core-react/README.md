# @sotatek-dev/agentic-core-react

React 19 chat, citation, and evidence preview components for Agentic Core.

## Install

```bash
npm install @sotatek-dev/agentic-core-react
```

### Peer Dependencies

```bash
npm install react react-dom react-markdown remark-gfm
# Optional (for animations and icons):
npm install framer-motion lucide-react
# Optional (for PDF evidence preview):
npm install react-pdf
```

## Tailwind 4 Setup

This package uses Tailwind CSS 4 classes. Ensure your app has Tailwind configured with the `@sotatek-dev/agentic-core-react` source path in your `@source` directive:

```css
@import "tailwindcss";
@source "../node_modules/@sotatek-dev/agentic-core-react/dist";
```

## Security: Proxy-Safe Transport

**⚠️ Never expose API keys in the browser.** The React package calls an app-owned proxy endpoint. Your proxy injects the API key server-side.

```
Browser → /api/agentic-chat → Your Server → Agentic Core /v1/agents/{id}/invoke
```

## Chat Usage

```tsx
import {
  ChatMessageList,
  ChatInput,
  CitationSheet,
  useAgenticChat,
  createHttpProxyTransport,
} from "@sotatek-dev/agentic-core-react";

const transport = createHttpProxyTransport({
  endpoint: "/api/agentic-chat",
});

function Chat() {
  const { messages, isStreaming, streamStatus, sendMessage } = useAgenticChat({
    transport,
    agentId: "your-agent-id",
  });

  return (
    <div className="flex flex-col h-full">
      <ChatMessageList
        messages={messages}
        onCitationClick={(c) => console.log(c)}
        streamStatus={streamStatus}
      />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
```

### Custom Transport

Implement `AgenticChatTransport` for non-HTTP transports:

```tsx
import type { AgenticChatTransport } from "@sotatek-dev/agentic-core-react";

const customTransport: AgenticChatTransport = {
  async sendMessage(input) {
    // Your custom implementation
    return { events: myAsyncEventSource() };
  },
};
```

## Evidence Preview

```tsx
import {
  EvidencePreview,
  EvidenceBlockList,
  mapKbPreviewToEvidenceDocument,
} from "@sotatek-dev/agentic-core-react";

// Convert your API response
const doc = mapKbPreviewToEvidenceDocument(apiResponse);

function Preview() {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);

  return (
    <div className="flex h-[600px]">
      <EvidencePreview
        document={doc}
        selectedBlock={selected}
      />
      <EvidenceBlockList
        blocks={doc.blocks}
        pageIndex={page}
        selectedBlock={selected}
        onSelectBlock={(block) => {
          setSelected(block);
          if (block.pageIndex != null) setPage(block.pageIndex);
        }}
      />
    </div>
  );
}
```

### PDF Viewer

`EvidencePreview` renders PDFs automatically when `document.kind === "pdf"`.
Requires `react-pdf` as a peer dependency. Features:

- Toolbar: page navigation, zoom in/out, fit-width, reset
- Auto-recovery on expired signed URLs (calls `onRefreshPreviewUrl`)
- Block overlay rendering (bbox and polygon highlights)
- Lazy-loaded — no bundle impact if react-pdf is not installed

## Geometry Helpers

For PDF overlay rendering:

```tsx
import {
  transformEvidencePolygon,
  transformCellBbox,
} from "@sotatek-dev/agentic-core-react";

// Transform block coordinates from canonical PDF space to rendered pixels
const polygon = transformEvidencePolygon(block.polygon, canonical, rendered);
const bbox = transformCellBbox(block.bbox, canonical, rendered);
```

## API Reference

### Components

| Component | Description |
|-----------|-------------|
| `ChatMessageList` | Scrollable message list with user/assistant messages |
| `ChatInput` | Textarea with Enter-to-send, Shift+Enter newline |
| `AssistantMessage` | Assistant bubble with markdown, tool calls, citations |
| `UserMessage` | User message bubble |
| `ToolCallCard` | Collapsible tool call state display |
| `CitationSheet` | Slide-over panel for citation details |
| `MessageMarkdown` | Markdown renderer with citation marker support |
| `EvidencePreview` | Routes to PDF/text/markdown viewer based on document kind |
| `PdfEvidenceViewer` | PDF viewer with toolbar, zoom, overlays (requires react-pdf) |
| `TextEvidenceViewer` | Plain text content viewer |
| `MarkdownEvidenceViewer` | Markdown content viewer |
| `EvidenceBlockList` | Block list with selection and page filtering |
| `SanitizedHtmlBlock` | DOMPurify-based HTML renderer with resource resolution |

### Hooks

| Hook | Description |
|------|-------------|
| `useAgenticChat` | Chat state management with streaming support |

### Transport

| Function/Type | Description |
|---------------|-------------|
| `createHttpProxyTransport` | Default HTTP proxy transport factory |
| `parseSSEStream` | Browser SSE stream parser |
| `AgenticChatTransport` | Transport interface for custom implementations |

### Adapters

| Function | Description |
|----------|-------------|
| `mapKbPreviewToEvidenceDocument` | Convert KB preview API response to EvidenceDocument |
| `mapKbBlock` | Convert single KB block to EvidenceBlock |

### Geometry

| Function | Description |
|----------|-------------|
| `transformEvidencePoint` | Scale point from canonical to rendered coordinates |
| `transformEvidencePolygon` | Scale polygon from canonical to rendered |
| `transformCellBbox` | Scale bbox [x,y,w,h] from canonical to rendered |
