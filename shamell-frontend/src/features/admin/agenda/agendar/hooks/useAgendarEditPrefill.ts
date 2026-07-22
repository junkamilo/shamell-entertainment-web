"use client";

import { useEffect, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { bookingTimeZone } from "@/features/admin/agenda/peticiones/lib/peticionesDateUtils";
import { toast } from "@/hooks/use-toast";
import { applyAgendarQueryPrefill } from "../lib/applyAgendarQueryPrefill";
import { applyBookingRowToAgendarForm } from "../lib/mapBookingRowToAgendarForm";
import { fetchAgendarBookingForEdit } from "../services/fetchAgendarBookingForEdit";
import type { AgendarFormState } from "../types/agendarFormState.types";

export function useAgendarEditPrefill(
  bookingId: string,
  isEditMode: boolean,
  searchParams: ReadonlyURLSearchParams,
  form: AgendarFormState,
  bookingTz?: string,
) {
  const [editLoading, setEditLoading] = useState(isEditMode);

  useEffect(() => {
    if (!isEditMode) {
      setEditLoading(false);
      return;
    }

    let cancelled = false;
    const token = getAdminBearerToken();
    if (!token) {
      setEditLoading(false);
      return;
    }

    setEditLoading(true);
    const tz = bookingTz ?? bookingTimeZone();

    fetchAgendarBookingForEdit(token, bookingId)
      .then((row) => {
        if (cancelled) return;
        applyBookingRowToAgendarForm(row, form, tz);
        applyAgendarQueryPrefill(searchParams, form);
      })
      .catch(() => {
        if (!cancelled) {
          toast({ title: "Could not load booking for edit", variant: "destructive" });
        }
      })
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill when booking id or edit mode changes
  }, [bookingId, isEditMode, searchParams]);

  return { editLoading };
}
