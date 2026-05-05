/** Aligns with contact form `serviceType` / CreateContactDto. */
export const CONTACT_INQUIRY_CODES = ['PRIVATE_GALA', 'VIP_EVENT', 'BESPOKE', 'GENERAL'] as const;

export type ContactInquiryCode = (typeof CONTACT_INQUIRY_CODES)[number];
