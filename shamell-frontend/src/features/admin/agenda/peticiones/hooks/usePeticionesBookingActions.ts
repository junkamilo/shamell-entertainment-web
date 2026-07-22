"use client";

import { type Dispatch, type SetStateAction, useCallback } from "react";
import type {
  AdminBookingRow,
  CreateAdminBookingPayload,
  CreateBookingQuotePayload,
} from "@/hooks/use-admin-bookings";
import { toast } from "@/hooks/use-toast";
import type { ConfirmDeleteState, UnifiedPeticionRow } from "../types/peticiones.types";

type Props = {
  unifiedRows: UnifiedPeticionRow[];
  reloadPeticiones: () => void;
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
  setBusyId: (id: string | null) => void;
  setExpandedId: Dispatch<SetStateAction<string | null>>;
  setConfirmDelete: (state: ConfirmDeleteState | null) => void;
  setPurgeLinkedInquiryOnDelete: (value: boolean) => void;
};

export function usePeticionesBookingActions({
  unifiedRows,
  reloadPeticiones,
  patchBooking,
  removeBooking,
  reloadBookings,
  createBookingQuote,
  sendBalanceLink,
  setBusyId,
  setExpandedId,
  setConfirmDelete,
  setPurgeLinkedInquiryOnDelete,
}: Props) {
  const onCancelBooking = useCallback(
    async (row: AdminBookingRow) => {
      if (row.status === "CANCELLED") return;
      setBusyId(row.id);
      try {
        await patchBooking(row.id, { status: "CANCELLED" });
        toast({ title: "Booking canceled" });
        reloadBookings();
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
    [patchBooking, reloadBookings, reloadPeticiones, setBusyId],
  );

  const onRemoveBooking = useCallback(
    (row: AdminBookingRow) => {
      if (row.status !== "CANCELLED") {
        toast({
          title: "Action not allowed",
          description:
            "You can only delete a booking after it has been canceled.",
          variant: "destructive",
        });
        return;
      }
      const unified = unifiedRows.find(
        (r) => r.origin === "BOOKING_ADMIN" && r.booking.id === row.id,
      );
      const linkedContactId =
        unified?.origin === "BOOKING_ADMIN"
          ? unified.linkedContact?.id
          : undefined;
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

  const onSendBookingQuote = useCallback(
    async (
      row: AdminBookingRow,
      payload: {
        paymentModel: "FULL" | "DEPOSIT";
        totalAmount: number;
        depositAmount?: number;
      },
    ) => {
      setBusyId(row.id);
      try {
        await createBookingQuote(row.id, payload);
        toast({
          title: "Payment link sent",
          description:
            "The customer received an email with the secure payment link.",
        });
        reloadBookings();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Could not send quote",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [createBookingQuote, reloadBookings, reloadPeticiones, setBusyId],
  );

  const onSendBalanceLink = useCallback(
    async (row: AdminBookingRow) => {
      setBusyId(row.id);
      try {
        await sendBalanceLink(row.id);
        toast({
          title: "Balance link sent",
          description: "Customer received the remaining balance payment link.",
        });
        reloadBookings();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Could not send balance link",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [reloadBookings, reloadPeticiones, sendBalanceLink, setBusyId],
  );

  const confirmRemoveBooking = useCallback(
    async (id: string, linkedContactId?: string, purgeLinked?: boolean) => {
      setBusyId(id);
      try {
        await removeBooking(id, {
          purgeContact: Boolean(purgeLinked && linkedContactId),
        });
        setExpandedId((cur) => (cur === id ? null : cur));
        toast({ title: "Booking deleted" });
        reloadBookings();
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
    [removeBooking, reloadBookings, reloadPeticiones, setBusyId, setExpandedId],
  );

  return {
    onCancelBooking,
    onRemoveBooking,
    onSendBookingQuote,
    onSendBalanceLink,
    confirmRemoveBooking,
  };
}
