"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { fetchAdminVenueLayoutSettings } from "@/features/admin/on-coming-events/services/fetchAdminVenueLayoutSettings";
import { patchAdminVenueLayoutEnabled } from "@/features/admin/on-coming-events/services/patchAdminVenueLayoutEnabled";
import { ON_COMING_EVENTS_ADMIN_PATH } from "@/lib/onComingEventsRoutes";
import { toast } from "@/hooks/use-toast";
import { notifyOnComingEventsSettingsChanged } from "@/lib/onComingEventsSettingsEvents";

export default function FloorLayoutPublishToggle() {
  const [clientEnabled, setClientEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const result = await fetchAdminVenueLayoutSettings(token);
    setClientEnabled(result.settings?.clientEnabled ?? false);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onToggle = async () => {
    const token = getAdminBearerToken();
    if (!token) return;
    setToggling(true);
    const result = await patchAdminVenueLayoutEnabled(token, !clientEnabled);
    setToggling(false);
    if (!result.ok || !result.settings) {
      toast({ variant: "destructive", title: "Could not update publish state" });
      return;
    }
    setClientEnabled(result.settings.clientEnabled);
    notifyOnComingEventsSettingsChanged();
    toast({
      title: result.settings.clientEnabled ? "Live on client site" : "Hidden from client site",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-shamell-line-soft/50 pt-2">
      <span className="text-[10px] uppercase tracking-wider text-shamell-text-primary/70">
        Client site:
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={clientEnabled}
        disabled={loading || toggling}
        onClick={() => void onToggle()}
        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase disabled:opacity-50 ${
          clientEnabled
            ? "bg-emerald-900/50 text-emerald-300"
            : "bg-shamell-line-soft/30 text-shamell-text-primary/60"
        }`}
      >
        {loading ? "…" : clientEnabled ? "Published" : "Hidden"}
      </button>
      <Link
        href={ON_COMING_EVENTS_ADMIN_PATH}
        className="text-[10px] text-shamell-gold hover:underline"
      >
        Configure promo
      </Link>
    </div>
  );
}
