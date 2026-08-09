export const EXPERIENCE_ADDONS = [
  'FIRE',
  'VEIL_FAN_LED',
  'SWORD_CANDELABRA',
] as const;

export const INQUIRY_ENTRY_SOURCES = [
  'contact_page',
  'home_service_card',
  'inquire_section',
  'concierge_gate',
] as const;

export type InquiryEntrySource = (typeof INQUIRY_ENTRY_SOURCES)[number];

/** Public booking-inquiry wizard (`ContactInquiryForm`); excludes concierge-only flow. */
export const BOOKING_INQUIRY_ENTRY_SOURCES = INQUIRY_ENTRY_SOURCES.filter(
  (s): s is Exclude<InquiryEntrySource, 'concierge_gate'> =>
    s !== 'concierge_gate',
);

export const SOURCE_CATALOG_KINDS = ['service', 'event'] as const;
