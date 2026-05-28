"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import type { UpcomingExperienceType } from "@/app/shamell-admin/events/types/events.types";
import { toast } from "@/hooks/use-toast";
import { fetchAdminReservationEventTemplates } from "../services/fetchAdminReservationEventTemplates";
import type {
  ReservationEventScheduleMode,
  ReservationEventTemplate,
} from "../types/reservationEventTemplate.types";

function scheduleModeForExperience(
  experienceType?: UpcomingExperienceType,
): ReservationEventScheduleMode | undefined {
  if (experienceType === "VENUE_SEATING") return "FIXED_EVENT";
  if (experienceType === "CLASSES") return "RECURRING_WEEKLY";
  return undefined;
}

export function useReservationEventTemplateOptions(
  enabled = true,
  experienceType?: UpcomingExperienceType,
) {
  const [templates, setTemplates] = useState<ReservationEventTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const modeFilter = scheduleModeForExperience(experienceType);

  const load = useCallback(async () => {
    if (!enabled) return;
    const token = getAdminBearerToken();
    if (!token) {
      setTemplates([]);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchAdminReservationEventTemplates(token, modeFilter);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Could not load templates",
          description: result.message,
        });
        setTemplates([]);
        return;
      }
      setTemplates(result.templates);
    } finally {
      setLoading(false);
    }
  }, [enabled, modeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return { templates, loading, reload: load, modeFilter };
}
