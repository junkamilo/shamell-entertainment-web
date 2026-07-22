"use client";

import { useBlockedActionWarning } from "@/components/admin/overlays";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { parsePriceInput } from "../lib/parseVenueTablePrice";
import {
  canBulkEditStandaloneChairPrices,
  canDeleteAllStandaloneChairs,
  canDeleteStandaloneChair,
  canEditStandaloneChairPrice,
  getBulkEditPriceBlockedDescription,
  getDeleteAllBlockedDescription,
  getDeleteBlockedDescription,
  getEditPriceBlockedDescription,
} from "../lib/standaloneChairsUsage";
import { deleteAdminStandaloneChair } from "../services/deleteAdminStandaloneChair";
import { deleteAllAdminStandaloneChairs } from "../services/deleteAllAdminStandaloneChairs";
import { patchAdminStandaloneChair } from "../services/patchAdminStandaloneChair";
import { patchAdminStandaloneChairsBulkPrice } from "../services/patchAdminStandaloneChairsBulkPrice";
import type { StandaloneChairInventoryItem } from "../types/standaloneChairs.types";
import { useStandaloneChairsConfig } from "./useStandaloneChairsConfig";

type Options = {
  addModalOpen: boolean;
  onAddModalOpenChange: (open: boolean) => void;
};

export function useStandaloneChairsPage({ addModalOpen, onAddModalOpenChange }: Options) {
  const config = useStandaloneChairsConfig();
  const blockedWarning = useBlockedActionWarning();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [editChair, setEditChair] = useState<StandaloneChairInventoryItem | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [deleteChair, setDeleteChair] = useState<StandaloneChairInventoryItem | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const [editPriceInput, setEditPriceInput] = useState("");
  const [bulkPriceInput, setBulkPriceInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingBulkEdit, setSavingBulkEdit] = useState(false);
  const [deletingOne, setDeletingOne] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const totalItems = config.chairs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedChairs = useMemo(() => {
    const start = (page - 1) * perPage;
    return config.chairs.slice(start, start + perPage);
  }, [config.chairs, page, perPage]);

  const paginationMeta = {
    page,
    perPage,
    totalItems,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };

  const openEditChair = useCallback(
    (item: StandaloneChairInventoryItem) => {
      if (!canEditStandaloneChairPrice(item)) {
        blockedWarning.openWarning({
          title: "Cannot edit price",
          description: getEditPriceBlockedDescription(item),
        });
        return;
      }
      setEditPriceInput(String(item.unitPrice));
      setEditChair(item);
    },
    [blockedWarning],
  );

  const openDeleteChair = useCallback(
    (item: StandaloneChairInventoryItem) => {
      if (!canDeleteStandaloneChair(item)) {
        blockedWarning.openWarning({
          title: "Cannot delete chair",
          description: getDeleteBlockedDescription(item),
        });
        return;
      }
      setDeleteChair(item);
    },
    [blockedWarning],
  );

  const openBulkEdit = useCallback(() => {
    if (!canBulkEditStandaloneChairPrices(config.reservedCount)) {
      blockedWarning.openWarning({
        title: "Cannot edit all prices",
        description: getBulkEditPriceBlockedDescription(config.reservedCount),
      });
      return;
    }
    setBulkPriceInput(config.unitPrice > 0 ? String(config.unitPrice) : "");
    setBulkEditOpen(true);
  }, [blockedWarning, config.reservedCount, config.unitPrice]);

  const openDeleteAll = useCallback(() => {
    if (config.chairs.length === 0) return;
    if (!canDeleteAllStandaloneChairs(config.reservedCount)) {
      blockedWarning.openWarning({
        title: "Cannot delete all chairs",
        description: getDeleteAllBlockedDescription(config.reservedCount),
      });
      return;
    }
    setDeleteAllOpen(true);
  }, [blockedWarning, config.chairs.length, config.reservedCount]);

  const confirmEditChair = useCallback(async () => {
    if (!editChair) return;
    const parsed = parsePriceInput(editPriceInput);
    if (!parsed.ok || parsed.value == null) {
      toast({ variant: "destructive", title: "Enter a valid price" });
      return;
    }

    const token = getAdminBearerToken();
    if (!token) return;

    setSavingEdit(true);
    try {
      const result = await patchAdminStandaloneChair(token, editChair.id, parsed.value);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Could not update price",
          description: nestApiErrorMessage(result.data, "Could not update chair price."),
        });
        return;
      }
      toast({ title: "Price updated", description: editChair.displayLabel });
      setEditChair(null);
      void config.reload();
    } finally {
      setSavingEdit(false);
    }
  }, [config, editChair, editPriceInput]);

  const confirmBulkEdit = useCallback(async () => {
    const parsed = parsePriceInput(bulkPriceInput);
    if (!parsed.ok || parsed.value == null) {
      toast({ variant: "destructive", title: "Enter a valid price" });
      return;
    }

    const token = getAdminBearerToken();
    if (!token) return;

    setSavingBulkEdit(true);
    try {
      const result = await patchAdminStandaloneChairsBulkPrice(token, parsed.value);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Could not update prices",
          description: nestApiErrorMessage(result.data, "Could not update all chair prices."),
        });
        return;
      }
      toast({
        title: "All prices updated",
        description: `${config.chairs.length} chairs now share the same unit price.`,
      });
      setBulkEditOpen(false);
      void config.reload();
    } finally {
      setSavingBulkEdit(false);
    }
  }, [bulkPriceInput, config]);

  const confirmDeleteChair = useCallback(async () => {
    if (!deleteChair) return;
    const token = getAdminBearerToken();
    if (!token) return;

    setDeletingOne(true);
    try {
      const result = await deleteAdminStandaloneChair(token, deleteChair.id);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Could not delete chair",
          description: nestApiErrorMessage(result.data, "Could not delete chair."),
        });
        return;
      }
      toast({ title: "Chair deleted", description: deleteChair.displayLabel });
      setDeleteChair(null);
      setPage(1);
      void config.reload();
    } finally {
      setDeletingOne(false);
    }
  }, [config, deleteChair]);

  const confirmDeleteAll = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) return;

    setDeletingAll(true);
    try {
      const result = await deleteAllAdminStandaloneChairs(token);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Could not delete all chairs",
          description: nestApiErrorMessage(result.data, "Could not delete all chairs."),
        });
        return;
      }
      toast({
        title: "All chairs deleted",
        description: "Inventory cleared and floor layout references removed.",
      });
      setDeleteAllOpen(false);
      setPage(1);
      void config.reload();
    } finally {
      setDeletingAll(false);
    }
  }, [config]);

  return {
    config,
    addModalOpen,
    onAddModalOpenChange,
    blockedWarning,
    paginationMeta,
    pagedChairs,
    setPage,
    setPerPage,
    editChair,
    setEditChair,
    bulkEditOpen,
    setBulkEditOpen,
    deleteChair,
    setDeleteChair,
    deleteAllOpen,
    setDeleteAllOpen,
    editPriceInput,
    setEditPriceInput,
    bulkPriceInput,
    setBulkPriceInput,
    savingEdit,
    savingBulkEdit,
    deletingOne,
    deletingAll,
    openEditChair,
    openDeleteChair,
    openBulkEdit,
    openDeleteAll,
    confirmEditChair,
    confirmBulkEdit,
    confirmDeleteChair,
    confirmDeleteAll,
  };
}
