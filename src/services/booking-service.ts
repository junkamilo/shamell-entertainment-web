import { apiClient } from "./api-client";
import type { Booking, BookingCreateInput } from "@/types/booking";
import type { PaginatedResponse } from "@/types/api";

export const bookingService = {
  getAll: () =>
    apiClient.get<PaginatedResponse<Booking>>("/api/modules/bookings"),

  getById: (id: string) =>
    apiClient.get<{ booking: Booking }>(`/api/modules/bookings/${id}`),

  create: (data: BookingCreateInput) =>
    apiClient.post<{ message: string; data: Booking }>("/api/modules/bookings", data),

  getAvailability: () =>
    apiClient.get<{ available: string[]; blocked: string[] }>(
      "/api/modules/bookings/availability"
    ),
};
