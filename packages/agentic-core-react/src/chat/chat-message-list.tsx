import { type RefObject } from "react";
import { AssistantMessage } from "./assistant-message.js";
import { UserMessage } from "./user-message.js";
import type {
  AgenticUiMessage,
  Citation,
  StreamStatusData,
} from "./chat-types.js";

export interface ChatMessageListProps {
  messages: AgenticUiMessage[];
  onCitationClick: (citations: Citation[]) => void;
  loadingHistory?: boolean;
  scrollEndRef?: RefObject<HTMLDivElement | null>;
  streamStatus?: StreamStatusData | null;
  className?: string;
}

export function ChatMessageList({
  messages,
  onCitationClick,
  loadingHistory,
  scrollEndRef,
  streamStatus,
  className = "",
}: ChatMessageListProps) {
  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      <div className="flex flex-col gap-4 px-4 py-4">
        {loadingHistory && messages.length === 0 && (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            Loading history…
          </p>
        )}
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserMessage key={msg.id} message={msg} />
          ) : (
            <AssistantMessage
              key={msg.id}
              message={msg}
              onCitationClick={onCitationClick}
              streamStatus={msg.streaming ? streamStatus : null}
            />
          ),
        )}
        <div ref={scrollEndRef} />
      </div>
    </div>
  );
}
