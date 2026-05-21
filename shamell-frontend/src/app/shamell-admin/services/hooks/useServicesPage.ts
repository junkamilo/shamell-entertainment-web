"use client";

import { type FormEvent, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { ServiceTypeItem } from "@/app/shamell-admin/service-types/types/serviceTypes.types";
import { displayServiceHeading } from "../lib/servicesDisplay";
import { getServicesBearerToken } from "../lib/servicesAuth";
import {
  canDeleteService,
  cannotDeactivateWhileActive,
  getDeleteBlockedDescription,
  getDeleteBlockedTitle,
} from "../lib/servicesUsage";
import { deleteAdminService } from "../services/deleteAdminService";
import { patchAdminService } from "../services/patchAdminService";
import { patchAdminServiceActive } from "../services/patchAdminServiceActive";
import { patchAdminServiceClearImage } from "../services/patchAdminServiceClearImage";
import { postAdminService } from "../services/postAdminService";
import type { AdminService } from "../types/services.types";
import { useServicesCatalog } from "./useServicesCatalog";
import { useServicesForm } from "./useServicesForm";
import { useServicesList } from "./useServicesList";

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

export function useServicesPage() {
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewService, setViewService] = useState<AdminService | null>(null);
  const [pendingClearMedia, setPendingClearMedia] = useState(false);
  const [isClearingMedia, setIsClearingMedia] = useState(false);

  const seedServiceTypes = useCallback((types: ServiceTypeItem[]) => {
    setServiceTypeId((current) => {
      if (current) return current;
      const firstActive = types.find((item) => item.isActive);
      return firstActive?.id ?? types[0]?.id ?? "";
    });
  }, []);

  const catalog = useServicesCatalog(seedServiceTypes);
  const list = useServicesList({
    services: catalog.services,
    serviceTypes: catalog.serviceTypes,
  });
  const form = useServicesForm({
    serviceTypes: catalog.serviceTypes,
    serviceTypeId,
    setServiceTypeId,
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
      const token = getServicesBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin to manage services.",
        });
        return;
      }

      const validationError = form.getValidationError();
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
        const body = form.buildUpsertFormData();
        if (form.editingId) {
          await patchAdminService(token, form.editingId, body);
        } else {
          await postAdminService(token, body);
        }

        const wasEditing = Boolean(form.editingId);
        form.clearMediaFileInput();
        form.resetForm();
        setIsModalOpen(false);
        toast({
          title: wasEditing ? "Service updated" : "Service created",
          description: wasEditing
            ? "Service changes were saved."
            : "The new service was created successfully.",
        });
        await catalog.loadAllData();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, catalog],
  );

  const startEdit = useCallback(
    (service: AdminService) => {
      form.startEdit(service);
      setIsModalOpen(true);
    },
    [form],
  );

  const onToggleActive = useCallback(
    async (service: AdminService) => {
      if (cannotDeactivateWhileActive(service)) {
        toast({
          variant: "destructive",
          title: "Cannot deactivate",
          description: "This service has linked bookings.",
        });
        return;
      }

      const token = getServicesBearerToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sign-in required",
          description: "You must sign in as an admin.",
        });
        return;
      }

      setTogglingId(service.id);
      try {
        await patchAdminServiceActive(token, service.id, !service.isActive);
        if (form.editingId === service.id) {
          form.resetForm();
        }
        toast({
          title: service.isActive ? "Service hidden" : "Service visible",
          description: service.isActive
            ? "The service was turned off."
            : "The service was turned on.",
        });
        await catalog.loadAllData();
      } catch (err) {
        toastApiError(err, "Error");
      } finally {
        setTogglingId(null);
      }
    },
    [form, catalog],
  );

  const openDeleteConfirm = useCallback((service: AdminService) => {
    if (!canDeleteService(service)) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description: getDeleteBlockedDescription(service),
      });
      return;
    }
    setPendingDelete(service);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const token = getServicesBearerToken();
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
      await deleteAdminService(token, pendingDelete.id);
      if (form.editingId === pendingDelete.id) {
        form.resetForm();
        setIsModalOpen(false);
      }
      setViewService((current) => (current?.id === pendingDelete.id ? null : current));
      toast({
        title: "Service deleted",
        description: "The service was removed from the catalog.",
      });
      setPendingDelete(null);
      await catalog.loadAllData();
    } catch (err) {
      toastApiError(err, "Error");
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, form, catalog]);

  const closeDeleteModal = useCallback(() => {
    if (!isDeleting) setPendingDelete(null);
  }, [isDeleting]);

  const onConfirmClearMedia = useCallback(async () => {
    if (!form.editingId) return;
    const token = getServicesBearerToken();
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsClearingMedia(true);
    try {
      await patchAdminServiceClearImage(token, form.editingId);
      form.setExistingImageUrl(null);
      form.setImage(null);
      form.setIsPreviewLightboxOpen(false);
      setPendingClearMedia(false);
      form.clearMediaFileInput();
      toast({
        title: "Media removed",
        description: "The file was deleted from storage and the service was updated.",
      });
      await catalog.loadAllData();
    } catch (err) {
      toastApiError(err, "Error");
    } finally {
      setIsClearingMedia(false);
    }
  }, [form, catalog]);

  const closeClearMediaModal = useCallback(() => {
    if (!isClearingMedia) setPendingClearMedia(false);
  }, [isClearingMedia]);

  const pendingDeleteTitle = pendingDelete
    ? displayServiceHeading(pendingDelete.description).title
    : "";

  return {
    catalog,
    list,
    form,
    isModalOpen,
    isSubmitting,
    togglingId,
    pendingDelete,
    pendingDeleteTitle,
    isDeleting,
    viewService,
    setViewService,
    pendingClearMedia,
    setPendingClearMedia,
    isClearingMedia,
    openCreateModal,
    closeModal,
    onSubmit,
    startEdit,
    onToggleActive,
    openDeleteConfirm,
    onConfirmDelete,
    closeDeleteModal,
    onConfirmClearMedia,
    closeClearMediaModal,
    canDeleteService,
    cannotDeactivateWhileActive,
    getDeleteBlockedTitle,
  };
}
