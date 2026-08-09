import { VenueTableSize } from '@prisma/client';

export const VENUE_TABLE_SIZES: VenueTableSize[] = [
  VenueTableSize.LARGE,
  VenueTableSize.MEDIUM,
  VenueTableSize.SMALL,
];

export const CHAIR_LIMITS: Record<
  VenueTableSize,
  { min: number; max: number; default: number }
> = {
  [VenueTableSize.SMALL]: { min: 2, max: 4, default: 3 },
  [VenueTableSize.MEDIUM]: { min: 3, max: 6, default: 4 },
  [VenueTableSize.LARGE]: { min: 4, max: 8, default: 6 },
};

export function clampChairsForSize(
  size: VenueTableSize,
  chairs: number,
): number {
  const { min, max, default: def } = CHAIR_LIMITS[size];
  if (!Number.isFinite(chairs)) return def;
  return Math.min(max, Math.max(min, Math.round(chairs)));
}
