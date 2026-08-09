export const BOOKING_INQUIRY_DEDUPE_MS = 15 * 60 * 1000;

export const PETICIONES_LANES = [
  'bookings',
  'guidance',
  'private_classes',
] as const;

export type PeticionesLane = (typeof PETICIONES_LANES)[number];

export function resolvePeticionesLane(raw?: string): PeticionesLane {
  if (raw === 'guidance') return 'guidance';
  if (raw === 'private_classes') return 'private_classes';
  return 'bookings';
}
