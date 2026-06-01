"use client";

import { cn } from "@/lib/utils";
import { ADMIN_TABLE_BODY_MAX_HEIGHT, type AdminTableProps } from "./adminTable.types";

/**
 * Generic admin data table (gold header, row hover). Define columns per module.
 * Wrap with `hidden lg:block` when pairing with mobile cards.
 *
 * @example
 * <AdminTable
 *   columns={[{ id: "name", header: "NAME", cell: (row) => row.name }]}
 *   rows={items}
 *   getRowKey={(row) => row.id}
 *   scrollableBody
 *   variant="embedded"
 * />
 */
export default function AdminTable<T>({
  columns,
  rows,
  getRowKey,
  tableClassName = "w-full min-w-[720px] border-collapse text-left",
  className,
  rowClassName,
  scrollableBody = false,
  bodyMaxHeight = ADMIN_TABLE_BODY_MAX_HEIGHT,
  stickyHeader = true,
  variant = "standalone",
}: AdminTableProps<T>) {
  if (rows.length === 0) return null;

  const embedded = variant === "embedded";

  const theadClassName = cn(
    scrollableBody &&
      stickyHeader &&
      cn(
        "sticky top-0 z-[1] border-b border-gold/12 shadow-[0_1px_0_rgba(197,165,90,0.14)]",
        embedded
          ? "bg-[var(--shamell-glass-fill)]"
          : "bg-shamell-surface-raised",
      ),
  );

  return (
    <div
      className={cn(
        "min-w-0 w-full max-w-full",
        embedded
          ? "overflow-hidden rounded-lg"
          : "overflow-hidden rounded-xl border border-gold/14",
        className,
      )}
    >
      <div
        className={cn(
          "min-w-0 w-full max-w-full",
          scrollableBody
            ? cn("shamell-scrollbar overflow-auto", bodyMaxHeight)
            : "overflow-x-auto",
        )}
      >
        <table className={tableClassName}>
          <thead className={theadClassName}>
            <tr className={cn(!scrollableBody && "border-b border-gold/12")}>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={getRowKey(row)}
                className={cn(
                  "border-b border-gold/8 transition hover:bg-gold/5",
                  typeof rowClassName === "function" ? rowClassName(row) : rowClassName,
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn("px-3 py-3 align-middle", col.cellClassName)}
                  >
                    {col.cell(row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
