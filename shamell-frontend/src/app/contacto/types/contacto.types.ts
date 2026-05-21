import type { ContactCatalogKind, InquiryEntrySource, ServiceTypeCode } from "@/lib/contactInquiryConstants";

export type { ContactLine } from "../lib/inquiry/wizardTypes";

export type ContactInquiryFormProps = {
  initialServiceType?: ServiceTypeCode;
  hadServiceTypeInUrl?: boolean;
  initialEventId?: string;
  hadEventIdInUrl?: boolean;
  entrySource?: InquiryEntrySource;
  initialCatalog?: { kind: ContactCatalogKind; id: string };
};

export type ConciergeFormData = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  eventDate: string;
  occasionHint: string;
  guestCount: string;
  planningStage: string;
  message: string;
};
