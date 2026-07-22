export function normalizeItemsFromText(itemsText: string): string[] {
  return itemsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export type ParsePriceResult =
  | { ok: true; value: number | null }
  | { ok: false; value: null };

export function parsePriceInput(priceInput: string): ParsePriceResult {
  const t = priceInput.trim();
  if (!t) return { ok: true, value: null };
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return { ok: false, value: null };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

export type BuildServiceFormDataArgs = {
  serviceTypeId: string;
  description: string;
  items: string[];
  parsedPrice: ParsePriceResult;
  editingId: string | null;
  image: File | null;
};

export function buildServiceUpsertFormData({
  serviceTypeId,
  description,
  items,
  parsedPrice,
  editingId,
  image,
}: BuildServiceFormDataArgs): FormData {
  const formData = new FormData();
  formData.append("serviceTypeId", serviceTypeId);
  formData.append("description", description);
  items.forEach((item) => formData.append("items", item));
  if (parsedPrice.ok && parsedPrice.value !== null) {
    formData.append("price", String(parsedPrice.value));
  } else if (editingId && parsedPrice.ok && parsedPrice.value === null) {
    formData.append("price", "");
  }
  if (image) {
    formData.append("image", image);
  }
  return formData;
}
