"use client";

import { useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { readPeticionesLastSeenAt } from "@/lib/peticionesNotifications";
import { fetchPeticionesBadge } from "../services/fetchPeticionesBadge";

const BADGE_POLL_MS = 45000;

export function useAgendaHubBadge(): number {
  const [peticionesBadge, setPeticionesBadge] = useState(0);

  useEffect(() => {
    const token = getAdminBearerToken();
    if (!token) {
      setPeticionesBadge(0);
      return;
    }
    let cancelled = false;

    const loadBadge = async () => {
      try {
        const lastSeen = readPeticionesLastSeenAt();
        const count = await fetchPeticionesBadge(token, {
          lane: "bookings",
          since: lastSeen > 0 ? lastSeen : undefined,
        });
        if (!cancelled) setPeticionesBadge(count);
      } catch {
        if (!cancelled) setPeticionesBadge(0);
      }
    };

    void loadBadge();
    const interval = window.setInterval(loadBadge, BADGE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return peticionesBadge;
}
