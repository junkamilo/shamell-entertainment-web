import { ContactRequestStatus } from '@prisma/client';
import type { CreateContactDto } from '../dto/create-contact.dto';
import type {
  ContactRequestRow,
  PeticionesFeedRow,
} from '../types/contact.types';

const NOW = new Date('2026-06-01T12:00:00.000Z');

export function makeCreateContactDto(
  overrides: Partial<CreateContactDto> = {},
): CreateContactDto {
  return {
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+15551234567',
    message: 'Looking for a private performance.',
    ...overrides,
  };
}

export function makeContactRequestRow(
  overrides: Partial<ContactRequestRow> = {},
): ContactRequestRow {
  return {
    id: 'contact-1',
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+15551234567',
    eventDate: null,
    location: null,
    serviceType: null,
    preferences: null,
    subject: 'Reservation inquiry',
    message: 'Looking for a private performance.',
    inquiryDetails: null,
    conciergeVisionSnapshot: null,
    isRead: false,
    status: ContactRequestStatus.PENDING,
    createdAt: NOW,
    ...overrides,
  };
}

export function makePeticionesFeedRow(
  overrides: Partial<PeticionesFeedRow> = {},
): PeticionesFeedRow {
  return {
    origin: 'CONTACT',
    id: 'contact-1',
    created_at: NOW,
    ...overrides,
  };
}

export function makeBadgeQuery(
  overrides: { since?: number; lane?: string } = {},
) {
  return {
    since: undefined as number | undefined,
    lane: undefined as string | undefined,
    ...overrides,
  };
}
