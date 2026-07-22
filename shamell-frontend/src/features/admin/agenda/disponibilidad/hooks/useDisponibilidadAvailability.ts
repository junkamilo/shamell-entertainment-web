"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicWeeklySlot } from "@/lib/bookingAvailability";
import { getDisponibilidadBearerToken } from "../lib/disponibilidadAuth";
import { createAvailabilityClosure } from "../services/createAvailabilityClosure";
import { deleteAvailabilityClosure } from "../services/deleteAvailabilityClosure";
import { fetchAdminAvailability } from "../services/fetchAdminAvailability";
import { putWeeklyAvailability } from "../services/putWeeklyAvailability";
import type { AdminAvailabilitySnapshot, CreateClosurePayload } from "../types/disponibilidad.types";

export function useDisponibilidadAvailability(enabled = true) {
  const [snapshot, setSnapshot] = useState<AdminAvailabilitySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    const token = getDisponibilidadBearerToken();
    if (!token) {
      setSnapshot(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetchAdminAvailability(token)
      .then((data) => setSnapshot(data))
      .catch((e: unknown) => {
        setSnapshot(null);
        setError(e instanceof Error ? e.message : "Error.");
      })
      .finally(() => setIsLoading(false));
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const putWeekly = useCallback(async (slots: PublicWeeklySlot[]) => {
    const token = getDisponibilidadBearerToken();
    if (!token) throw new Error("Not signed in.");
    const data = await putWeeklyAvailability(slots);
    setSnapshot(data);
    return data;
  }, []);

  const createClosure = useCallback(
    async (body: CreateClosurePayload) => {
      await createAvailabilityClosure(body);
      reload();
    },
    [reload],
  );

  const removeClosure = useCallback(
    async (id: string) => {
      await deleteAvailabilityClosure(id);
      reload();
    },
    [reload],
  );

  return {
    snapshot,
    isLoading,
    error,
    reload,
    putWeekly,
    createClosure,
    removeClosure,
  };
}
