"use client";

import { useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { readPaymentHistoryLastSeenAt } from "@/lib/paymentHistoryNotifications";
import {
  PETICIONES_BADGE_REFRESH_EVENT,
  readPeticionesLastSeenAt,
} from "@/lib/peticionesNotifications";
import { fetchAgendaHubBadges } from "../services/fetchAgendaHubBadges";
import { fetchPaymentHistoryBadge } from "../payment-history/services/fetchAdminPayments";
import { fetchPeticionesBadge } from "../services/fetchPeticionesBadge";
import type { AgendaHubBadges } from "../types/agendaHub.types";

export type { AgendaHubBadges };

const BADGE_POLL_MS = 45000;

async function fetchInboxBadgeTotal(token: string): Promise<number> {
  const bookingsSince = readPeticionesLastSeenAt("bookings");
  const guidanceSince = readPeticionesLastSeenAt("guidance");
  const [bookingsCount, guidanceCount] = await Promise.all([
    fetchPeticionesBadge(token, {
      lane: "bookings",
      since: bookingsSince > 0 ? bookingsSince : undefined,
    }),
    fetchPeticionesBadge(token, {
      lane: "guidance",
      since: guidanceSince > 0 ? guidanceSince : undefined,
    }),
  ]);
  return bookingsCount + guidanceCount;
}

async function loadHubBadges(token: string): Promise<AgendaHubBadges> {
  const bookingsSince = readPeticionesLastSeenAt("bookings");
  const guidanceSince = readPeticionesLastSeenAt("guidance");
  const paymentLastSeen = readPaymentHistoryLastSeenAt();

  try {
    return await fetchAgendaHubBadges(token, {
      peticionesBookingsSince: bookingsSince > 0 ? bookingsSince : undefined,
      peticionesGuidanceSince: guidanceSince > 0 ? guidanceSince : undefined,
      paymentsSince: paymentLastSeen > 0 ? paymentLastSeen : undefined,
    });
  } catch {
    const [peticionesCount, paymentCount] = await Promise.all([
      fetchInboxBadgeTotal(token),
      fetchPaymentHistoryBadge(
        token,
        paymentLastSeen > 0 ? paymentLastSeen : undefined,
      ),
    ]);
    return {
      peticionesBadge: peticionesCount,
      paymentHistoryBadge: paymentCount,
    };
  }
}

export function useAgendaHubBadge(): AgendaHubBadges {
  const [peticionesBadge, setPeticionesBadge] = useState(0);
  const [paymentHistoryBadge, setPaymentHistoryBadge] = useState(0);

  useEffect(() => {
    const token = getAdminBearerToken();
    if (!token) {
      setPeticionesBadge(0);
      setPaymentHistoryBadge(0);
      return;
    }
    let cancelled = false;

    const refresh = async () => {
      try {
        const badges = await loadHubBadges(token);
        if (!cancelled) {
          setPeticionesBadge(badges.peticionesBadge);
          setPaymentHistoryBadge(badges.paymentHistoryBadge);
        }
      } catch {
        if (!cancelled) {
          setPeticionesBadge(0);
          setPaymentHistoryBadge(0);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, BADGE_POLL_MS);
    const onRefresh = () => void refresh();
    window.addEventListener(PETICIONES_BADGE_REFRESH_EVENT, onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener(PETICIONES_BADGE_REFRESH_EVENT, onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, []);

  return { peticionesBadge, paymentHistoryBadge };
}
