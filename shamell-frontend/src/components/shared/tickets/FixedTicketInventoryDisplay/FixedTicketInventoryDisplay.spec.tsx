/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FixedTicketInventoryDisplay } from "./FixedTicketInventoryDisplay";

describe("FixedTicketInventoryDisplay", () => {
  it("shows sold-out styling and counts", () => {
    render(
      <FixedTicketInventoryDisplay
        fixedTicketCapacity={10}
        ticketsRemaining={0}
        ticketsSold={10}
        soldOut
      />,
    );
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "10 tickets for sale, 10 sold, 0 available",
    );
    expect(screen.getByText("Ticket availability")).toBeInTheDocument();
  });

  it("shows remaining and sold numbers", () => {
    render(
      <FixedTicketInventoryDisplay
        fixedTicketCapacity={20}
        ticketsRemaining={7}
        ticketsSold={13}
      />,
    );
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("uses table labels when inventoryType is table", () => {
    render(
      <FixedTicketInventoryDisplay
        fixedTicketCapacity={5}
        ticketsRemaining={2}
        inventoryType="table"
      />,
    );
    expect(screen.getByText("Table availability")).toBeInTheDocument();
    expect(screen.getByRole("status").getAttribute("aria-label")).toContain(
      "tables for sale",
    );
  });
});
