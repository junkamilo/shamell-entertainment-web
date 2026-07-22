"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import {
  buildBulkVenueTablePayload,
  buildVenueTablePayload,
} from "../lib/buildVenueTablePayload";
import { clampChairsForSize, TABLE_SIZE_CONFIG } from "../lib/tableSizeConfig";
import { postAdminVenueTablesBulk } from "../services/postAdminVenueTablesBulk";
import { patchAdminVenueTable } from "../services/patchAdminVenueTable";
import type { TableSize, VenueTableConfig } from "../types/venueTables.types";
import { BULK_TABLE_MAX_QUANTITY } from "../types/venueTables.types";

function initialState(editing: VenueTableConfig | null) {
  if (editing) {
    return {
      quantity: 1,
      size: editing.size,
      includedChairs: editing.includedChairs,
      bundlePriceInput: String(editing.bundlePrice),
    };
  }
  const size: TableSize = "LARGE";
  return {
    quantity: 1,
    size,
    includedChairs: TABLE_SIZE_CONFIG[size].defaultChairs,
    bundlePriceInput: "",
  };
}

export function useTableConfigurator(
  editing: VenueTableConfig | null,
  onSaved: () => void,
) {
  const init = initialState(editing);
  const [quantity, setQuantity] = useState(init.quantity);
  const [size, setSize] = useState<TableSize>(init.size);
  const [includedChairs, setIncludedChairs] = useState(init.includedChairs);
  const [bundlePriceInput, setBundlePriceInput] = useState(init.bundlePriceInput);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const limits = TABLE_SIZE_CONFIG[size];
  const isEditMode = editing !== null;

  const setSizeAndClamp = useCallback((next: TableSize) => {
    setSize(next);
    setIncludedChairs((prev) => clampChairsForSize(next, prev));
  }, []);

  const incrementChairs = useCallback(() => {
    setIncludedChairs((n) => clampChairsForSize(size, n + 1));
  }, [size]);

  const decrementChairs = useCallback(() => {
    setIncludedChairs((n) => clampChairsForSize(size, n - 1));
  }, [size]);

  const incrementQuantity = useCallback(() => {
    setQuantity((q) => Math.min(BULK_TABLE_MAX_QUANTITY, q + 1));
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const bulkBuilt = useMemo(() => {
    if (isEditMode) return null;
    return buildBulkVenueTablePayload({
      quantity,
      size,
      includedChairs,
      bundlePriceInput,
    });
  }, [isEditMode, quantity, size, includedChairs, bundlePriceInput]);

  const save = useCallback(async () => {
    setFieldErrors([]);
    const token = getAdminBearerToken();
    if (!token) {
      toast({ variant: "destructive", title: "Not signed in" });
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && editing) {
        const built = buildVenueTablePayload({
          size,
          includedChairs,
          bundlePriceInput,
          isActive: true,
        });
        if (!built.ok) {
          setFieldErrors(built.errors);
          return;
        }
        const result = await patchAdminVenueTable(token, editing.id, built.payload);
        if (!result.ok) {
          toast({
            variant: "destructive",
            title: "Save failed",
            description: nestApiErrorMessage(result.data, "Could not save configuration."),
          });
          return;
        }
        toast({
          title: "Table updated",
          description: TABLE_SIZE_CONFIG[size].label,
        });
        onSaved();
        return;
      }

      if (!bulkBuilt?.ok) {
        setFieldErrors(bulkBuilt?.errors ?? ["Invalid configuration."]);
        return;
      }

      const result = await postAdminVenueTablesBulk(token, bulkBuilt.payload);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: nestApiErrorMessage(
            result.data,
            "Could not create tables.",
          ),
        });
        return;
      }
      const count = result.result?.count ?? bulkBuilt.payload.quantity;
      const sizeLabel = TABLE_SIZE_CONFIG[bulkBuilt.payload.size].label;
      toast({
        title: count === 1 ? `1 ${sizeLabel} table created` : `${count} ${sizeLabel} tables created`,
        description:
          count === 1
            ? "A unique identifier was assigned automatically."
            : `${count} tables with automatic identifiers.`,
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
  }, [
    isEditMode,
    editing,
    size,
    includedChairs,
    bundlePriceInput,
    bulkBuilt,
    onSaved,
  ]);

  return {
    isEditMode,
    quantity,
    setQuantity,
    incrementQuantity,
    decrementQuantity,
    canIncrementQuantity: quantity < BULK_TABLE_MAX_QUANTITY,
    canDecrementQuantity: quantity > 1,
    size,
    setSize: setSizeAndClamp,
    includedChairs,
    incrementChairs,
    decrementChairs,
    canIncrement: includedChairs < limits.maxChairs,
    canDecrement: includedChairs > limits.minChairs,
    limits,
    bundlePriceInput,
    setBundlePriceInput,
    fieldErrors,
    saving,
    save,
  };
}
