/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@react-three/drei", () => ({
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drei-html">{children}</div>
  ),
}));

import ReservationSpeechBubble from "./ReservationSpeechBubble";

describe("ReservationSpeechBubble", () => {
  it("renders reserved copy", () => {
    render(<ReservationSpeechBubble height={1.1} />);
    expect(screen.getByText("Reserved")).toBeInTheDocument();
  });
});
