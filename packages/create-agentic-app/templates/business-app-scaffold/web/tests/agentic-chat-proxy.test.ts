/**
 * Tests for the agentic-chat proxy route.
 *
 * Validates env-var gating, input parsing, SSE stream proxying,
 * and AgenticHttpError-to-HTTP-status mapping.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @sota-agentic-ragx/agentic-core-sdk before importing the route
const mockInvokeStream = vi.fn();

vi.mock("@sota-agentic-ragx/agentic-core-sdk", () => {
  return {
    AgenticCoreClient: vi.fn().mockImplementation(() => ({
      agents: { invokeStream: mockInvokeStream },
    })),
    AgenticHttpError: class AgenticHttpError extends Error {
      statusCode: number;
      detail: string;
      constructor(statusCode: number, detail: string) {
        super(`Agentic Core API error ${statusCode}: ${detail}`);
        this.name = "AgenticHttpError";
        this.statusCode = statusCode;
        this.detail = detail;
      }
    },
  };
});

// We test the route handler logic by importing dynamically after env setup.
// Next.js route handlers are plain functions; we mock NextRequest/NextResponse.

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/agentic-chat/test-agent/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("agentic-chat proxy", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("returns 500 when AGENTIC_CORE_BASE_URL is missing", async () => {
    delete process.env.AGENTIC_CORE_BASE_URL;
    process.env.AGENTIC_CORE_API_KEY = "test-key";

    // Dynamic import to pick up env
    const { POST } = await import(
      "../app/api/agentic-chat/[agentId]/message/route"
    );

    const req = makeRequest({ message: "hello" });
    const ctx = { params: Promise.resolve({ agentId: "test-agent" }) };
    const res = await POST(req as any, ctx);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.detail).toBe("Server configuration error");
  });

  it("returns 500 when AGENTIC_CORE_API_KEY is missing", async () => {
    process.env.AGENTIC_CORE_BASE_URL = "http://core:8000";
    delete process.env.AGENTIC_CORE_API_KEY;

    const { POST } = await import(
      "../app/api/agentic-chat/[agentId]/message/route"
    );

    const req = makeRequest({ message: "hello" });
    const ctx = { params: Promise.resolve({ agentId: "test-agent" }) };
    const res = await POST(req as any, ctx);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.detail).toBe("Server configuration error");
  });

  it("returns 400 for invalid JSON body", async () => {
    process.env.AGENTIC_CORE_BASE_URL = "http://core:8000";
    process.env.AGENTIC_CORE_API_KEY = "test-key";

    const { POST } = await import(
      "../app/api/agentic-chat/[agentId]/message/route"
    );

    const req = new Request(
      "http://localhost/api/agentic-chat/test-agent/message",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      },
    );
    const ctx = { params: Promise.resolve({ agentId: "test-agent" }) };
    const res = await POST(req as any, ctx);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.detail).toBe("Invalid JSON");
  });

  it("proxies SSE stream on success", async () => {
    process.env.AGENTIC_CORE_BASE_URL = "http://core:8000";
    process.env.AGENTIC_CORE_API_KEY = "test-key";

    async function* fakeEvents() {
      yield { type: "token", delta: "hello" };
      yield { type: "done" };
    }

    mockInvokeStream.mockResolvedValue({
      events: fakeEvents(),
      conversationId: "conv-123",
    });

    const { POST } = await import(
      "../app/api/agentic-chat/[agentId]/message/route"
    );

    const req = makeRequest({ message: "test question" });
    const ctx = { params: Promise.resolve({ agentId: "test-agent" }) };
    const res = await POST(req as any, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("X-Conversation-Id")).toBe("conv-123");

    // Read the SSE stream
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value, { stream: true }));
    }
    const output = chunks.join("");
    expect(output).toContain("event: token");
    expect(output).toContain('"delta":"hello"');
    expect(output).toContain("event: done");
  });

  it("maps AgenticHttpError 401 to 401 response", async () => {
    process.env.AGENTIC_CORE_BASE_URL = "http://core:8000";
    process.env.AGENTIC_CORE_API_KEY = "test-key";

    const { AgenticHttpError } = await import("@sota-agentic-ragx/agentic-core-sdk");
    mockInvokeStream.mockRejectedValue(
      new (AgenticHttpError as any)(401, "Unauthorized"),
    );

    const { POST } = await import(
      "../app/api/agentic-chat/[agentId]/message/route"
    );

    const req = makeRequest({ message: "test" });
    const ctx = { params: Promise.resolve({ agentId: "test-agent" }) };
    const res = await POST(req as any, ctx);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.detail).toBe("Unauthorized");
  });

  it("maps AgenticHttpError 404 to 404 response", async () => {
    process.env.AGENTIC_CORE_BASE_URL = "http://core:8000";
    process.env.AGENTIC_CORE_API_KEY = "test-key";

    const { AgenticHttpError } = await import("@sota-agentic-ragx/agentic-core-sdk");
    mockInvokeStream.mockRejectedValue(
      new (AgenticHttpError as any)(404, "Not found"),
    );

    const { POST } = await import(
      "../app/api/agentic-chat/[agentId]/message/route"
    );

    const req = makeRequest({ message: "test" });
    const ctx = { params: Promise.resolve({ agentId: "test-agent" }) };
    const res = await POST(req as any, ctx);

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.detail).toBe("Agent not found");
  });

  it("maps AgenticHttpError 429 to 429 response", async () => {
    process.env.AGENTIC_CORE_BASE_URL = "http://core:8000";
    process.env.AGENTIC_CORE_API_KEY = "test-key";

    const { AgenticHttpError } = await import("@sota-agentic-ragx/agentic-core-sdk");
    mockInvokeStream.mockRejectedValue(
      new (AgenticHttpError as any)(429, "Rate limited"),
    );

    const { POST } = await import(
      "../app/api/agentic-chat/[agentId]/message/route"
    );

    const req = makeRequest({ message: "test" });
    const ctx = { params: Promise.resolve({ agentId: "test-agent" }) };
    const res = await POST(req as any, ctx);

    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.detail).toBe("Rate limit exceeded");
  });

  it("returns 500 for unknown errors", async () => {
    process.env.AGENTIC_CORE_BASE_URL = "http://core:8000";
    process.env.AGENTIC_CORE_API_KEY = "test-key";

    mockInvokeStream.mockRejectedValue(new Error("something broke"));

    const { POST } = await import(
      "../app/api/agentic-chat/[agentId]/message/route"
    );

    const req = makeRequest({ message: "test" });
    const ctx = { params: Promise.resolve({ agentId: "test-agent" }) };
    const res = await POST(req as any, ctx);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.detail).toBe("Internal server error");
  });
});
