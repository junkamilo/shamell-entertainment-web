/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/shared/ShamellBusyOverlay", () => ({
  default: ({
    active,
    title,
  }: {
    active: boolean;
    title: string;
  }) => (active ? <div data-testid="busy-overlay">{title}</div> : null),
}));

import InquirySubmitFeedbackLayer from "./InquirySubmitFeedbackLayer";

describe("InquirySubmitFeedbackLayer", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when idle", () => {
    renderWithProviders(
      <InquirySubmitFeedbackLayer phase="idle" onAccept={vi.fn()} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows busy overlay while sending", async () => {
    renderWithProviders(
      <InquirySubmitFeedbackLayer phase="sending" onAccept={vi.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("busy-overlay")).toHaveTextContent(
        "Sending your request",
      );
    });
  });

  it("shows success dialog and auto-redirects after delay", async () => {
    const onAccept = vi.fn();
    renderWithProviders(
      <InquirySubmitFeedbackLayer phase="done" onAccept={onAccept} />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Request received" }),
      ).toBeInTheDocument();
    });
    vi.advanceTimersByTime(10_000);
    expect(onAccept).toHaveBeenCalled();
  });

  it("calls onAccept when Accept is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onAccept = vi.fn();
    renderWithProviders(
      <InquirySubmitFeedbackLayer phase="done" onAccept={onAccept} />,
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(onAccept).toHaveBeenCalled();
  });
});
