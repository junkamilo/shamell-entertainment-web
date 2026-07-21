import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import {
  DEFAULT_PAGINATION_META,
  type PaginatedResponse,
  type PaginationMeta,
} from "@/lib/pagination";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";

export type FetchMiAgendaBookingsQuery = {
  page?: number;
  perPage?: number;
  activeOnly?: boolean;
  from?: string;
  to?: string;
};

export type FetchMiAgendaBookingsResult = {
  bookings: AdminBookingRow[];
  meta: PaginationMeta;
};

export async function fetchMiAgendaBookings(
  token: string,
  query: FetchMiAgendaBookingsQuery,
): Promise<FetchMiAgendaBookingsResult> {
  const base = getAdminApiBaseUrl();

  if (query.from && query.to && !query.page) {
    const sp = new URLSearchParams({ from: query.from, to: query.to });
    if (query.activeOnly) sp.set("activeOnly", "true");
    const calendarRes = await fetch(
      `${base}/api/v1/bookings/admin/calendar?${sp.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (calendarRes.ok) {
      const data = (await calendarRes.json()) as { items?: AdminBookingRow[] };
      const bookings = Array.isArray(data.items) ? data.items : [];
      return {
        bookings,
        meta: {
          ...DEFAULT_PAGINATION_META,
          page: 1,
          perPage: bookings.length,
          totalItems: bookings.length,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      };
    }
  }

  const sp = new URLSearchParams();
  if (query.page) sp.set("page", String(query.page));
  if (query.perPage) sp.set("perPage", String(query.perPage));
  if (query.activeOnly) sp.set("activeOnly", "true");
  if (query.from) sp.set("from", query.from);
  if (query.to) sp.set("to", query.to);
  const qs = sp.size > 0 ? `?${sp.toString()}` : "";

  const res = await fetch(`${base}/api/v1/bookings/admin${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(nestApiErrorMessage(data, "Could not load bookings."));
  }

  const data: unknown = await res.json();
  if (Array.isArray(data)) {
    return {
      bookings: data as AdminBookingRow[],
      meta: {
        ...DEFAULT_PAGINATION_META,
        totalItems: data.length,
        totalPages: 1,
        page: 1,
        hasPrev: false,
        hasNext: false,
      },
    };
  }

  const payload = data as Partial<PaginatedResponse<AdminBookingRow>>;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const nextMeta = payload.meta ?? DEFAULT_PAGINATION_META;

  return {
    bookings: items,
    meta: {
      page: Number(nextMeta.page ?? 1),
      perPage: Number(nextMeta.perPage ?? query.perPage ?? 10),
      totalItems: Number(nextMeta.totalItems ?? items.length),
      totalPages: Number(nextMeta.totalPages ?? 1),
      hasPrev: Boolean(nextMeta.hasPrev),
      hasNext: Boolean(nextMeta.hasNext),
    },
  };
}
