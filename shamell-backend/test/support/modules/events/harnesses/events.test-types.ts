/** Narrow response shapes for events e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type PublicEventBody = {
  id: string;
  eventTypeName: string;
  description?: string;
  isActive?: boolean;
  showOnHome?: boolean;
};

export type PublicEventsBody = PublicEventBody[];

export type AdminEventBody = {
  message?: string;
  event?: {
    id: string;
    eventTypeId: string;
    eventTypeName: string;
    description: string;
    isActive: boolean;
  };
  id?: string;
  eventTypeName?: string;
};

export type ContactLineBody = {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  lineKind: 'event' | 'event_type';
};

export type ContactLinesBody = ContactLineBody[];

export type DeleteEventBody = {
  message: string;
};

export type EventTypeAdminBody = {
  message: string;
  eventType: {
    id: string;
    name: string;
    isActive: boolean;
  };
};

export type OccasionTypeBody = {
  id: string;
  name: string;
  isActive: boolean;
  bookingCount?: number;
  eventTypeLinkCount?: number;
};

export type OccasionTypesBody = OccasionTypeBody[];

export type OccasionTypeMutationBody = {
  message: string;
  occasionType: {
    id: string;
    name: string;
    isActive: boolean;
  };
};

export type HubEventBody = PublicEventBody & {
  hasActiveSessions?: boolean;
  salesOpen?: boolean;
  purchaseMode?: string | null;
  purchasable?: boolean;
  experienceType?: string | null;
  fixedTicketCapacity?: number;
  eventStartsAt?: string | null;
};

export type HubEventsBody = HubEventBody[];

export type AdminEventsListBody = Array<
  PublicEventBody & {
    bookingCount?: number;
    galleryPhotoCount?: number;
  }
>;
