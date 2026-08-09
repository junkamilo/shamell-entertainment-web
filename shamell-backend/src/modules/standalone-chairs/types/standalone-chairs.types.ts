import type { Prisma, VenueSeatReservationStatus } from '@prisma/client';

export type StandaloneChairConfigRow = {
  id: string;
  availableQuantity: number;
  unitPrice: Prisma.Decimal | number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type StandaloneChairRow = {
  id: string;
  chairName: string;
  unitPrice: Prisma.Decimal | number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type StandaloneChairPublicListItem = {
  id: string;
  unitPrice: number;
  chairName: string;
  sortOrder: number;
  isActive: boolean;
};

export type MappedStandaloneChair = {
  id: string;
  chairName: string;
  displayLabel: string;
  unitPrice: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BlockingStandaloneChairReservation = {
  layoutItemId: string;
  status: VenueSeatReservationStatus;
};

export type StandaloneChairReservationFlags = {
  isReserved: boolean;
  reservationStatus?: 'PAID' | 'PENDING_PAYMENT';
  isOnFloorPlan: boolean;
  canDelete: boolean;
  canEditPrice: boolean;
};

export type ActiveLayoutRow = {
  id: string;
  items: Prisma.JsonValue;
};
