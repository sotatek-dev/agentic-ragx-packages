import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatInput } from "../src/chat/chat-input.js";
import { UserMessage } from "../src/chat/user-message.js";
import { ToolCallCard } from "../src/chat/tool-call-card.js";
import { ChatMessageList } from "../src/chat/chat-message-list.js";
import { CitationSheet } from "../src/chat/citation-sheet.js";
import type { AgenticUiMessage, Citation } from "../src/chat/chat-types.js";

// framer-motion mock — reduce animation overhead in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe("ChatInput", () => {
  it("renders textarea and send button", () => {
    render(<ChatInput onSend={() => {}} disabled={false} />);
    expect(screen.getByPlaceholderText(/Ask a question/)).toBeTruthy();
    expect(screen.getByLabelText("Send")).toBeTruthy();
  });

  it("calls onSend with trimmed text on Enter", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={false} />);
    const textarea = screen.getByPlaceholderText(/Ask a question/);
    fireEvent.change(textarea, { target: { value: "  hello  " } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("hello");
  });

  it("does not send on Shift+Enter", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={false} />);
    const textarea = screen.getByPlaceholderText(/Ask a question/);
    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables send when disabled", () => {
    render(<ChatInput onSend={() => {}} disabled={true} />);
    const button = screen.getByLabelText("Send");
    expect(button.hasAttribute("disabled")).toBe(true);
  });
});

describe("UserMessage", () => {
  it("renders message content", () => {
    const msg: AgenticUiMessage = {
      id: "1",
      role: "user",
      content: "Hello there",
      citations: [],
    };
    render(<UserMessage message={msg} />);
    expect(screen.getByText("Hello there")).toBeTruthy();
  });
});

describe("ToolCallCard", () => {
  it("renders tool name and label", () => {
    render(
      <ToolCallCard
        toolName="file_search"
        toolArgs={{}}
        toolState="input-available"
      />,
    );
    expect(screen.getByText("Searching knowledge base")).toBeTruthy();
  });

  it("shows details toggle when done", () => {
    render(
      <ToolCallCard
        toolName="my_tool"
        toolArgs={{ q: "test" }}
        toolState="output-available"
      />,
    );
    const toggle = screen.getByText("Show details");
    fireEvent.click(toggle);
    expect(screen.getByText("Hide details")).toBeTruthy();
  });

  it("shows error details", () => {
    render(
      <ToolCallCard
        toolName="my_tool"
        toolArgs={{}}
        toolState="output-error"
        toolError="Something failed"
      />,
    );
    fireEvent.click(screen.getByText("Show details"));
    expect(screen.getByText("Something failed")).toBeTruthy();
  });
});

describe("ChatMessageList", () => {
  it("renders user and assistant messages", () => {
    const messages: AgenticUiMessage[] = [
      { id: "1", role: "user", content: "Hi", citations: [] },
      { id: "2", role: "assistant", content: "Hello!", citations: [] },
    ];
    render(
      <ChatMessageList messages={messages} onCitationClick={() => {}} />,
    );
    expect(screen.getByText("Hi")).toBeTruthy();
    expect(screen.getByText("Hello!")).toBeTruthy();
  });

  it("calls onCitationClick when an inline citation marker is clicked", () => {
    const citation: Citation = {
      chunk_id: "c1",
      source: "doc.pdf",
      page: 3,
      text: "| Asset | 2023 |\n| --- | ---: |\n| Cash | P128,582,805 |",
    };
    const onCitationClick = vi.fn();
    const messages: AgenticUiMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: "Answer with citation [1].",
        citations: [citation],
      },
    ];
    render(
      <ChatMessageList messages={messages} onCitationClick={onCitationClick} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /citation 1/i }));

    expect(onCitationClick).toHaveBeenCalledWith([citation]);
  });

  it("calls onCitationClick when a citation pill is clicked", () => {
    const citation: Citation = {
      chunk_id: "c1",
      source: "doc.pdf",
      page: 3,
      text: "Some cited text",
    };
    const onCitationClick = vi.fn();
    const messages: AgenticUiMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: "Answer with citation [1].",
        citations: [citation],
      },
    ];
    render(
      <ChatMessageList messages={messages} onCitationClick={onCitationClick} />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /doc.pdf/i })[1]);

    expect(onCitationClick).toHaveBeenCalledWith([citation]);
  });

  it("shows loading history message when empty", () => {
    render(
      <ChatMessageList
        messages={[]}
        onCitationClick={() => {}}
        loadingHistory={true}
      />,
    );
    expect(screen.getByText("Loading history…")).toBeTruthy();
  });
});

describe("CitationSheet", () => {
  const citations: Citation[] = [
    {
      chunk_id: "c1",
      source: "doc.pdf",
      page: 3,
      section: "Intro",
      text: "Some cited text",
    },
  ];

  it("renders nothing when closed", () => {
    const { container } = render(
      <CitationSheet
        citations={citations}
        open={false}
        onClose={() => {}}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders citations when open", () => {
    render(
      <CitationSheet
        citations={citations}
        open={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Citations (1)")).toBeTruthy();
    expect(screen.getByText("doc.pdf")).toBeTruthy();
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(
      <CitationSheet
        citations={citations}
        open={true}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
