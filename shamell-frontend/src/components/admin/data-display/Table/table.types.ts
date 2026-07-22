import type { ReactNode } from "react";

export type TableColumn<T> = {
  id: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  cell: (row: T, rowIndex: number) => ReactNode;
};

/** Default max height for in-table body scroll (~6–7 rows visible). */
export const TABLE_BODY_MAX_HEIGHT = "max-h-[26rem]";

/** @deprecated Prefer TABLE_BODY_MAX_HEIGHT */
export const ADMIN_TABLE_BODY_MAX_HEIGHT = TABLE_BODY_MAX_HEIGHT;

export type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Applied to `<table>` (default includes horizontal min-width). */
  tableClassName?: string;
  className?: string;
  rowClassName?: string | ((row: T) => string);
  /** Vertical scroll inside the table shell (Shamell scrollbar). */
  scrollableBody?: boolean;
  bodyMaxHeight?: string;
  /** Sticky header when `scrollableBody` is true (default true). */
  stickyHeader?: boolean;
  /**
   * `embedded`: inside a `shamell-glass-surface` section (no extra outer border).
   * `standalone`: own bordered card (default).
   */
  variant?: "standalone" | "embedded";
};
