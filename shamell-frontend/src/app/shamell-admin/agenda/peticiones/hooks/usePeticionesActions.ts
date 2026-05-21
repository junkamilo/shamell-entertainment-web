"use client";

import { type Dispatch, type SetStateAction, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { AdminBookingRow, CreateAdminBookingPayload } from "@/hooks/use-admin-bookings";
import {
  buildAdminBookingPayloadFromContactRequest,
  buildContactInboxAgendarHref,
} from "@/lib/contactRequestBooking";
import { toast } from "@/hooks/use-toast";
import { contactIsConciergeInquiry } from "../lib/peticionesContactUtils";
import { bookingTimeZone } from "../lib/peticionesDateUtils";
import type { ConfirmDeleteState, UnifiedPeticionRow } from "../types/peticiones.types";

type Props = {
  unifiedRows: UnifiedPeticionRow[];
  reloadPeticiones: () => void;
  contact: {
    remove: (id: string) => Promise<unknown>;
    setStatus: (id: string, status: "PENDING" | "RESERVED" | "CANCELLED") => Promise<unknown>;
    reloadContacts: () => void;
  };
  bookings: {
    createBooking: (payload: CreateAdminBookingPayload) => Promise<unknown>;
    patchBooking: (
      id: string,
      payload: Partial<CreateAdminBookingPayload> & { status?: string },
    ) => Promise<unknown>;
    removeBooking: (id: string, options?: { purgeContact?: boolean }) => Promise<void>;
    reloadBookings: () => void;
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

export function usePeticionesActions({
  unifiedRows,
  reloadPeticiones,
  contact,
  bookings,
  catalog,
  setBusyId,
  setReservingContactId,
  setExpandedId,
  setConfirmDelete,
  setPurgeLinkedInquiryOnDelete,
}: Props) {
  const router = useRouter();
  const bookingTz = bookingTimeZone();

  const onReserveFromContact = useCallback(
    async (row: ContactRequest) => {
      if (contactIsConciergeInquiry(row)) {
        router.push(
          buildContactInboxAgendarHref(row, {
            serviceByInquiryCode: catalog.serviceByInquiryCode,
            eventTypeContactCodeById: catalog.eventTypeContactCodeById,
            inquiryCodeByCatalogLineId: catalog.inquiryCodeByCatalogLineId,
            fallbackServiceId: catalog.fallbackServiceId,
          }),
        );
        return;
      }

      const built = buildAdminBookingPayloadFromContactRequest(
        row,
        catalog.serviceByInquiryCode,
        bookingTz,
        catalog.eventTypeContactCodeById,
        catalog.inquiryCodeByCatalogLineId,
        catalog.fallbackServiceId,
      );
      if (!built.ok) {
        toast({
          title: "Cannot create booking automatically",
          description: built.error,
          variant: "destructive",
        });
        return;
      }
      setReservingContactId(row.id);
      try {
        await bookings.createBooking({ ...built.payload, contactRequestId: row.id });
        await contact.setStatus(row.id, "RESERVED");
        toast({
          title: "Booking created",
          description: "The booking was saved from this request (source: contact).",
        });
        contact.reloadContacts();
        bookings.reloadBookings();
        reloadPeticiones();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Try again or open Book to enter it manually.";
        toast({
          title: message.includes("already has a calendar booking")
            ? "Booking already exists"
            : "Could not create booking",
          description: message,
          variant: "destructive",
        });
      } finally {
        setReservingContactId(null);
      }
    },
    [bookingTz, bookings, catalog, contact, reloadPeticiones, router, setReservingContactId],
  );

  const onCancelContact = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await contact.setStatus(id, "CANCELLED");
        toast({ title: "Request canceled" });
        contact.reloadContacts();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [contact, reloadPeticiones, setBusyId],
  );

  const onRemove = useCallback(
    (id: string) => {
      const row = unifiedRows.find((r) => r.origin === "CONTACT" && r.id === id);
      const state = row?.origin === "CONTACT" ? row.state : "PENDING";
      if (state !== "CANCELLED") {
        toast({
          title: "Action not allowed",
          description: "You can only delete a request after it has been canceled.",
          variant: "destructive",
        });
        return;
      }
      setConfirmDelete({
        kind: "CONTACT",
        id,
        title: "Delete request",
        description: "This will permanently delete the request.",
      });
    },
    [setConfirmDelete, unifiedRows],
  );

  const confirmRemoveContact = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await contact.remove(id);
        setExpandedId((cur) => (cur === id ? null : cur));
        toast({ title: "Request deleted" });
        contact.reloadContacts();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [contact, reloadPeticiones, setBusyId, setExpandedId],
  );

  const onCancelBooking = useCallback(
    async (row: AdminBookingRow) => {
      if (row.status === "CANCELLED") return;
      setBusyId(row.id);
      try {
        await bookings.patchBooking(row.id, { status: "CANCELLED" });
        toast({ title: "Booking canceled" });
        bookings.reloadBookings();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [bookings, reloadPeticiones, setBusyId],
  );

  const onRemoveBooking = useCallback(
    (row: AdminBookingRow) => {
      if (row.status !== "CANCELLED") {
        toast({
          title: "Action not allowed",
          description: "You can only delete a booking after it has been canceled.",
          variant: "destructive",
        });
        return;
      }
      const unified = unifiedRows.find(
        (r) => r.origin === "BOOKING_ADMIN" && r.booking.id === row.id,
      );
      const linkedContactId =
        unified?.origin === "BOOKING_ADMIN" ? unified.linkedContact?.id : undefined;
      setPurgeLinkedInquiryOnDelete(Boolean(linkedContactId));
      setConfirmDelete({
        kind: "BOOKING",
        id: row.id,
        linkedContactId,
        title: "Delete canceled booking",
        description: linkedContactId
          ? "This will permanently delete the canceled booking. You can also remove the linked inquiry so it does not reappear in the inbox."
          : "This will permanently delete the canceled booking.",
      });
    },
    [setConfirmDelete, setPurgeLinkedInquiryOnDelete, unifiedRows],
  );

  const confirmRemoveBooking = useCallback(
    async (id: string, linkedContactId?: string, purgeLinked?: boolean) => {
      setBusyId(id);
      try {
        await bookings.removeBooking(id, {
          purgeContact: Boolean(purgeLinked && linkedContactId),
        });
        setExpandedId((cur) => (cur === id ? null : cur));
        toast({ title: "Booking deleted" });
        bookings.reloadBookings();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [bookings, reloadPeticiones, setBusyId, setExpandedId],
  );

  return {
    bookingTz,
    onReserveFromContact,
    onCancelContact,
    onRemove,
    confirmRemoveContact,
    onCancelBooking,
    onRemoveBooking,
    confirmRemoveBooking,
  };
}
