export type ItemLabelKind = "catalog_table" | "standalone_chair";

export type ItemLabelHeights = {
  reservedBubbleHeight: number;
  numberBubbleHeight: number;
};

/** Bubble Y offsets for placed-item HTML labels (frozen visual contract). */
export function itemLabelHeights(
  kind: ItemLabelKind,
  reserved: boolean,
): ItemLabelHeights {
  const isTable = kind === "catalog_table";
  return {
    reservedBubbleHeight: isTable ? 1.35 : 1.05,
    numberBubbleHeight: reserved
      ? isTable
        ? 0.72
        : 0.58
      : isTable
        ? 0.95
        : 0.75,
  };
}
