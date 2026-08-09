import type {
  EventPublicSection,
  EventTypeCatalogChannel,
  EventTypeOccasionUsage,
  GalleryMediaType,
  UpcomingExperienceType,
} from '@prisma/client';

export type OccasionLinkRow = {
  usage: EventTypeOccasionUsage;
  sortOrder: number;
  occasionType: { id: string; name: string; isActive: boolean };
};

export type OccasionNamedRow = { id: string; name: string };

export type OccasionGroups = {
  occasionSingle: OccasionNamedRow[];
  occasionBespokeProject: OccasionNamedRow[];
  occasionBespokeRole: OccasionNamedRow[];
};

export type CatalogHeroFields = {
  heroImageUrl: string | null;
  heroMediaType: GalleryMediaType | null;
  heroPosterUrl: string | null;
  heroPosterUrlMobile: string | null;
};

export type MappedEventType = {
  id: string;
  name: string;
  catalogChannel?: EventTypeCatalogChannel;
  contactInquiryCode: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MappedEventTypeAdmin = MappedEventType &
  OccasionGroups & {
    occasionAssignments: Array<{
      occasionTypeId: string;
      occasionName: string;
      occasionActive: boolean;
      usage: EventTypeOccasionUsage;
      sortOrder: number;
    }>;
  };

export type MappedEvent = {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  contactInquiryCode: string | null;
  eventType: MappedEventType;
  description: string;
  items: string[];
  price: number | null;
  images: string[];
  heroImageUrl: string | null;
  heroMediaType: GalleryMediaType | null;
  heroPosterUrl: string | null;
  heroPosterUrlMobile: string | null;
  catalogImages: Array<{
    id: string;
    imageUrl: string;
    mediaType: GalleryMediaType;
  }>;
  isActive: boolean;
  showOnHome: boolean;
  publicSection: EventPublicSection;
  slug: string | null;
  experienceType: UpcomingExperienceType | null;
  classVariant: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MappedContactLine = {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  contactInquiryCode: string | null;
  description: string;
  items: string[];
  images: (string | null)[];
  heroImageUrl: string | null;
  heroMediaType: GalleryMediaType | null;
  heroPosterUrl?: string | null;
  heroPosterUrlMobile?: string | null;
  showOnHome?: boolean;
  publicSection?: EventPublicSection;
  lineKind: 'event' | 'event_type';
  price: number | null;
} & OccasionGroups;

export type EventMapInput = {
  id: string;
  eventTypeId: string;
  description: string;
  items: string[];
  price: unknown;
  isActive: boolean;
  showOnHome: boolean;
  publicSection: EventPublicSection;
  slug?: string | null;
  experienceType?: UpcomingExperienceType | null;
  classVariant?: string | null;
  createdAt: Date;
  updatedAt: Date;
  galleryPhotos?: Array<
    | { imageUrl: string }
    | { id: string; imageUrl: string; mediaType: GalleryMediaType }
  >;
  eventType: {
    id: string;
    name: string;
    contactInquiryCode: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    catalogChannel?: EventTypeCatalogChannel;
  };
};

export type ContactLineMapInput = {
  id: string;
  eventTypeId: string;
  description: string;
  items: string[];
  price: unknown;
  galleryPhotos: { imageUrl: string; mediaType: GalleryMediaType }[];
  isActive: boolean;
  showOnHome: boolean;
  publicSection: EventPublicSection;
  createdAt: Date;
  updatedAt: Date;
  eventType: {
    id: string;
    name: string;
    contactInquiryCode: string | null;
    isActive: boolean;
    occasionLinks: OccasionLinkRow[];
  };
};

export type ContactLineFromEventTypeInput = {
  id: string;
  name: string;
  contactInquiryCode: string | null;
  occasionLinks: OccasionLinkRow[];
};

export type EventTypeMapInput = {
  id: string;
  name: string;
  catalogChannel?: EventTypeCatalogChannel;
  contactInquiryCode: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EventTypeAdminMapInput = EventTypeMapInput & {
  occasionLinks: OccasionLinkRow[];
};

export type HubVenueConfigRow = {
  eventId: string;
  clientEnabled: boolean;
  fixedTicketCapacity: number | null;
  reservationOpensAt: Date | null;
  reservationClosesAt: Date | null;
  reservationEventDate: Date | null;
  reservationTimezone: string | null;
  reservationEventTemplate: { scheduleMode: string } | null;
};

export type EventDeleteGuardCounts = {
  bookingCount: number;
  seatReservationCount: number;
  classEnrollmentCount: number;
};

export type EventTypeUsageCounts = {
  eventCount: number;
  bookingCount: number;
  galleryCount: number;
};

export type OrphanEventTypeCounts = EventTypeUsageCounts & {
  occasionCount: number;
};
