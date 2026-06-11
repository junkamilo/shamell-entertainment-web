"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PAGINATION_META, type PaginationMeta } from "@/lib/pagination";
import { cancelAdminVenueReservation } from "../services/cancelAdminVenueReservation";
import { fetchAdminVenueReservations } from "../services/fetchAdminVenueReservations";
import type { VenueSeatReservationRow } from "../types/venueReservations.types";

export function useAdminVenueReservationsPage() {
  const searchParams = useSearchParams();
  const [reservations, setReservations] = useState<VenueSeatReservationRow[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>(DEFAULT_PAGINATION_META);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentChannelFilter, setPaymentChannelFilter] = useState("");
  const [layoutItemIdFilter, setLayoutItemIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, paymentChannelFilter, layoutItemIdFilter]);

  useEffect(() => {
    const status = searchParams.get("status") ?? "";
    const layoutItemId = searchParams.get("layoutItemId") ?? "";
    setStatusFilter(status);
    setLayoutItemIdFilter(layoutItemId);
  }, [searchParams]);

  const reload = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await fetchAdminVenueReservations(token, {
      status: statusFilter || undefined,
      paymentChannel: paymentChannelFilter || undefined,
      layoutItemId: layoutItemIdFilter || undefined,
      page,
      perPage,
    });
    setIsLoading(false);
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: "Load failed",
        description: result.message,
      });
      return;
    }
    setReservations(result.reservations);
    setPaginationMeta(result.meta);
  }, [statusFilter, paymentChannelFilter, layoutItemIdFilter, page, perPage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const cancelReservation = useCallback(
    async (id: string) => {
      const token = getAdminBearerToken();
      if (!token) return;
      setCancellingId(id);
      const result = await cancelAdminVenueReservation(token, id);
      setCancellingId(null);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Cancel failed",
          description: result.message,
        });
        return;
      }
      toast({ title: "Reservation cancelled" });
      void reload();
    },
    [reload],
  );

  const onPageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const onPerPageChange = useCallback((nextPerPage: number) => {
    setPerPage(nextPerPage);
    setPage(1);
  }, []);

  return {
    reservations,
    paginationMeta,
    statusFilter,
    setStatusFilter,
    paymentChannelFilter,
    setPaymentChannelFilter,
    layoutItemIdFilter,
    setLayoutItemIdFilter,
    isLoading,
    cancellingId,
    cancelReservation,
    reload,
    onPageChange,
    onPerPageChange,
  };
}
