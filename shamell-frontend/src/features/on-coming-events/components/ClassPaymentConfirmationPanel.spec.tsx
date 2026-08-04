/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import { ClassPaymentConfirmationPanel } from "./ClassPaymentConfirmationPanel";

describe("ClassPaymentConfirmationPanel", () => {
  it("renders paid confirmation with home link", () => {
    renderWithProviders(
      <ClassPaymentConfirmationPanel
        status="paid"
        paidTitle="Reservation confirmed"
        paidSubtitle="Thank you for your purchase."
        sessionRows={[
          { sessionLabel: "Large 1", confirmationReference: "VR111111" },
        ]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Reservation confirmed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Large 1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
  });

  it("renders loading state", () => {
    renderWithProviders(
      <ClassPaymentConfirmationPanel
        status="loading"
        paidTitle=""
        paidSubtitle=""
      />,
    );
    expect(screen.getByText(/confirming your booking/i)).toBeInTheDocument();
  });
});
