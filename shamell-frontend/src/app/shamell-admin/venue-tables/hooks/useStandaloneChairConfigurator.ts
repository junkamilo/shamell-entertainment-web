"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { buildStandaloneChairAddPayload } from "../lib/buildStandaloneChairAddPayload";
import { putAdminStandaloneChairs } from "../services/putAdminStandaloneChairs";
import { STANDALONE_CHAIR_MAX_QUANTITY } from "../types/standaloneChairs.types";

type Options = {
  currentCount: number;
  defaultUnitPrice: number;
  onSaved: () => void;
};

export function useStandaloneChairConfigurator({
  currentCount,
  defaultUnitPrice,
  onSaved,
}: Options) {
  const [quantity, setQuantity] = useState(1);
  const [unitPriceInput, setUnitPriceInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setQuantity(1);
    setUnitPriceInput(defaultUnitPrice > 0 ? String(defaultUnitPrice) : "");
    setFieldErrors([]);
  }, [defaultUnitPrice]);

  useEffect(() => {
    resetForm();
  }, [resetForm, currentCount]);

  const maxAddQuantity = Math.max(0, STANDALONE_CHAIR_MAX_QUANTITY - currentCount);

  const incrementQuantity = useCallback(() => {
    setQuantity((q) => Math.min(maxAddQuantity, q + 1));
  }, [maxAddQuantity]);

  const decrementQuantity = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const save = useCallback(async () => {
    setFieldErrors([]);
    const token = getAdminBearerToken();
    if (!token) {
      toast({ variant: "destructive", title: "Not signed in" });
      return;
    }

    const built = buildStandaloneChairAddPayload(currentCount, quantity, unitPriceInput);
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
          title: "Could not add chairs",
          description: nestApiErrorMessage(
            result.data,
            "Could not save standalone chair configuration.",
          ),
        });
        return;
      }

      const added = built.addQuantity;
      toast({
        title: added === 1 ? "Chair added" : `${added} chairs added`,
        description: "Each chair has an automatic internal ID.",
      });
      onSaved();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setSaving(false);
    }
  }, [currentCount, onSaved, quantity, unitPriceInput]);

  return {
    quantity,
    setQuantity,
    incrementQuantity,
    decrementQuantity,
    canIncrementQuantity: quantity < maxAddQuantity,
    canDecrementQuantity: quantity > 1,
    maxAddQuantity,
    unitPriceInput,
    setUnitPriceInput,
    saving,
    fieldErrors,
    save,
    resetForm,
  };
}
