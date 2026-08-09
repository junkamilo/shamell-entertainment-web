import type { Prisma, VenueTableSize } from '@prisma/client';

export type TechnicalTableNameEntry = {
  id: string;
  tableName: string;
};

export type MappedVenueTable = {
  id: string;
  tableName: string;
  displayLabel: string;
  size: VenueTableSize;
  includedChairs: number;
  bundlePrice: number;
  visualCoordinates: { x: number; y: number } | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type VenueTableConfigRow = {
  id: string;
  tableName: string;
  size: VenueTableSize;
  includedChairs: number;
  bundlePrice: Prisma.Decimal | number;
  visualX: number | null;
  visualY: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};
