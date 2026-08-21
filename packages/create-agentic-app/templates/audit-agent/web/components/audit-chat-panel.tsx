"use client";

import { useState } from "react";
import {
  createHttpProxyTransport,
  useAgenticChat,
  ChatMessageList,
  ChatInput,
  CitationSheet,
} from "@sota-agentic-ragx/agentic-core-react";
import type { Citation } from "@sota-agentic-ragx/agentic-core-react";

const transport = createHttpProxyTransport({ endpoint: "/api/agentic-chat" });

interface Props {
  agentId: string;
}

export function AuditChatPanel({ agentId }: Props) {
  const [selectedCitations, setSelectedCitations] = useState<Citation[]>([]);
  const [citationSheetOpen, setCitationSheetOpen] = useState(false);
  const { messages, isStreaming, sendMessage } = useAgenticChat({
    transport,
    agentId,
  });

  const handleCitationClick = (citations: Citation[]) => {
    setSelectedCitations(citations);
    setCitationSheetOpen(true);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      <header className="px-3 py-2 border-b bg-gray-50 rounded-t-lg">
        <h3 className="text-sm font-semibold text-gray-700">Audit Chat</h3>
      </header>

      <ChatMessageList
        messages={messages}
        onCitationClick={handleCitationClick}
        className="flex-1 overflow-auto"
      />

      <div className="border-t">
        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          placeholder={
            isStreaming ? "Thinking..." : "Ask about audit findings..."
          }
        />
      </div>

      <CitationSheet
        citations={selectedCitations}
        open={citationSheetOpen}
        onClose={() => setCitationSheetOpen(false)}
      />
    </div>
  );
}
