import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import type { AgendaHubBadges } from "../types/agendaHub.types";

export type FetchAgendaHubBadgesQuery = {
  peticionesBookingsSince?: number;
  peticionesGuidanceSince?: number;
  peticionesPrivateClassesSince?: number;
  paymentsSince?: number;
};

export async function fetchAgendaHubBadges(
  token: string,
  query: FetchAgendaHubBadgesQuery,
): Promise<AgendaHubBadges> {
  const base = getAdminApiBaseUrl();
  const sp = new URLSearchParams();
  if (query.peticionesBookingsSince != null && query.peticionesBookingsSince > 0) {
    sp.set("peticionesBookingsSince", String(query.peticionesBookingsSince));
  }
  if (query.peticionesGuidanceSince != null && query.peticionesGuidanceSince > 0) {
    sp.set("peticionesGuidanceSince", String(query.peticionesGuidanceSince));
  }
  if (
    query.peticionesPrivateClassesSince != null &&
    query.peticionesPrivateClassesSince > 0
  ) {
    sp.set(
      "peticionesPrivateClassesSince",
      String(query.peticionesPrivateClassesSince),
    );
  }
  if (query.paymentsSince != null && query.paymentsSince > 0) {
    sp.set("paymentsSince", String(query.paymentsSince));
  }
  const qs = sp.size > 0 ? `?${sp.toString()}` : "";

  const res = await fetch(`${base}/api/v1/agenda/hub-badges${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(nestApiErrorMessage(data, "Could not load agenda badges."));
  }

  const data = (await res.json()) as Partial<AgendaHubBadges>;
  return {
    peticionesBadge: Number(data.peticionesBadge ?? 0),
    paymentHistoryBadge: Number(data.paymentHistoryBadge ?? 0),
  };
}
