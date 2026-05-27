import type {
  StandaloneChairConfig,
  StandaloneChairInventoryItem,
} from "../types/standaloneChairs.types";
import { STANDALONE_CHAIR_DISPLAY_LABEL } from "../types/standaloneChairs.types";

function mapChairRow(data: unknown): StandaloneChairInventoryItem | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.chairName !== "string") return null;

  return {
    id: o.id,
    chairName: o.chairName,
    displayLabel:
      typeof o.displayLabel === "string" ? o.displayLabel : STANDALONE_CHAIR_DISPLAY_LABEL,
    unitPrice: Number(o.unitPrice ?? 0),
    sortOrder: Number(o.sortOrder ?? 0),
    isActive: Boolean(o.isActive ?? true),
    createdAt: String(o.createdAt ?? ""),
    updatedAt: String(o.updatedAt ?? ""),
  };
}

export function mapStandaloneChairFromApi(data: unknown): StandaloneChairConfig {
  if (!data || typeof data !== "object") {
    return {
      id: null,
      availableQuantity: 0,
      unitPrice: 0,
      updatedAt: null,
      isDefault: true,
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
    chairs,
  };
}

export function formatStandaloneChairAdminSubtitle(chair: {
  id: string;
  unitPrice: number;
}): string {
  const shortId = chair.id.replace(/-/g, "").slice(0, 6);
  return `$${chair.unitPrice} each · #${shortId}`;
}
