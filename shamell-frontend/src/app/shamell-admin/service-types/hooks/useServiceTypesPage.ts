"use client";

import { type FormEvent, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getServiceTypesBearerToken } from "../lib/serviceTypesAuth";
import {
  canDeleteServiceType,
  cannotDeactivateWhileActive,
  getDeleteBlockedDescription,
  getDeleteBlockedTitle,
} from "../lib/serviceTypesUsage";
import { deleteAdminServiceType } from "../services/deleteAdminServiceType";
import {
  patchAdminServiceType,
  patchAdminServiceTypeActive,
} from "../services/patchAdminServiceType";
import { postAdminServiceType } from "../services/postAdminServiceType";
import type { ServiceTypeItem } from "../types/serviceTypes.types";
import { useServiceTypesForm } from "./useServiceTypesForm";
import { useServiceTypesList } from "./useServiceTypesList";

function isOfflineError(err: unknown) {
  const description = err instanceof Error ? err.message : "Could not reach the server.";
  return description === "Failed to fetch" || !(err instanceof Error);
}

function toastApiError(err: unknown, fallbackTitle: string) {
  const offline = isOfflineError(err);
  toast({
    variant: "destructive",
    title: offline ? "Offline" : fallbackTitle,
    description: offline
      ? "Could not reach the server."
      : err instanceof Error
        ? err.message
        : "Something went wrong.",
  });
}

export function useServiceTypesPage() {
  const list = useServiceTypesList();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ServiceTypeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useServiceTypesForm({
    types: list.types,
    isSubmitting,
  });

  const openCreateModal = useCallback(() => {
    form.resetForm();
    setIsModalOpen(true);
  }, [form]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    form.resetForm();
  }, [form]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const token = getServiceTypesBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin.",
        });
        return;
      }

      const validationError = form.getNameValidationError();
      if (validationError) {
        toast({
          variant: "destructive",
          title: "Check the form",
          description: validationError,
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const body = { name: form.trimmedName };
        if (form.editingId) {
          await patchAdminServiceType(token, form.editingId, body);
        } else {
          await postAdminServiceType(token, body);
        }

        toast({
          title: form.editingId ? "Type updated" : "Type created",
          description: form.editingId
            ? "Service type changes were saved."
            : "The new service type was created successfully.",
        });
        form.resetForm();
        setIsModalOpen(false);
        await list.loadTypes();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, list],
  );

  const startEdit = useCallback(
    (item: ServiceTypeItem) => {
      form.startEdit(item);
      setIsModalOpen(true);
    },
    [form],
  );

  const onToggleActive = useCallback(
    async (item: ServiceTypeItem) => {
      if (cannotDeactivateWhileActive(item)) {
        toast({
          variant: "destructive",
          title: "Cannot turn off",
          description: "This type has linked services. Reassign or remove them first.",
        });
        return;
      }

      const token = getServiceTypesBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin.",
        });
        return;
      }

      setTogglingId(item.id);
      try {
        await patchAdminServiceTypeActive(token, item.id, !item.isActive);

        if (form.editingId === item.id && !item.isActive) {
          form.resetForm();
        }

        toast({
          title: item.isActive ? "Type hidden" : "Type visible",
          description: item.isActive
            ? "The service type was turned off."
            : "The service type was turned on.",
        });
        await list.loadTypes();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setTogglingId(null);
      }
    },
    [form, list],
  );

  const openDeleteConfirm = useCallback((item: ServiceTypeItem) => {
    if (!canDeleteServiceType(item)) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description: getDeleteBlockedDescription(item),
      });
      return;
    }
    setPendingDelete(item);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const token = getServiceTypesBearerToken();
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAdminServiceType(token, pendingDelete.id);

      if (form.editingId === pendingDelete.id) {
        form.resetForm();
        setIsModalOpen(false);
      }

      toast({
        title: "Type deleted",
        description: "The service type was removed from the catalog.",
      });
      setPendingDelete(null);
      await list.loadTypes();
    } catch (err) {
      toastApiError(err, "Error");
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, form, list]);

  const closeDeleteModal = useCallback(() => {
    if (!isDeleting) setPendingDelete(null);
  }, [isDeleting]);

  return {
    list,
    form,
    isModalOpen,
    isSubmitting,
    togglingId,
    pendingDelete,
    isDeleting,
    openCreateModal,
    closeModal,
    onSubmit,
    startEdit,
    onToggleActive,
    openDeleteConfirm,
    onConfirmDelete,
    closeDeleteModal,
    canDeleteServiceType,
    cannotDeactivateWhileActive,
    getDeleteBlockedTitle,
  };
}
