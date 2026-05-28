import { parsePriceInput } from "./parseVenueTablePrice";
import type { StandaloneChairConfigPayload } from "../types/standaloneChairs.types";
import { STANDALONE_CHAIR_MAX_QUANTITY } from "../types/standaloneChairs.types";

export type BuildStandaloneChairResult =
  | { ok: true; payload: StandaloneChairConfigPayload }
  | { ok: false; errors: string[] };

export function buildStandaloneChairPayload(
  availableQuantityInput: number,
  unitPriceInput: string,
): BuildStandaloneChairResult {
  const errors: string[] = [];
  const quantity = Math.round(availableQuantityInput);
  if (!Number.isFinite(quantity) || quantity < 0 || quantity > STANDALONE_CHAIR_MAX_QUANTITY) {
    errors.push(`Quantity must be between 0 and ${STANDALONE_CHAIR_MAX_QUANTITY}.`);
  }

  const priceParsed = parsePriceInput(unitPriceInput);
  if (
    quantity > 0 &&
    (!priceParsed.ok || priceParsed.value === null)
  ) {
    errors.push("Unit price is required and must be a valid amount.");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    payload: {
      availableQuantity: quantity,
      unitPrice: quantity > 0 ? priceParsed.value! : 0,
    },
  };
}
