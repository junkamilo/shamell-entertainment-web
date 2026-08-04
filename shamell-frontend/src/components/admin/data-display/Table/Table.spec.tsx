/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Table } from "./Table";
import type { TableColumn } from "./table.types";

type Row = { id: string; name: string };

const columns: TableColumn<Row>[] = [
  {
    id: "name",
    header: "Name",
    cell: (row) => row.name,
  },
];

describe("Table", () => {
  it("renders headers and cells", () => {
    render(
      <Table
        columns={columns}
        rows={[{ id: "1", name: "Alpha" }]}
        getRowKey={(row) => row.id}
      />,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("returns null when rows are empty", () => {
    const { container } = render(
      <Table columns={columns} rows={[]} getRowKey={(row) => row.id} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("uses getRowKey for row identity", () => {
    const { container } = render(
      <Table
        columns={columns}
        rows={[
          { id: "a", name: "A" },
          { id: "b", name: "B" },
        ]}
        getRowKey={(row) => `key-${row.id}`}
      />,
    );
    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
  });

  it("applies embedded variant without standalone border card", () => {
    const { container } = render(
      <Table
        columns={columns}
        rows={[{ id: "1", name: "Alpha" }]}
        getRowKey={(row) => row.id}
        variant="embedded"
      />,
    );
    const shell = container.firstElementChild;
    expect(shell?.className).toContain("rounded-lg");
    expect(shell?.className).not.toContain("border-gold/14");
  });
});
