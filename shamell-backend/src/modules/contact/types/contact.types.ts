import type { ContactRequest, ContactRequestStatus } from '@prisma/client';
import type { PeticionesLane } from '../constants/contact.constants';

export type { PeticionesLane };

export type PeticionesFeedRow = {
  origin: 'CONTACT' | 'BOOKING_ADMIN';
  id: string;
  created_at: Date;
};

/** Always 9 keys: mirrors "Tell us your vision" form; built server-side from validated DTO. */
export type ConciergeVisionSnapshot = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  /** ISO calendar date `YYYY-MM-DD`, or null if not provided. */
  eventDate: string | null;
  occasionHint: string;
  guestCount: number | null;
  planningStage: string;
  message: string;
};

export type ContactRequestRow = ContactRequest;

export type ContactListWhere = {
  status?: ContactRequestStatus;
};
