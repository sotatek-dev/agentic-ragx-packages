import { type KeyboardEvent, useRef, useState } from "react";
import { Loader2, SendHorizonal } from "lucide-react";

const MAX_ROWS = 5;
const LINE_HEIGHT_PX = 20;

export interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  /** Override placeholder text. */
  placeholder?: string;
  /** Additional class names for the outer container. */
  className?: string;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Ask a question about your documents… (Enter to send)",
  className = "",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    const maxHeight = MAX_ROWS * LINE_HEIGHT_PX + 24;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

  return (
    <div className={`shrink-0 border-t border-border bg-background px-4 py-3 ${className}`}>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 self-center"
          style={{ lineHeight: `${LINE_HEIGHT_PX}px` }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 self-end cursor-pointer disabled:cursor-not-allowed"
          aria-label="Send"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground/50">
        Shift + Enter for a new line
      </p>
    </div>
  );
}
