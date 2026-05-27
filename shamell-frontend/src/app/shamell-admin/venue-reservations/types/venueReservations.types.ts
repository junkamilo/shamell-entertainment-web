export type VenueSeatReservationRow = {
  id: string;
  kind: string;
  layoutItemId: string;
  venueTableConfigId: string | null;
  tableName: string | null;
  tableSize: string | null;
  eventDate: string;
  amount: number;
  currency: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  stripeCheckoutSessionId: string;
  paidAt: string | null;
  createdAt: string;
};
