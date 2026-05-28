"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { buildStandaloneChairPayload } from "../lib/buildStandaloneChairPayload";
import { fetchAdminStandaloneChairs } from "../services/fetchAdminStandaloneChairs";
import { putAdminStandaloneChairs } from "../services/putAdminStandaloneChairs";
import type { StandaloneChairInventoryItem } from "../types/standaloneChairs.types";
import { STANDALONE_CHAIR_MAX_QUANTITY } from "../types/standaloneChairs.types";

export function useStandaloneChairsConfig() {
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [unitPriceInput, setUnitPriceInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [chairs, setChairs] = useState<StandaloneChairInventoryItem[]>([]);

  const load = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchAdminStandaloneChairs(token);
      if (result.ok && result.config) {
        setAvailableQuantity(result.config.availableQuantity);
        setUnitPriceInput(
          result.config.unitPrice > 0 ? String(result.config.unitPrice) : "",
        );
        setChairs(result.config.chairs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const incrementQuantity = useCallback(() => {
    setAvailableQuantity((q) => Math.min(STANDALONE_CHAIR_MAX_QUANTITY, q + 1));
  }, []);

  const decrementQuantity = useCallback(() => {
    setAvailableQuantity((q) => Math.max(0, q - 1));
  }, []);

  const save = useCallback(async () => {
    setFieldErrors([]);
    const token = getAdminBearerToken();
    if (!token) {
      toast({ variant: "destructive", title: "Not signed in" });
      return;
    }

    const built = buildStandaloneChairPayload(availableQuantity, unitPriceInput);
    if (!built.ok) {
      setFieldErrors(built.errors);
      return;
    }

    setSaving(true);
    try {
      const result = await putAdminStandaloneChairs(token, built.payload);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: nestApiErrorMessage(
            result.data,
            "Could not save standalone chair configuration.",
          ),
        });
        return;
      }
      if (result.config) {
        setAvailableQuantity(result.config.availableQuantity);
        setUnitPriceInput(
          result.config.unitPrice > 0 ? String(result.config.unitPrice) : "",
        );
        setChairs(result.config.chairs ?? []);
      }
      const count = result.config?.availableQuantity ?? built.payload.availableQuantity;
      toast({
        title: "Standalone chairs saved",
        description:
          count === 0
            ? "No chairs in inventory."
            : count === 1
              ? "1 chair with an automatic ID."
              : `${count} chairs with automatic IDs.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setSaving(false);
    }
  }, [availableQuantity, unitPriceInput]);

  return {
    availableQuantity,
    setAvailableQuantity,
    incrementQuantity,
    decrementQuantity,
    canIncrementQuantity: availableQuantity < STANDALONE_CHAIR_MAX_QUANTITY,
    canDecrementQuantity: availableQuantity > 0,
    unitPriceInput,
    setUnitPriceInput,
    loading,
    saving,
    fieldErrors,
    chairs,
    save,
  };
}
