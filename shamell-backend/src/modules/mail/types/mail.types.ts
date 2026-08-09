export type TransactionalMailPayload = {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text: string;
};

export type SendTransactionalResult = {
  ok: boolean;
  errorText?: string;
};

export type AdminPaymentOutcome =
  | 'PAID'
  | 'DEPOSIT_PAID'
  | 'EXPIRED'
  | 'CANCELLED';

export type AdminPaymentFlowLabel =
  | 'Booking'
  | 'Venue seat'
  | 'Class'
  | 'Class package'
  | 'Same-day classes'
  | 'Fixed ticket';

export type NotifyAdminPaymentInput = {
  outcome: AdminPaymentOutcome;
  flow:
    | 'BOOKING_QUOTE'
    | 'VENUE_SEAT'
    | 'CLASS_SESSION'
    | 'CLASS_PACKAGE'
    | 'CLASS_DAY_BUNDLE'
    | 'FIXED_TICKET';
  customerName: string;
  customerEmail: string;
  amount: number;
  currency?: string;
  contextLabel: string;
  reference?: string;
  stage?: 'FULL' | 'DEPOSIT' | 'BALANCE' | null;
};

export type AdminCustomerActivityKind =
  | 'CONCIERGE_INQUIRY'
  | 'BOOKING_INQUIRY'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_QUOTE_SENT'
  | 'BOOKING_BALANCE_LINK_SENT';

export type NotifyAdminCustomerActivityInput = {
  kind: AdminCustomerActivityKind;
  customerName: string;
  customerEmail: string;
  reference?: string;
  contextLabel?: string;
  amountUsd?: string;
  detailsLines?: string[];
};
