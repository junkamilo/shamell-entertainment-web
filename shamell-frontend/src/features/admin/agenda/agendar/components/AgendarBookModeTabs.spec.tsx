/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgendarBookModeTabs } from "./AgendarBookModeTabs";

describe("AgendarBookModeTabs", () => {
  it("renders nothing when the class tab is hidden", () => {
    const { container } = render(
      <AgendarBookModeTabs activeMode="event" onModeChange={vi.fn()} showClassTab={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("switches between event and private class", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(
      <AgendarBookModeTabs activeMode="event" onModeChange={onModeChange} showClassTab />,
    );

    expect(screen.getByTestId("agendar-tab-event")).toHaveTextContent(/^BOOK$/);
    expect(screen.getByTestId("agendar-tab-class")).toHaveTextContent(/^BOOK PRIVATE CLASS$/);

    await user.click(screen.getByTestId("agendar-tab-class"));
    expect(onModeChange).toHaveBeenCalledWith("class");

    await user.click(screen.getByTestId("agendar-tab-event"));
    expect(onModeChange).toHaveBeenCalledWith("event");
  });
});
