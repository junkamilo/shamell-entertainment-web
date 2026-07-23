/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServiceListMediaThumb from "./ServiceListMediaThumb";

describe("ServiceListMediaThumb", () => {
  it('shows "—" when there is no url', () => {
    renderWithProviders(<ServiceListMediaThumb imageUrl={null} size="sm" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders an img for an image url", () => {
    const { container } = renderWithProviders(
      <ServiceListMediaThumb
        imageUrl="https://cdn.example.com/service.jpg"
        size="sm"
      />,
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://cdn.example.com/service.jpg",
    );
  });

  it("renders a video icon path when url looks like video", () => {
    const { container } = renderWithProviders(
      <ServiceListMediaThumb
        imageUrl="https://res.cloudinary.com/demo/video/upload/clip.mp4"
        size="sm"
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector('[title="Video"]')).toBeTruthy();
  });
});
