import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";
import "./mockR3fJsxAsDom";
import "./mockHtmlCanvasGetContext";

if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

const NEXT_LINK_ONLY_PROPS = new Set([
  "prefetch",
  "replace",
  "scroll",
  "shallow",
  "locale",
  "passHref",
  "legacyBehavior",
  "as",
]);

vi.mock("next/link", () => ({
  default: (props: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const { href, children, ...rest } = props;
    const domProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (NEXT_LINK_ONLY_PROPS.has(key)) continue;
      domProps[key] = value;
    }
    return React.createElement("a", { href, ...domProps }, children);
  },
}));

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
