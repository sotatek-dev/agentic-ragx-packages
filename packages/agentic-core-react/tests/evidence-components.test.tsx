import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextEvidenceViewer } from "../src/evidence/text-evidence-viewer.js";
import { MarkdownEvidenceViewer } from "../src/evidence/markdown-evidence-viewer.js";
import { EvidencePreview } from "../src/evidence/evidence-preview.js";
import { EvidenceBlockList } from "../src/evidence/evidence-block-list.js";
import type { EvidenceDocument, EvidenceBlock } from "../src/index.js";

describe("TextEvidenceViewer", () => {
  it("renders content", () => {
    render(<TextEvidenceViewer content="Hello text" />);
    expect(screen.getByText("Hello text")).toBeTruthy();
  });

  it("renders fallback for empty content", () => {
    render(<TextEvidenceViewer content="" />);
    expect(screen.getByText("No content available.")).toBeTruthy();
  });
});

describe("MarkdownEvidenceViewer", () => {
  it("renders markdown content", () => {
    render(<MarkdownEvidenceViewer content={"# Title\n\nWorld"} />);
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("World")).toBeTruthy();
  });

  it("renders fallback for empty content", () => {
    render(<MarkdownEvidenceViewer content="" />);
    expect(screen.getByText("No content available.")).toBeTruthy();
  });
});

describe("EvidencePreview", () => {
  it("renders text viewer for text kind", () => {
    const doc: EvidenceDocument = {
      id: "1",
      filename: "test.txt",
      kind: "text",
      blocks: [],
    };
    render(<EvidencePreview document={doc} content="some text" />);
    expect(screen.getByText("some text")).toBeTruthy();
  });

  it("renders markdown viewer for markdown kind", () => {
    const doc: EvidenceDocument = {
      id: "1",
      filename: "test.md",
      kind: "markdown",
      blocks: [],
    };
    render(<EvidencePreview document={doc} content="# Title" />);
    expect(screen.getByText("Title")).toBeTruthy();
  });

  it("renders PDF viewer for pdf kind", () => {
    const doc: EvidenceDocument = {
      id: "1",
      filename: "test.pdf",
      kind: "pdf",
      blocks: [],
      previewUrl: "https://example.com/test.pdf",
    };
    render(<EvidencePreview document={doc} />);
    expect(screen.getByLabelText("PDF Evidence Viewer")).toBeTruthy();
    expect(screen.getByLabelText("PDF controls")).toBeTruthy();
  });
});

describe("EvidenceBlockList", () => {
  const blocks: EvidenceBlock[] = [
    { id: "b1", type: "Section", pageIndex: 0, text: "Block one", section: "Intro" },
    { id: "b2", type: "Text", pageIndex: 0, text: "Block two" },
    { id: "b3", type: "Text", pageIndex: 1, text: "Block three" },
  ];

  it("filters blocks by page index", () => {
    render(
      <EvidenceBlockList
        blocks={blocks}
        pageIndex={0}
        selectedBlock={null}
        onSelectBlock={() => {}}
      />,
    );
    expect(screen.getByText("Block one")).toBeTruthy();
    expect(screen.getByText("Block two")).toBeTruthy();
    expect(screen.queryByText("Block three")).toBeNull();
  });

  it("calls onSelectBlock when block is clicked", () => {
    const onSelect = vi.fn();
    render(
      <EvidenceBlockList
        blocks={blocks}
        pageIndex={0}
        selectedBlock={null}
        onSelectBlock={onSelect}
      />,
    );
    fireEvent.click(screen.getByLabelText("Select Section block"));
    expect(onSelect).toHaveBeenCalledWith(blocks[0]);
  });

  it("shows empty state when no blocks on page", () => {
    render(
      <EvidenceBlockList
        blocks={blocks}
        pageIndex={5}
        selectedBlock={null}
        onSelectBlock={() => {}}
      />,
    );
    expect(screen.getByText("No Blocks on This Page")).toBeTruthy();
  });
});
