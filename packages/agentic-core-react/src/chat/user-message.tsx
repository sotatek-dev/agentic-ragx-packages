import { motion } from "framer-motion";
import type { AgenticUiMessage } from "./chat-types.js";

export interface UserMessageProps {
  message: AgenticUiMessage;
  className?: string;
}

export function UserMessage({ message, className = "" }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex justify-end ${className}`}
    >
      <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground shadow-sm">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}
