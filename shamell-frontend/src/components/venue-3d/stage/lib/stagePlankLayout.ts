export type StagePlankSlot = {
  x: number;
};

export type StagePlankLayout = {
  plankWidth: number;
  planks: StagePlankSlot[];
};

/** Pure layout for stage top planks (frozen visual math). */
export function stagePlankLayout(
  stageWidth: number,
  plankCount: number,
  plankGap: number,
): StagePlankLayout {
  const plankWidth =
    (stageWidth - plankGap * (plankCount - 1)) / plankCount;
  const planks = Array.from({ length: plankCount }, (_, i) => ({
    x: plankWidth / 2 + i * (plankWidth + plankGap),
  }));
  return { plankWidth, planks };
}
