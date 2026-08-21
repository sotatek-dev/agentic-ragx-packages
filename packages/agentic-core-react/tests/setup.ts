import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// Polyfill browser APIs not available in jsdom
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  (globalThis as any).ResizeObserver = MockResizeObserver;
}
if (typeof globalThis.IntersectionObserver === "undefined") {
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
}
