/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/services/support/helpers/renderWithProviders";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import ServicesNoTypesBanner from "@/features/admin/services/components/ServicesNoTypesBanner";

describe("ServicesNoTypesBanner", () => {
  it("links Go to service types to /admin/service-types", () => {
    renderWithProviders(<ServicesNoTypesBanner />);

    expect(
      screen.getByRole("link", { name: "Go to service types" }),
    ).toHaveAttribute("href", "/admin/service-types");
  });
});
