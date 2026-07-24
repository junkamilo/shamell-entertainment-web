/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_USER_KEY,
} from "@/lib/adminSession";
import { AGENDA_HUB_PATH } from "@/lib/admin/routes";
import {
  createMockAdminSession,
  createMockRouter,
} from "../test/helpers/mockShell";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const pathnameMock = vi.fn(() => AGENDA_HUB_PATH);
const searchParamsGetMock = vi.fn((_key: string) => null as string | null);
const routerMock = createMockRouter();
const sessionMock = vi.fn(() => createMockAdminSession());
const fetchReservationsMock = vi.fn(async () => ({
  ok: true,
  reservations: [] as { createdAt: string }[],
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useSearchParams: () => ({ get: (key: string) => searchParamsGetMock(key) }),
  useRouter: () => routerMock,
}));

vi.mock("next/image", () => ({
  default: ({
    alt = "",
  }: {
    alt?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src="/bailarina.png" />
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
    onClick?: () => void;
    title?: string;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/admin/auth/hooks/useAdminSession", () => ({
  useAdminSession: () => sessionMock(),
}));

vi.mock("@/lib/admin/auth", () => ({
  getAdminBearerToken: () => "token-1",
}));

vi.mock("@/features/admin/venue-reservations", () => ({
  VENUE_RESERVATIONS_ADMIN_PATH: "/admin/venue-reservations",
  fetchAdminVenueReservations: (...args: unknown[]) =>
    fetchReservationsMock(...args),
}));

import { ShamellAdminShell } from "./ShamellAdminShell";

describe("ShamellAdminShell", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue(AGENDA_HUB_PATH);
    searchParamsGetMock.mockReturnValue(null);
    sessionMock.mockReturnValue(createMockAdminSession());
    fetchReservationsMock.mockResolvedValue({ ok: true, reservations: [] });
    routerMock.replace.mockClear();
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, "token-1");
    localStorage.setItem(
      ADMIN_USER_KEY,
      JSON.stringify({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
      }),
    );
  });

  it("renders brand, breadcrumbs, children, and nav links", async () => {
    renderWithProviders(
      <ShamellAdminShell>
        <div data-testid="shell-child">Dashboard body</div>
      </ShamellAdminShell>,
    );

    expect(screen.getByText("SHAMELL")).toBeInTheDocument();
    expect(screen.getByText("ADMIN PANEL")).toBeInTheDocument();
    expect(screen.getByTestId("shell-child")).toHaveTextContent(
      "Dashboard body",
    );
    expect(screen.getAllByText("ADMIN").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AGENDA").length).toBeGreaterThan(0);
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /agenda/i })[0],
    ).toHaveAttribute("href", AGENDA_HUB_PATH);
  });

  it("shows Super admin role label", async () => {
    renderWithProviders(
      <ShamellAdminShell>
        <span>child</span>
      </ShamellAdminShell>,
    );
    expect(await screen.findByText("Super admin")).toBeInTheDocument();
  });

  it("signs out and clears session", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShamellAdminShell>
        <span>child</span>
      </ShamellAdminShell>,
    );

    await user.click(screen.getByRole("button", { name: /sign out/i }));
    expect(localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(ADMIN_USER_KEY)).toBeNull();
    expect(routerMock.replace).toHaveBeenCalledWith("/");
  });

  it("redirects to login when token is missing", () => {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    renderWithProviders(
      <ShamellAdminShell>
        <span>child</span>
      </ShamellAdminShell>,
    );
    expect(routerMock.replace).toHaveBeenCalledWith("/admin/login");
  });

  it("toggles sidebar collapse on desktop control", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShamellAdminShell>
        <span>child</span>
      </ShamellAdminShell>,
    );

    const collapse = screen.getByRole("button", { name: /collapse sidebar/i });
    await user.click(collapse);
    expect(
      screen.getByRole("button", { name: /expand sidebar/i }),
    ).toBeInTheDocument();
  });
});
