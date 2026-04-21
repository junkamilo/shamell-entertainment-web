export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  guestCount?: number;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookingCreateInput {
  clientName: string;
  clientEmail: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  guestCount?: number;
  notes?: string;
}
