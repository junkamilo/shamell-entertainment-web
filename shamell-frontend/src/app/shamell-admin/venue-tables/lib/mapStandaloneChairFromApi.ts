import type { StandaloneChairInventoryItem } from "../types/standaloneChairs.types";

function mapChairRow(data: unknown): StandaloneChairInventoryItem | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.id !== "string") return null;

  const reservationStatus =
    o.reservationStatus === "PAID" || o.reservationStatus === "PENDING_PAYMENT"
      ? o.reservationStatus
      : undefined;

  return {
    id: o.id,
    chairName: typeof o.chairName === "string" ? o.chairName : "Chair",
    displayLabel:
      typeof o.displayLabel === "string" ? o.displayLabel : "Chair",
    unitPrice: Number(o.unitPrice ?? 0),
    sortOrder: Number(o.sortOrder ?? 0),
    isActive: Boolean(o.isActive ?? true),
    createdAt: String(o.createdAt ?? ""),
    updatedAt: String(o.updatedAt ?? ""),
    isReserved: Boolean(o.isReserved),
    reservationStatus,
    isOnFloorPlan: Boolean(o.isOnFloorPlan),
    canDelete: o.canDelete !== false,
    canEditPrice: o.canEditPrice !== false,
  };
}

export function mapStandaloneChairFromApi(data: unknown): import("../types/standaloneChairs.types").StandaloneChairConfig {
  if (!data || typeof data !== "object") {
    return {
      id: null,
      availableQuantity: 0,
      unitPrice: 0,
      updatedAt: null,
      isDefault: true,
      reservedCount: 0,
      totalCount: 0,
      chairs: [],
    };
  }

  const o = data as Record<string, unknown>;
  const chairs = Array.isArray(o.chairs)
    ? o.chairs
        .map((row) => mapChairRow(row))
        .filter((row): row is StandaloneChairInventoryItem => row !== null)
    : [];

  return {
    id: typeof o.id === "string" ? o.id : null,
    availableQuantity: Number(o.availableQuantity ?? 0),
    unitPrice: Number(o.unitPrice ?? 0),
    updatedAt: o.updatedAt != null ? String(o.updatedAt) : null,
    isDefault: Boolean(o.isDefault ?? false),
    reservedCount: Number(o.reservedCount ?? 0),
    totalCount: Number(o.totalCount ?? chairs.length),
    chairs,
  };
}

export function formatStandaloneChairShortId(id: string): string {
  return `#${id.replace(/-/g, "").slice(0, 6)}`;
}

export function formatStandaloneChairAdminSubtitle(chair: {
  id: string;
  unitPrice: number;
}): string {
  const shortId = chair.id.replace(/-/g, "").slice(0, 6);
  return `$${chair.unitPrice} each · #${shortId}`;
}
