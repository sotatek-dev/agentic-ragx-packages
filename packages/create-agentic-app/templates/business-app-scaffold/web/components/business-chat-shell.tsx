"use client";

import { useState } from "react";
import {
  createHttpProxyTransport,
  useAgenticChat,
  ChatMessageList,
  ChatInput,
  CitationSheet,
} from "@sotatek-dev/agentic-core-react";
import type { Citation } from "@sotatek-dev/agentic-core-react";

const transport = createHttpProxyTransport({ endpoint: "/api/agentic-chat" });

export function BusinessChatShell() {
  const [agentId, setAgentId] = useState(
    process.env.NEXT_PUBLIC_AGENT_ID || "",
  );
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

  if (!agentId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="p-6 bg-white rounded-lg shadow-sm border max-w-md w-full">
          <h2 className="text-lg font-semibold mb-4">Enter Agent ID</h2>
          <input
            type="text"
            placeholder="Agent ID"
            className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) setAgentId(val);
              }
            }}
          />
          <p className="text-sm text-gray-500">
            Or set NEXT_PUBLIC_AGENT_ID in .env
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <header className="px-4 py-3 border-b bg-white">
        <h1 className="font-semibold text-gray-900">Business App Chat</h1>
      </header>

      <ChatMessageList
        messages={messages}
        onCitationClick={handleCitationClick}
        className="flex-1 overflow-auto bg-gray-50"
      />

      <div className="border-t bg-white">
        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          placeholder={
            isStreaming ? "Thinking..." : "Ask about a document..."
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
