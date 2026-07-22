"use client";

import { type Dispatch, type SetStateAction, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { CreateAdminBookingPayload } from "@/hooks/use-admin-bookings";
import {
  buildAdminBookingPayloadFromContactRequest,
  buildContactInboxAgendarHref,
} from "@/lib/contactRequestBooking";
import { toast } from "@/hooks/use-toast";
import { contactIsConciergeInquiry } from "../lib/peticionesContactUtils";
import type { UnifiedPeticionRow } from "../types/peticiones.types";

type Props = {
  unifiedRows: UnifiedPeticionRow[];
  reloadPeticiones: () => void;
  bookingTz: string;
  contact: {
    remove: (id: string) => Promise<unknown>;
    setStatus: (
      id: string,
      status: "PENDING" | "RESERVED" | "CANCELLED",
    ) => Promise<unknown>;
    reloadContacts: () => void;
  };
  createBooking: (payload: CreateAdminBookingPayload) => Promise<unknown>;
  reloadBookings: () => void;
  catalog: {
    serviceByInquiryCode: Map<string, string>;
    eventTypeContactCodeById: Map<string, string>;
    inquiryCodeByCatalogLineId: Map<string, string>;
    fallbackServiceId?: string;
  };
  setBusyId: (id: string | null) => void;
  setReservingContactId: (id: string | null) => void;
  setExpandedId: Dispatch<SetStateAction<string | null>>;
  setConfirmDelete: (state: {
    kind: "CONTACT";
    id: string;
    title: string;
    description: string;
  }) => void;
};

export function usePeticionesContactActions({
  unifiedRows,
  reloadPeticiones,
  bookingTz,
  contact,
  createBooking,
  reloadBookings,
  catalog,
  setBusyId,
  setReservingContactId,
  setExpandedId,
  setConfirmDelete,
}: Props) {
  const router = useRouter();

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
        await createBooking({
          ...built.payload,
          contactRequestId: row.id,
        });
        await contact.setStatus(row.id, "RESERVED");
        toast({
          title: "Booking created",
          description:
            "The booking was saved from this request (source: contact).",
        });
        contact.reloadContacts();
        reloadBookings();
        reloadPeticiones();
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "Try again or open Book to enter it manually.";
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
    [
      bookingTz,
      catalog,
      contact,
      createBooking,
      reloadBookings,
      reloadPeticiones,
      router,
      setReservingContactId,
    ],
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
      const row = unifiedRows.find(
        (r) => r.origin === "CONTACT" && r.id === id,
      );
      const state = row?.origin === "CONTACT" ? row.state : "PENDING";
      if (state !== "CANCELLED") {
        toast({
          title: "Action not allowed",
          description:
            "You can only delete a request after it has been canceled.",
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

  return {
    onReserveFromContact,
    onCancelContact,
    onRemove,
    confirmRemoveContact,
  };
}
