"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { fetchAdminFloorLayout } from "@/app/shamell-admin/on-coming-events/layout/services/fetchAdminFloorLayout";
import { fetchAdminStandaloneChairs } from "@/app/shamell-admin/venue-tables/services/fetchAdminStandaloneChairs";
import { fetchAdminVenueTables } from "@/app/shamell-admin/venue-tables/services/fetchAdminVenueTables";
import { TABLE_SIZE_LABELS } from "@/components/floor-layout/layoutTypes";
import { toast } from "@/hooks/use-toast";
import { buildLayoutItemLabelMap } from "@/lib/venueSeatDisplayLabel";
import { buildBoxOfficeDetails } from "../lib/buildBoxOfficeDetails";
import {
  createBoxOfficeFixedTicketCash,
  createBoxOfficeFixedTicketCheckout,
} from "../services/createBoxOfficeFixedTicket";
import {
  createBoxOfficeVenueCash,
  createBoxOfficeVenueCheckout,
} from "../services/createBoxOfficeVenueReservation";
import { fetchBoxOfficeFixedEvents } from "../services/fetchBoxOfficeFixedEvents";
import { fetchBoxOfficeSeatAvailability } from "../services/fetchBoxOfficeSeatAvailability";
import type {
  BoxOfficeFixedEvent,
  BoxOfficePaymentMethod,
  BoxOfficeSeatOption,
} from "../types/boxOfficeFixed.types";

export function useBoxOfficeFixedEventForm() {
  const [events, setEvents] = useState<BoxOfficeFixedEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [eventId, setEventId] = useState("");
  const [seats, setSeats] = useState<BoxOfficeSeatOption[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<BoxOfficePaymentMethod>("cash");
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === eventId) ?? null,
    [events, eventId],
  );
  const selectedSeat = useMemo(
    () => seats.find((s) => s.layoutItemId === selectedSeatId) ?? null,
    [seats, selectedSeatId],
  );

  const reloadEvents = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setEventsError("Not signed in.");
      setEventsLoading(false);
      return;
    }
    setEventsLoading(true);
    setEventsError(null);
    try {
      const list = await fetchBoxOfficeFixedEvents(token);
      setEvents(list);
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : "Could not load events.");
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadEvents();
  }, [reloadEvents]);

  const loadSeatsForEvent = useCallback(async (event: BoxOfficeFixedEvent) => {
    const token = getAdminBearerToken();
    if (!token) return;
    setSeatsLoading(true);
    setSelectedSeatId(null);
    try {
      const [layoutResult, tablesResult, chairsResult, availabilityResult] =
        await Promise.all([
          fetchAdminFloorLayout(token),
          fetchAdminVenueTables(token),
          fetchAdminStandaloneChairs(token),
          fetchBoxOfficeSeatAvailability(token, {
            upcomingEventId: event.id,
            upcomingEventSlug: event.slug ?? undefined,
          }),
        ]);

      if (!layoutResult.ok || !layoutResult.layout) {
        setSeats([]);
        return;
      }
      if (!availabilityResult.ok) {
        setSeats([]);
        setFormError(availabilityResult.message);
        return;
      }

      const priceByTableId = new Map<string, number>();
      const tableCatalog =
        tablesResult.ok
          ? tablesResult.items.map((t) => ({
              id: t.id,
              tableName: t.tableName,
              size: t.size,
              sortOrder: t.sortOrder,
              isActive: t.isActive,
            }))
          : [];
      if (tablesResult.ok) {
        for (const t of tablesResult.items) {
          priceByTableId.set(t.id, Number(t.bundlePrice));
        }
      }

      const chairCatalog =
        chairsResult.ok && chairsResult.config
          ? (chairsResult.config.chairs ?? []).map((c) => ({
              id: c.id,
              chairName: c.chairName,
              sortOrder: c.sortOrder,
              isActive: c.isActive,
            }))
          : [];

      const labelByItemId = buildLayoutItemLabelMap(
        layoutResult.layout.items,
        tableCatalog,
        chairCatalog,
      );

      const reserved = new Set(availabilityResult.data.reservedLayoutItemIds);
      const pending = new Set(availabilityResult.data.pendingLayoutItemIds);

      const options: BoxOfficeSeatOption[] = [];
      for (const item of layoutResult.layout.items) {
        if (item.kind === "catalog_table") {
          const labels = labelByItemId.get(item.id);
          const seatLabel =
            labels?.short ??
            (item.tableName || TABLE_SIZE_LABELS[item.size]);
          const fullLabel =
            labels?.full ??
            (item.tableName
              ? item.tableName
              : `${TABLE_SIZE_LABELS[item.size]} table`);
          options.push({
            layoutItemId: item.id,
            kind: "catalog_table",
            venueTableConfigId: item.venueTableConfigId,
            seatLabel,
            fullLabel,
            detail: `${item.includedChairs} chair${
              item.includedChairs === 1 ? "" : "s"
            }`,
            amount: priceByTableId.get(item.venueTableConfigId) ?? null,
            tableSize: item.size,
            reserved: reserved.has(item.id),
            pending: pending.has(item.id),
          });
        } else if (item.kind === "standalone_chair") {
          const labels = labelByItemId.get(item.id);
          const seatLabel =
            labels?.short ?? (item.chairName || "Chair");
          options.push({
            layoutItemId: item.id,
            kind: "standalone_chair",
            seatLabel,
            fullLabel: labels?.full ?? seatLabel,
            detail: "Standalone chair",
            amount:
              typeof item.unitPrice === "number" ? item.unitPrice : null,
            reserved: reserved.has(item.id),
            pending: pending.has(item.id),
          });
        }
      }
      setSeats(options);
    } finally {
      setSeatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      setSeats([]);
      setSelectedSeatId(null);
      return;
    }
    if (selectedEvent.purchaseKind === "venue_seating") {
      void loadSeatsForEvent(selectedEvent);
    } else {
      setSeats([]);
      setSelectedSeatId(null);
    }
  }, [selectedEvent, loadSeatsForEvent]);

  const onSelectEvent = useCallback((id: string) => {
    setEventId(id);
    setFormError(null);
    setCashConfirmed(false);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      const token = getAdminBearerToken();
      if (!token) {
        setFormError("Not signed in.");
        return;
      }
      if (!selectedEvent) {
        setFormError("Select an event.");
        return;
      }
      if (!customerName.trim() || !customerEmail.trim()) {
        setFormError("Name and email are required.");
        return;
      }
      if (paymentMethod === "cash" && !cashConfirmed) {
        setFormError("Confirm that cash payment was received.");
        return;
      }

      if (selectedEvent.purchaseKind === "venue_seating") {
        if (!selectedSeat || selectedSeat.reserved || selectedSeat.pending) {
          setFormError("Select an available table or chair.");
          return;
        }
        if (selectedSeat.amount == null || selectedSeat.amount < 0.5) {
          setFormError("Selected seat has no valid price.");
          return;
        }

        const boxOfficeDetails = buildBoxOfficeDetails({
          purchaseKind: "venue_seating",
          upcomingEventId: selectedEvent.id,
          paymentMethod,
          customerName,
          customerEmail,
          customerPhone,
          seat: selectedSeat,
          ticketAmount: null,
          ticketCurrency: "usd",
        });

        const body = {
          kind: selectedSeat.kind,
          layoutItemId: selectedSeat.layoutItemId,
          venueTableConfigId: selectedSeat.venueTableConfigId,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
          upcomingEventId: selectedEvent.id,
          upcomingEventSlug: selectedEvent.slug ?? undefined,
          boxOfficeDetails,
        };

        setSubmitting(true);
        const result =
          paymentMethod === "cash"
            ? await createBoxOfficeVenueCash(token, body)
            : await createBoxOfficeVenueCheckout(token, body);
        setSubmitting(false);

        if (!result.ok) {
          setFormError(result.message);
          return;
        }
        toast({
          title: paymentMethod === "cash" ? "Seat reserved" : "Payment link sent",
          description: result.message,
        });
        setCashConfirmed(false);
        await loadSeatsForEvent(selectedEvent);
        setSelectedSeatId(null);
        return;
      }

      if (selectedEvent.price == null || selectedEvent.price < 0.5) {
        setFormError("Event ticket price is not configured.");
        return;
      }
      if (
        selectedEvent.ticketsRemaining != null &&
        selectedEvent.ticketsRemaining <= 0
      ) {
        setFormError("Tickets sold out.");
        return;
      }

      const boxOfficeDetails = buildBoxOfficeDetails({
        purchaseKind: "fixed_ticket",
        upcomingEventId: selectedEvent.id,
        paymentMethod,
        customerName,
        customerEmail,
        customerPhone,
        seat: null,
        ticketAmount: selectedEvent.price,
        ticketCurrency: selectedEvent.currency,
      });

      const body = {
        upcomingEventId: selectedEvent.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        boxOfficeDetails,
      };

      setSubmitting(true);
      const result =
        paymentMethod === "cash"
          ? await createBoxOfficeFixedTicketCash(token, body)
          : await createBoxOfficeFixedTicketCheckout(token, body);
      setSubmitting(false);

      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      toast({
        title: paymentMethod === "cash" ? "Ticket reserved" : "Payment link sent",
        description: result.message,
      });
      setCashConfirmed(false);
      await reloadEvents();
    },
    [
      selectedEvent,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      cashConfirmed,
      selectedSeat,
      loadSeatsForEvent,
      reloadEvents,
    ],
  );

  return {
    events,
    eventsLoading,
    eventsError,
    eventId,
    onSelectEvent,
    selectedEvent,
    seats,
    seatsLoading,
    selectedSeatId,
    setSelectedSeatId,
    selectedSeat,
    customerName,
    setCustomerName,
    customerEmail,
    setCustomerEmail,
    customerPhone,
    setCustomerPhone,
    paymentMethod,
    setPaymentMethod,
    cashConfirmed,
    setCashConfirmed,
    submitting,
    formError,
    onSubmit,
  };
}
