"use client";

import { useEffect, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { fetchAdminPaymentDetail } from "../services/fetchAdminPaymentDetail";
import type {
  AdminPaymentFlow,
  AdminStripePaymentDetail,
} from "../types/paymentHistory.types";

type PaymentRowRef = {
  flow: AdminPaymentFlow;
  id: string;
} | null;

export function usePaymentHistoryDetail(row: PaymentRowRef, isOpen: boolean) {
  const [detail, setDetail] = useState<AdminStripePaymentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !row) {
      setDetail(null);
      setDetailError(null);
      setIsLoadingDetail(false);
      return;
    }

    const token = getAdminBearerToken();
    if (!token) {
      setDetailError("Not signed in.");
      return;
    }

    let cancelled = false;
    setIsLoadingDetail(true);
    setDetailError(null);

    void fetchAdminPaymentDetail(token, row.flow, row.id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetailError(
            err instanceof Error ? err.message : "Could not load full details.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, row?.flow, row?.id]);

  return { detail, isLoadingDetail, detailError };
}
