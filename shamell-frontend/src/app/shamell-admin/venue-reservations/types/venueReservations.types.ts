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
  paymentChannel: "STRIPE" | "CASH";
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  stripeCheckoutSessionId: string | null;
  paidAt: string | null;
  createdAt: string;
};
