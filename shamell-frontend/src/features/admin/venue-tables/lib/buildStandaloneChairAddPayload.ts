import { parsePriceInput } from "./parseVenueTablePrice";
import type { StandaloneChairConfigPayload } from "../types/standaloneChairs.types";
import { STANDALONE_CHAIR_MAX_QUANTITY } from "../types/standaloneChairs.types";

export type BuildStandaloneChairAddResult =
  | { ok: true; payload: StandaloneChairConfigPayload; addQuantity: number }
  | { ok: false; errors: string[] };

export function buildStandaloneChairAddPayload(
  currentCount: number,
  addQuantityInput: number,
  unitPriceInput: string,
): BuildStandaloneChairAddResult {
  const errors: string[] = [];
  const addQuantity = Math.round(addQuantityInput);

  if (!Number.isFinite(addQuantity) || addQuantity < 1) {
    errors.push("Quantity must be at least 1.");
  }

  const maxAdd = STANDALONE_CHAIR_MAX_QUANTITY - currentCount;
  if (addQuantity > maxAdd) {
    errors.push(
      maxAdd <= 0
        ? `Inventory is at the maximum of ${STANDALONE_CHAIR_MAX_QUANTITY} chairs.`
        : `You can add at most ${maxAdd} more chair${maxAdd === 1 ? "" : "s"}.`,
    );
  }

  const priceParsed = parsePriceInput(unitPriceInput);
  if (!priceParsed.ok || priceParsed.value === null) {
    errors.push("Unit price is required and must be a valid amount.");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    addQuantity,
    payload: {
      availableQuantity: currentCount + addQuantity,
      unitPrice: priceParsed.value!,
    },
  };
}
