/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import {
  makeAdminBookingRow,
  makeContactRequest,
} from "../../test/fixtures/peticiones.fixture";
import PeticionesRequestCardContactBody from "./PeticionesRequestCardContactBody";

describe("PeticionesRequestCardContactBody", () => {
  it("renders contact fields", () => {
    renderWithProviders(
      <PeticionesRequestCardContactBody
        clientDisplayName="Ada Lovelace"
        clientDisplayEmail="ada@example.com"
        contact={makeContactRequest()}
        booking={null}
        bookingTz="America/New_York"
      />,
    );
    expect(screen.getByText("NAME")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("EMAIL")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("PHONE")).toBeInTheDocument();
    expect(screen.getByText("555-0100")).toBeInTheDocument();
    expect(screen.getByText("EVENT DATE")).toBeInTheDocument();
    expect(screen.getByText("CITY / VENUE")).toBeInTheDocument();
    expect(screen.getByText("Studio A")).toBeInTheDocument();
  });

  it("renders booking guest phone and location", () => {
    renderWithProviders(
      <PeticionesRequestCardContactBody
        clientDisplayName="Ada Guest"
        clientDisplayEmail="ada@example.com"
        contact={null}
        booking={makeAdminBookingRow()}
        bookingTz="America/New_York"
      />,
    );
    expect(screen.getByText("555-0100")).toBeInTheDocument();
    expect(screen.getByText("Studio A")).toBeInTheDocument();
  });
});
