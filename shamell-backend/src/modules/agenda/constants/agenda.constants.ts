import type { Prisma } from '@prisma/client';

export const PETICIONES_BADGE_LANES = [
  'bookings',
  'guidance',
  'private_classes',
] as const;

export type PeticionesBadgeLane = (typeof PETICIONES_BADGE_LANES)[number];

export const serviceCatalogSelect = {
  id: true,
  serviceType: { select: { name: true } },
} satisfies Prisma.ServiceSelect;

export const eventTypeCatalogSelect = {
  id: true,
  name: true,
} satisfies Prisma.EventTypeSelect;

export const occasionTypeCatalogSelect = {
  id: true,
  name: true,
} satisfies Prisma.OccasionTypeSelect;
