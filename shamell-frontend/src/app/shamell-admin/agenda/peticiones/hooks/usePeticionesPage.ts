"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminContactRequests } from "@/hooks/use-admin-contact-requests";
import { useAdminBookings } from "@/hooks/use-admin-bookings";
import type {
  ConfirmDeleteState,
  PeticionesLane,
} from "../types/peticiones.types";
import { usePeticionesActions } from "./usePeticionesActions";
import { usePeticionesCatalogMaps } from "./usePeticionesCatalogMaps";
import { usePeticionesInbox } from "./usePeticionesInbox";

export function usePeticionesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [activeLane, setActiveLane] = useState<PeticionesLane>("bookings");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reservingContactId, setReservingContactId] = useState<string | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(
    null,
  );
  const [purgeLinkedInquiryOnDelete, setPurgeLinkedInquiryOnDelete] =
    useState(true);

  const inbox = usePeticionesInbox(true, { page, perPage, lane: activeLane });
  const catalog = usePeticionesCatalogMaps();

  const contactMutations = useAdminContactRequests(false);
  const bookingMutations = useAdminBookings(false);

  const actions = usePeticionesActions({
    unifiedRows: inbox.rows,
    reloadPeticiones: inbox.reload,
    contact: {
      remove: contactMutations.remove,
      setStatus: contactMutations.setStatus,
      reloadContacts: contactMutations.reload,
    },
    bookings: {
      createBooking: bookingMutations.createBooking,
      patchBooking: bookingMutations.patchBooking,
      removeBooking: bookingMutations.removeBooking,
      reloadBookings: bookingMutations.reload,
      createBookingQuote: bookingMutations.createBookingQuote,
      sendBalanceLink: bookingMutations.sendBalanceLink,
    },
    catalog,
    setBusyId,
    setReservingContactId,
    setExpandedId,
    setConfirmDelete,
    setPurgeLinkedInquiryOnDelete,
  });

  useEffect(() => {
    setExpandedId(null);
  }, [activeLane]);

  const pendingCount = useMemo(
    () =>
      inbox.rows.filter((r) =>
        r.origin === "CONTACT" ? r.state === "PENDING" : r.status === "PENDING",
      ).length,
    [inbox.rows],
  );

  useEffect(() => {
    if (page <= inbox.meta.totalPages) return;
    const nextPage = inbox.meta.totalPages;
    const timer = window.setTimeout(() => {
      setPage(nextPage);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [page, inbox.meta.totalPages]);

  const onLaneChange = (lane: PeticionesLane) => {
    setActiveLane(lane);
    setPage(1);
  };

  const onConfirmDelete = async () => {
    if (!confirmDelete) return;
    const payload = confirmDelete;
    setConfirmDelete(null);
    if (payload.kind === "CONTACT") {
      await actions.confirmRemoveContact(payload.id);
    } else {
      await actions.confirmRemoveBooking(
        payload.id,
        payload.linkedContactId,
        purgeLinkedInquiryOnDelete,
      );
    }
  };

  return {
    page,
    setPage,
    perPage,
    setPerPage,
    activeLane,
    onLaneChange,
    expandedId,
    setExpandedId,
    busyId,
    reservingContactId,
    confirmDelete,
    setConfirmDelete,
    purgeLinkedInquiryOnDelete,
    setPurgeLinkedInquiryOnDelete,
    pendingCount,
    inbox,
    catalog,
    actions,
    onConfirmDelete,
  };
}
