export type BookClassKind = "private" | "group";

export type PrivateClassPaymentMethod = "stripe" | "cash";

export type PrivateClassFormFields = {
  classType: string;
  eventDate: string;
  eventTimeStart: string;
  location: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  amountUsd: string;
  paymentMethod: PrivateClassPaymentMethod;
  cashConfirmed: boolean;
};

export type CreatePrivateClassBookingBody = {
  classType: string;
  eventDate: string;
  eventTimeStart: string;
  location: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  amountUsd: number;
};

export type PrivateClassBookingDetails = {
  kind: "private_class";
  classType: string;
  eventTimeStart: string;
  location: string;
  paymentMethod: PrivateClassPaymentMethod;
  amountUsd: number;
  currency: "usd";
  submittedAt: string;
  source: "admin_book_class_private";
};
