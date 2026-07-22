"use client";

import { type Dispatch, type SetStateAction } from "react";
import type {
  CreateAdminBookingPayload,
  CreateBookingQuotePayload,
} from "@/hooks/use-admin-bookings";
import { bookingTimeZone } from "../lib/peticionesDateUtils";
import type { ConfirmDeleteState, UnifiedPeticionRow } from "../types/peticiones.types";
import { usePeticionesBookingActions } from "./usePeticionesBookingActions";
import { usePeticionesContactActions } from "./usePeticionesContactActions";

type Props = {
  unifiedRows: UnifiedPeticionRow[];
  reloadPeticiones: () => void;
  contact: {
    remove: (id: string) => Promise<unknown>;
    setStatus: (
      id: string,
      status: "PENDING" | "RESERVED" | "CANCELLED",
    ) => Promise<unknown>;
    reloadContacts: () => void;
  };
  bookings: {
    createBooking: (payload: CreateAdminBookingPayload) => Promise<unknown>;
    patchBooking: (
      id: string,
      payload: Partial<CreateAdminBookingPayload> & { status?: string },
    ) => Promise<unknown>;
    removeBooking: (
      id: string,
      options?: { purgeContact?: boolean },
    ) => Promise<void>;
    reloadBookings: () => void;
    createBookingQuote: (
      id: string,
      payload: CreateBookingQuotePayload,
    ) => Promise<unknown>;
    sendBalanceLink: (id: string) => Promise<unknown>;
  };
  catalog: {
    serviceByInquiryCode: Map<string, string>;
    eventTypeContactCodeById: Map<string, string>;
    inquiryCodeByCatalogLineId: Map<string, string>;
    fallbackServiceId?: string;
  };
  setBusyId: (id: string | null) => void;
  setReservingContactId: (id: string | null) => void;
  setExpandedId: Dispatch<SetStateAction<string | null>>;
  setConfirmDelete: (state: ConfirmDeleteState | null) => void;
  setPurgeLinkedInquiryOnDelete: (value: boolean) => void;
};

export function usePeticionesActions(props: Props) {
  const bookingTz = bookingTimeZone();

  const contactActions = usePeticionesContactActions({
    unifiedRows: props.unifiedRows,
    reloadPeticiones: props.reloadPeticiones,
    bookingTz,
    contact: props.contact,
    createBooking: props.bookings.createBooking,
    reloadBookings: props.bookings.reloadBookings,
    catalog: props.catalog,
    setBusyId: props.setBusyId,
    setReservingContactId: props.setReservingContactId,
    setExpandedId: props.setExpandedId,
    setConfirmDelete: props.setConfirmDelete,
  });

  const bookingActions = usePeticionesBookingActions({
    unifiedRows: props.unifiedRows,
    reloadPeticiones: props.reloadPeticiones,
    patchBooking: props.bookings.patchBooking,
    removeBooking: props.bookings.removeBooking,
    reloadBookings: props.bookings.reloadBookings,
    createBookingQuote: props.bookings.createBookingQuote,
    sendBalanceLink: props.bookings.sendBalanceLink,
    setBusyId: props.setBusyId,
    setExpandedId: props.setExpandedId,
    setConfirmDelete: props.setConfirmDelete,
    setPurgeLinkedInquiryOnDelete: props.setPurgeLinkedInquiryOnDelete,
  });

  return {
    bookingTz,
    ...contactActions,
    ...bookingActions,
  };
}

export type PeticionesActions = ReturnType<typeof usePeticionesActions>;
