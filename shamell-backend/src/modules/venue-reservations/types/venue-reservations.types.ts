import {
  ReservationEventScheduleMode,
  VenueSeatKind,
  VenueTableSize,
} from '@prisma/client';
import type { EmailBranding } from '../../mail/utils/email-html-branding';
import type { TemplateForDerive } from '../../reservation-event-templates/utils/reservation-event-template.util';

export type VenueConfigDateSource = {
  reservationOpensAt?: Date | null;
  reservationClosesAt?: Date | null;
  reservationEventDate?: Date | null;
  reservationEventTemplate?:
    | (TemplateForDerive & {
        scheduleMode: ReservationEventScheduleMode;
      })
    | null;
};

export type ResolveVenueSeatDisplayLabelArgs = {
  kind: VenueSeatKind;
  layoutItemId: string;
  venueTableConfigId: string | null;
  floorLayoutId?: string | null;
  venueTableConfig?: {
    id: string;
    tableName: string;
    size: VenueTableSize;
    sortOrder?: number;
  } | null;
  venueStandaloneChairId?: string | null;
};

export type VenueReservationConfirmationTemplateInput = {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  eventDate: Date;
  reservationTimezone: string;
  reservationKindLabel: 'Table' | 'Chair';
  layoutItemLabel: string;
  pdfDownloadUrl?: string;
};

export type VenueReservationPaymentRequestInput = {
  recipientName: string;
  appPublicName: string;
  frontendBaseUrl?: string;
  branding?: EmailBranding;
  reservationReference: string;
  eventLabel: string;
  seatLabel: string;
  amountUsd: string;
  payUrl: string;
};

export type VenueReservationConfirmationPdfInput = {
  appPublicName: string;
  recipientName: string;
  reservationKindLabel: 'Table' | 'Chair';
  layoutItemLabel: string;
  eventDate: Date;
  reservationTimezone: string;
};
