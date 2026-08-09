import { randomUUID } from 'crypto';

export const STANDALONE_CHAIR_DISPLAY_LABEL = 'Chair';

/** Unique technical slug stored in DB; not shown to end users. */
export function buildTechnicalChairName(id: string): string {
  const shortId = id.replace(/-/g, '').slice(0, 8).toLowerCase();
  return `CHAIR-${shortId}`;
}

export type TechnicalChairNameEntry = {
  id: string;
  chairName: string;
};

export function generateTechnicalChairNameEntries(
  quantity: number,
): TechnicalChairNameEntry[] {
  return Array.from({ length: quantity }, () => {
    const id = randomUUID();
    return {
      id,
      chairName: buildTechnicalChairName(id),
    };
  });
}
