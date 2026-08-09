import {
  EXPERIENCE_ADDONS,
  INQUIRY_ENTRY_SOURCES,
  SOURCE_CATALOG_KINDS,
} from '../constants/booking-inquiry.constants';

export type ExperienceAddonCode = (typeof EXPERIENCE_ADDONS)[number];
export type InquiryEntrySource = (typeof INQUIRY_ENTRY_SOURCES)[number];
export type SourceCatalogKind = (typeof SOURCE_CATALOG_KINDS)[number];

export type SanitizedInquiryDetails = {
  entrySource?: InquiryEntrySource;
  /** Legacy static occasion codes (older inquiries). */
  occasionCode?: string;
  occasionOther?: string;
  eventId?: string;
  eventTypeId?: string;
  occasionTypeId?: string;
  occasionTypeIdsProject?: string[];
  occasionTypeIdsRole?: string[];
  bespokeProjectTypes?: string[];
  bespokeRoles?: string[];
  projectDeadlineNote?: string;
  experienceAddons?: ExperienceAddonCode[];
  eventTimeStart?: string;
  eventTimeEnd?: string;
  guestCount?: number;
  /** Street / venue address line from public booking form (city may still be in top-level `location`). */
  eventAddress?: string;
  /** Admin Book form: multiple catalog service row ids (order = selection); first must match booking.serviceId. */
  serviceIds?: string[];
  /** Server-enriched service type names (same order as `serviceIds`). */
  serviceLabels?: string[];
  venueIndoor?: boolean | null;
  conciergeIntent?: string;
  planningStage?: string;
  occasionHint?: string;
  visionSummary?: string;
  sourceCatalogKind?: SourceCatalogKind;
  sourceCatalogId?: string;
  sourceCatalogTitle?: string;
  /** Populated server-side before persistence / summary. */
  occasionSingleLabel?: string;
  eventTypeLabel?: string;
  bespokeProjectLabels?: string[];
  bespokeRoleLabels?: string[];
  /** Server-only: sum of Event + Service guide prices at submit time. */
  guideInvestmentTotalUsd?: number;
  /** Server-only: true if any selected catalog row lacked a guide price. */
  guideInvestmentIsPartial?: boolean;
};

export type GuideInvestmentCompute = {
  /** Sum of known guide prices (event + services); null when nothing numeric to show. */
  totalUsd: number | null;
  /** True when catalog event or at least one selected service lacks a guide price in DB. */
  isPartial: boolean;
};
