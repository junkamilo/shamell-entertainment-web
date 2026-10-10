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
    recaptchaToken: 'test-recaptcha-token-ok-xx',
    ...overrides,
  };
}

export function makeConciergeCreateContactDto(
  overrides: Partial<CreateContactDto> = {},
): CreateContactDto {
  const { inquiryDetails, ...rest } = overrides;
  return makeCreateContactDto({
    phone: '+15551234567',
    location: 'Miami',
    eventDate: '2030-08-01',
    subject: 'Concierge inquiry - client needs guidance',
    inquiryDetails: {
      entrySource: 'concierge_gate',
      conciergeIntent: 'needs_guidance',
      guestCount: 12,
      planningStage: 'EARLY_IDEA',
      ...(inquiryDetails ?? {}),
    },
    emailVerificationToken: 'a'.repeat(40),
    ...rest,
  });
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
