import { AvailabilityClosureKind } from '@prisma/client';
import type { CreateClosureDto } from '../dto/create-closure.dto';
import type { UpsertWeeklySlotsDto } from '../dto/upsert-weekly-slots.dto';
import type {
  AdminAvailabilitySnapshot,
  PublicAvailabilityRules,
} from '../types/availability.types';

export function makeWeeklySlotsDto(
  overrides: Partial<UpsertWeeklySlotsDto> = {},
): UpsertWeeklySlotsDto {
  return {
    slots: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      isClosed: false,
      startTime: '09:00',
      endTime: '21:00',
    })),
    ...overrides,
  };
}

export function makeClosureDto(
  overrides: Partial<CreateClosureDto> = {},
): CreateClosureDto {
  return {
    kind: AvailabilityClosureKind.SPECIFIC_DATE,
    date: '2026-07-15',
    note: 'Holiday',
    ...overrides,
  };
}

export function makePublicRules(
  overrides: Partial<PublicAvailabilityRules> = {},
): PublicAvailabilityRules {
  return {
    timeZone: 'America/New_York',
    weekly: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      isClosed: false,
      startTime: '09:00',
      endTime: '21:00',
    })),
    closures: [],
    ...overrides,
  };
}

export function makeAdminSnapshot(
  overrides: Partial<AdminAvailabilitySnapshot> = {},
): AdminAvailabilitySnapshot {
  const now = new Date('2026-07-01T12:00:00.000Z');
  return {
    timeZone: 'America/New_York',
    weekly: Array.from({ length: 7 }, (_, weekday) => ({
      id: `w-${weekday}`,
      weekday,
      isClosed: false,
      startTime: '09:00',
      endTime: '21:00',
      updatedAt: now,
    })),
    closures: [],
    ...overrides,
  };
}

export function makeWeeklyPrismaRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'w-1',
    weekday: 1,
    isClosed: false,
    startTime: '09:00',
    endTime: '21:00',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeClosurePrismaRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c-1',
    kind: AvailabilityClosureKind.SPECIFIC_DATE,
    date: new Date('2026-07-15T12:00:00.000Z'),
    weekday: null,
    startDate: null,
    endDate: null,
    note: 'Holiday',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
