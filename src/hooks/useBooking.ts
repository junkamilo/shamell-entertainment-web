'use client';

import { useState } from "react";
import { bookingService } from "@/services/booking-service";
import type { BookingCreateInput } from "@/types/booking";

export function useBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitBooking = async (data: BookingCreateInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await bookingService.create(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to submit booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitBooking, isSubmitting, success, error };
}
