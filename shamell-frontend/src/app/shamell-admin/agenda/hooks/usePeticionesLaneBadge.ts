"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import {
  PETICIONES_BADGE_REFRESH_EVENT,
  readPeticionesLastSeenAt,
} from "@/lib/peticionesNotifications";
import type { PeticionesLane } from "../peticiones/types/peticiones.types";
import { fetchPeticionesBadge } from "../services/fetchPeticionesBadge";

const BADGE_POLL_MS = 45000;

export function usePeticionesLaneBadge(
  lane: PeticionesLane,
  enabled = true,
): number {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token || !enabled) {
      setCount(0);
      return;
    }
    try {
      const lastSeen = readPeticionesLastSeenAt(lane);
      const next = await fetchPeticionesBadge(token, {
        lane,
        since: lastSeen > 0 ? lastSeen : undefined,
      });
      setCount(next);
    } catch {
      setCount(0);
    }
  }, [enabled, lane]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), BADGE_POLL_MS);
    const onRefresh = () => void load();
    window.addEventListener(PETICIONES_BADGE_REFRESH_EVENT, onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(PETICIONES_BADGE_REFRESH_EVENT, onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [load]);

  return count;
}
