import type { ContactCatalogKind, ServiceTypeCode } from "@/lib/contactInquiryConstants";

export type CatalogSnapshot = {
  kind: ContactCatalogKind;
  id: string;
  title: string;
  contactInquiryCode: string | null;
  description?: string;
  descriptionPreview?: string;
  items: string[];
  imageUrl?: string | null;
  imageMediaType?: "IMAGE" | "VIDEO";
};

export type ContactLine = {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  contactInquiryCode: string | null;
  description: string;
  items: string[];
  images: string[];
  heroImageUrl?: string | null;
  heroMediaType?: string | null;
  price?: number | null;
  lineKind?: "event" | "event_type";
  occasionSingle: { id: string; name: string }[];
  occasionBespokeProject: { id: string; name: string }[];
  occasionBespokeRole: { id: string; name: string }[];
};

export type Phase =
  | "service"
  | "detail"
  | "serviceType"
  | "experiences"
  | "logistics"
  | "expectations"
  | "contact"
  | "review";

export type ExperienceAddon = "FIRE" | "VEIL_FAN_LED" | "SWORD_CANDELABRA";

export type WizardData = {
  contactLineId: string;
  contactLineKind: "event" | "event_type";
  eventTypeId: string;
  inquiryCode: ServiceTypeCode | "";
  serviceOptionIds: string[];
  occasionTypeId: string;
  occasionTypeIdsProject: string[];
  occasionTypeIdsRole: string[];
  occasionOther: string;
  projectDeadlineNote: string;
  experienceAddons: ExperienceAddon[];
  eventDate: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  location: string;
  eventAddress: string;
  guestCount: string;
  venueIndoor: "" | "indoor" | "outdoor";
  message: string;
  fullName: string;
  email: string;
  phone: string;
};

export type ServiceSummarySnapshot = {
  id: string;
  title: string;
  contactInquiryCode: string | null;
  description?: string;
  descriptionPreview?: string;
  items: string[];
  imageUrl?: string | null;
  imageMediaType?: "IMAGE" | "VIDEO";
};

export type PublicServiceOption = {
  id: string;
  title: string;
  inquiryCode: ServiceTypeCode;
  description?: string;
  items: string[];
  imageUrl?: string | null;
  imageMediaType?: "IMAGE" | "VIDEO";
  price?: number | null;
};

export const SERVICE_OPTION_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
