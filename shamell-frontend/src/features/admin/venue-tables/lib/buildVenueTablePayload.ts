import { parsePriceInput } from "./parseVenueTablePrice";
import { clampChairsForSize } from "./tableSizeConfig";
import type {
  BulkVenueTablePayload,
  TableSize,
  VenueTableConfigPayload,
  VisualCoordinates,
} from "../types/venueTables.types";
import { BULK_TABLE_MAX_QUANTITY } from "../types/venueTables.types";

export type BuildPayloadInput = {
  size: TableSize;
  includedChairs: number;
  bundlePriceInput: string;
  visualCoordinates?: VisualCoordinates | null;
  isActive?: boolean;
};

export type BuildPayloadResult =
  | { ok: true; payload: VenueTableConfigPayload }
  | { ok: false; errors: string[] };

export function buildVenueTablePayload(
  input: BuildPayloadInput,
): BuildPayloadResult {
  const errors: string[] = [];
  const includedChairs = clampChairsForSize(input.size, input.includedChairs);
  const bundleParsed = parsePriceInput(input.bundlePriceInput);

  if (!bundleParsed.ok || bundleParsed.value === null) {
    errors.push("Bundle price is required and must be a valid amount.");
  }

  if (errors.length > 0) return { ok: false, errors };

  const payload: VenueTableConfigPayload = {
    size: input.size,
    includedChairs,
    bundlePrice: bundleParsed.value!,
    isActive: input.isActive ?? true,
  };

  if (input.visualCoordinates) {
    payload.visualX = input.visualCoordinates.x;
    payload.visualY = input.visualCoordinates.y;
  }

  return { ok: true, payload };
}

export type BuildBulkPayloadInput = {
  quantity: number;
  size: TableSize;
  includedChairs: number;
  bundlePriceInput: string;
};

export type BuildBulkPayloadResult =
  | { ok: true; payload: BulkVenueTablePayload }
  | { ok: false; errors: string[] };

export function buildBulkVenueTablePayload(
  input: BuildBulkPayloadInput,
): BuildBulkPayloadResult {
  const errors: string[] = [];

  const quantity = Math.round(input.quantity);
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > BULK_TABLE_MAX_QUANTITY) {
    errors.push(`Quantity must be between 1 and ${BULK_TABLE_MAX_QUANTITY}.`);
  }

  const includedChairs = clampChairsForSize(input.size, input.includedChairs);
  const bundleParsed = parsePriceInput(input.bundlePriceInput);

  if (!bundleParsed.ok || bundleParsed.value === null) {
    errors.push("Bundle price is required and must be a valid amount.");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    payload: {
      quantity,
      size: input.size,
      includedChairs,
      bundlePrice: bundleParsed.value!,
    },
  };
}
