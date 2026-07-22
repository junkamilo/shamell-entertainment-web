"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ServiceTypeItem } from "@/features/admin/service-types/types/serviceTypes.types";
import { isVideoMediaFile, serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  ITEM_MAX_LENGTH,
} from "../lib/servicesConstants";
import {
  buildServiceUpsertFormData,
  normalizeItemsFromText,
  parsePriceInput,
} from "../lib/servicesFormUtils";
import type { AdminService, ServiceFormSnapshot } from "../types/services.types";

type Args = {
  serviceTypes: ServiceTypeItem[];
  serviceTypeId: string;
  setServiceTypeId: Dispatch<SetStateAction<string>>;
  isSubmitting: boolean;
};

export function useServicesForm({
  serviceTypes,
  serviceTypeId,
  setServiceTypeId,
  isSubmitting,
}: Args) {
  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [originalSnapshot, setOriginalSnapshot] = useState<ServiceFormSnapshot | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isPreviewLightboxOpen, setIsPreviewLightboxOpen] = useState(false);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const resetForm = useCallback(() => {
    setServiceTypeId((current) => current || serviceTypes.find((item) => item.isActive)?.id || "");
    setDescription("");
    setItemsText("");
    setPriceInput("");
    setImage(null);
    setExistingImageUrl(null);
    setEditingId(null);
    setOriginalSnapshot(null);
    setIsTypeDropdownOpen(false);
    setIsPreviewLightboxOpen(false);
    queueMicrotask(() => {
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
    });
  }, [serviceTypes, setServiceTypeId]);

  const normalizedItems = normalizeItemsFromText(itemsText);
  const trimmedDescription = description.trim();
  const hasValidDescriptionLength =
    trimmedDescription.length >= DESCRIPTION_MIN_LENGTH &&
    trimmedDescription.length <= DESCRIPTION_MAX_LENGTH;
  const hasValidItems =
    normalizedItems.length > 0 && normalizedItems.every((item) => item.length <= ITEM_MAX_LENGTH);
  const hasValidType = Boolean(serviceTypeId);
  const hasImageIfNeeded = editingId ? true : Boolean(image);
  const parsedPrice = parsePriceInput(priceInput);

  const hasChanges = editingId
    ? Boolean(
        originalSnapshot &&
          (serviceTypeId !== originalSnapshot.serviceTypeId ||
            trimmedDescription !== originalSnapshot.description ||
            normalizedItems.join("\n") !== originalSnapshot.itemsText ||
            (parsedPrice.ok ? parsedPrice.value : null) !== (originalSnapshot.price ?? null) ||
            Boolean(image)),
      )
    : Boolean(serviceTypeId || trimmedDescription || normalizedItems.length || image);

  const canSubmit =
    !isSubmitting &&
    hasValidType &&
    hasValidDescriptionLength &&
    hasValidItems &&
    parsedPrice.ok &&
    hasImageIfNeeded &&
    hasChanges;

  const formPreviewMediaIsVideo =
    Boolean(image && isVideoMediaFile(image)) ||
    Boolean(!image && serviceCatalogMediaTypeFromUrl(existingImageUrl) === "VIDEO");

  const getValidationError = () => {
    if (!hasValidType) return "You must select a service type.";
    if (!parsedPrice.ok) return "Invalid price.";
    if (!hasValidDescriptionLength) {
      return `The description must be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters.`;
    }
    if (!hasValidItems) return "Add at least one line item. Each line may be up to 180 characters.";
    if (!hasImageIfNeeded) return "You must select an image or video.";
    if (!hasChanges) return "No changes to save.";
    return null;
  };

  const buildUpsertFormData = () =>
    buildServiceUpsertFormData({
      serviceTypeId,
      description: trimmedDescription,
      items: normalizedItems,
      parsedPrice,
      editingId,
      image,
    });

  const startEdit = (service: AdminService) => {
    setEditingId(service.id);
    setServiceTypeId(service.serviceTypeId);
    setDescription(service.description);
    const itemsJoined = service.items.join("\n");
    setItemsText(itemsJoined);
    setPriceInput(service.price != null ? String(service.price) : "");
    setExistingImageUrl(service.imageUrl);
    setOriginalSnapshot({
      serviceTypeId: service.serviceTypeId,
      description: service.description.trim(),
      itemsText: itemsJoined,
      price: service.price ?? null,
    });
    setImage(null);
    queueMicrotask(() => {
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
    });
  };

  const clearMediaFileInput = useCallback(() => {
    queueMicrotask(() => {
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
    });
  }, []);

  const activeServiceTypes = serviceTypes.filter((item) => item.isActive);
  const selectedTypeName = activeServiceTypes.find((item) => item.id === serviceTypeId)?.name;

  return {
    serviceTypeId,
    setServiceTypeId,
    clearMediaFileInput,
    mediaFileInputRef,
    description,
    setDescription,
    itemsText,
    setItemsText,
    priceInput,
    setPriceInput,
    image,
    setImage,
    existingImageUrl,
    setExistingImageUrl,
    editingId,
    canSubmit,
    resetForm,
    startEdit,
    getValidationError,
    buildUpsertFormData,
    isTypeDropdownOpen,
    setIsTypeDropdownOpen,
    imagePreviewUrl,
    isPreviewLightboxOpen,
    setIsPreviewLightboxOpen,
    formPreviewMediaIsVideo,
    activeServiceTypes,
    selectedTypeName,
  };
}
