/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { FIXTURE_EVENT_SLUG } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

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

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockVenueScene3D() {
      return <div data-testid="venue-scene-3d">Venue scene</div>;
    },
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="site-footer" />,
}));

vi.mock("@/components/venue-3d", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/venue-3d")>();
  return {
    ...actual,
    useVenueSceneLayout: () => ({
      bucket: "phone",
      perfProfile: "mobile",
      viewportHeight: 480,
      viewportMinHeight: 280,
      isCoarsePointer: false,
      isPhone: true,
      isTablet: false,
      isLaptop: false,
      isTv: false,
      dpr: 1,
      chromeCss: "14rem",
    }),
  };
});

vi.mock("@/hooks/use-has-mounted", () => ({
  useHasMounted: () => true,
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import VenueLayoutPublicPage from "./VenueLayoutPublicPage";

describe("VenueLayoutPublicPage", () => {
  it("loads floor plan and renders 3D scene stub", async () => {
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });
});
