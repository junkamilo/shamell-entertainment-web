import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import {
  DEFAULT_PAGINATION_META,
  type PaginationMeta,
} from "@/lib/pagination";
import type { VenueSeatReservationRow } from "../types/venueReservations.types";

function normalizeMeta(raw: unknown): PaginationMeta {
  if (!raw || typeof raw !== "object") return DEFAULT_PAGINATION_META;
  const m = raw as Record<string, unknown>;
  const page = Number(m.page ?? 1);
  const perPage = Number(m.perPage ?? 10);
  const totalItems = Number(m.totalItems ?? 0);
  const totalPages = Number(m.totalPages ?? 1);
  return {
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    perPage: Number.isFinite(perPage) && perPage >= 1 ? perPage : 10,
    totalItems: Number.isFinite(totalItems) ? totalItems : 0,
    totalPages: Number.isFinite(totalPages) && totalPages >= 1 ? totalPages : 1,
    hasPrev: Boolean(m.hasPrev),
    hasNext: Boolean(m.hasNext),
  };
}

function mapReservationRow(r: Record<string, unknown>): VenueSeatReservationRow {
  return {
    id: String(r.id ?? ""),
    kind: String(r.kind ?? ""),
    layoutItemId: String(r.layoutItemId ?? ""),
    venueTableConfigId:
      typeof r.venueTableConfigId === "string" ? r.venueTableConfigId : null,
    tableName: typeof r.tableName === "string" ? r.tableName : null,
    tableSize: typeof r.tableSize === "string" ? r.tableSize : null,
    eventDate: String(r.eventDate ?? ""),
    amount: Number(r.amount ?? 0),
    currency: String(r.currency ?? "usd"),
    status: String(r.status ?? ""),
    customerName: String(r.customerName ?? ""),
    customerEmail: String(r.customerEmail ?? ""),
    customerPhone: typeof r.customerPhone === "string" ? r.customerPhone : null,
    stripeCheckoutSessionId: String(r.stripeCheckoutSessionId ?? ""),
    paidAt: typeof r.paidAt === "string" ? r.paidAt : null,
    createdAt: String(r.createdAt ?? ""),
  };
}

export async function fetchAdminVenueReservations(
  token: string,
  params?: { status?: string; page?: number; perPage?: number },
): Promise<{
  ok: boolean;
  reservations: VenueSeatReservationRow[];
  meta: PaginationMeta;
  message?: string;
}> {
  const base = getAdminApiBaseUrl();
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? 1));
  search.set("perPage", String(params?.perPage ?? 10));
  if (params?.status) search.set("status", params.status);

  const qs = search.toString();
  const response = await fetch(
    `${base}/api/v1/venue-reservations/admin${qs ? `?${qs}` : ""}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      ok: false,
      reservations: [],
      meta: DEFAULT_PAGINATION_META,
      message: "Could not load reservations.",
    };
  }
  if (!data || typeof data !== "object") {
    return {
      ok: false,
      reservations: [],
      meta: DEFAULT_PAGINATION_META,
      message: "Invalid response.",
    };
  }

  const body = data as { reservations?: unknown; meta?: unknown };
  const list = body.reservations;
  if (!Array.isArray(list)) {
    return { ok: true, reservations: [], meta: normalizeMeta(body.meta) };
  }

  const reservations = list
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
    .map(mapReservationRow);

  return {
    ok: true,
    reservations,
    meta: normalizeMeta(body.meta),
  };
}
