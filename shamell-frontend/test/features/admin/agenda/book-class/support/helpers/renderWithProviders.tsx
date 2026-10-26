import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";

/** Minimal RTL wrapper for book-class component specs. */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return children;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
