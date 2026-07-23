import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";

export type PeticionesLane = "bookings" | "guidance" | "private_classes";

export type UnifiedPeticionRow =
  | {
      origin: "CONTACT";
      id: string;
      createdAt: string;
      state: "PENDING" | "RESERVED" | "CANCELLED";
      hasLinkedBooking?: boolean;
      contact: ContactRequest;
    }
  | {
      origin: "BOOKING_ADMIN";
      id: string;
      createdAt: string;
      status: string;
      booking: AdminBookingRow;
      linkedContact?: ContactRequest | null;
    };

export type AdminPeticionesQuery = {
  page?: number;
  perPage?: number;
  lane?: PeticionesLane;
};

export type ConfirmDeleteState = {
  kind: "CONTACT" | "BOOKING";
  id: string;
  title: string;
  description: string;
  linkedContactId?: string;
};
