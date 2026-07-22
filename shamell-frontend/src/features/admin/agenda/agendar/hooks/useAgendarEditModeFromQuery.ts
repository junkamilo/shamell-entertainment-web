"use client";

import { useSearchParams } from "next/navigation";
import { isBookingIdUuid } from "../lib/agendarQuery";

export function useAgendarEditModeFromQuery() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId")?.trim() ?? "";
  return isBookingIdUuid(bookingId);
}
