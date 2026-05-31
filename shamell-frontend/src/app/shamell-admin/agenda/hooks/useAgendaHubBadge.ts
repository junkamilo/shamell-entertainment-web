"use client";

import { useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { readPaymentHistoryLastSeenAt } from "@/lib/paymentHistoryNotifications";
import { readPeticionesLastSeenAt } from "@/lib/peticionesNotifications";
import { fetchPaymentHistoryBadge } from "../payment-history/services/fetchAdminPayments";
import { fetchPeticionesBadge } from "../services/fetchPeticionesBadge";

const BADGE_POLL_MS = 45000;

export type AgendaHubBadges = {
  peticionesBadge: number;
  paymentHistoryBadge: number;
};

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

    const loadBadges = async () => {
      try {
        const peticionesLastSeen = readPeticionesLastSeenAt();
        const paymentLastSeen = readPaymentHistoryLastSeenAt();
        const [peticionesCount, paymentCount] = await Promise.all([
          fetchPeticionesBadge(token, {
            lane: "bookings",
            since: peticionesLastSeen > 0 ? peticionesLastSeen : undefined,
          }),
          fetchPaymentHistoryBadge(
            token,
            paymentLastSeen > 0 ? paymentLastSeen : undefined,
          ),
        ]);
        if (!cancelled) {
          setPeticionesBadge(peticionesCount);
          setPaymentHistoryBadge(paymentCount);
        }
      } catch {
        if (!cancelled) {
          setPeticionesBadge(0);
          setPaymentHistoryBadge(0);
        }
      }
    };

    void loadBadges();
    const interval = window.setInterval(loadBadges, BADGE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return { peticionesBadge, paymentHistoryBadge };
}
