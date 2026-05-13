"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  SlidersHorizontal,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { AdminMediaPickControl } from "@/components/admin/AdminMediaPickControl";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";
import { isVideoMediaFile, serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { cn } from "@/lib/utils";

type AdminServiceType = {
  id: string;
  name: string;
  isActive: boolean;
};

type AdminService = {
  id: string;
  serviceTypeId: string;
  serviceTypeName: string;
  description: string;
  items: string[];
  price: number | null;
  imageUrl: string | null;
  isActive: boolean;
  bookingCount?: number;
  galleryPhotoCount?: number;
};

const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 5000;
const ITEM_MAX_LENGTH = 180;

const PAGE_SIZE = 6;

const TYPE_PILL_STYLES = [
  "border-rose-400/45 bg-rose-500/12 text-rose-100",
  "border-amber-400/40 bg-amber-500/12 text-amber-100",
  "border-teal-400/40 bg-teal-500/12 text-teal-100",
  "border-violet-400/35 bg-violet-500/12 text-violet-100",
];

function pillClassForTypeName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return TYPE_PILL_STYLES[Math.abs(h) % TYPE_PILL_STYLES.length];
}

function displayServiceHeading(description: string): { title: string; subtitle: string } {
  const t = description.trim();
  if (!t) return { title: "No description", subtitle: "" };
  const firstBlock = t.split(/\n/)[0]?.trim() ?? t;
  const title =
    firstBlock.length > 64 ? `${firstBlock.slice(0, 62).trim()}…` : firstBlock;
  let subtitle = "";
  if (t.includes("\n")) {
    subtitle = t
      .split(/\n/)
      .slice(1)
      .join(" ")
      .trim()
      .slice(0, 140);
  } else if (t.length > title.length) {
    subtitle = t.slice(title.length).trim().replace(/^\.+\s*/, "").slice(0, 140);
  }
  if (subtitle.length > 130) subtitle = `${subtitle.slice(0, 128)}…`;
  return { title, subtitle };
}

function formatPriceEn(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

/** List/table thumbnail: image preview, or static video glyph (no inline video in dense rows). */
function ServiceListMediaThumb({ imageUrl, size }: { imageUrl: string | null; size: "sm" | "md" }) {
  const dim = size === "sm" ? "h-11 w-11" : "h-14 w-14";
  const iconClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div
      className={cn(
        "shamell-glass-surface flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold/20",
        dim,
      )}
    >
      {!imageUrl ? (
        <span className="text-[10px] text-foreground/35">—</span>
      ) : serviceCatalogMediaTypeFromUrl(imageUrl) === "VIDEO" ? (
        <span className="flex h-full w-full items-center justify-center bg-black/35" title="Video">
          <Video className={cn("text-gold/90", iconClass)} strokeWidth={1.45} aria-hidden />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

type AdminServiceCardProps = {
  service: AdminService;
  togglingId: string | null;
  deletable: boolean;
  blockDeactivate: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
};

function AdminServiceCard({
  service,
  togglingId,
  deletable,
  blockDeactivate,
  onView,
  onEdit,
  onDelete,
  onToggle,
}: AdminServiceCardProps) {
  const { title } = displayServiceHeading(service.description);
  const bk = service.bookingCount ?? 0;
  const gal = service.galleryPhotoCount ?? 0;

  return (
    <article className="shamell-glass-surface flex flex-col gap-3 rounded-xl border border-gold/14 p-4">
      <div className="flex gap-3">
        <ServiceListMediaThumb imageUrl={service.imageUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-brand text-sm tracking-[0.04em] text-gold">{title}</p>
          {bk > 0 || gal > 0 ? (
            <p className="mt-1 font-body text-[10px] text-foreground/45">
              {bk > 0 ? `${bk} booking(s)` : null}
              {bk > 0 && gal > 0 ? " · " : null}
              {gal > 0 ? `${gal} in gallery` : null}
            </p>
          ) : null}
          <span
            className={cn(
              "mt-2 inline-flex max-w-full truncate rounded-full border px-2.5 py-1 font-body text-[11px]",
              pillClassForTypeName(service.serviceTypeName),
            )}
          >
            {service.serviceTypeName}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 pt-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-foreground/70">
          <span>
            <span className="font-brand text-[10px] tracking-[0.12em] text-gold/65">ITEMS</span>{" "}
            {service.items.length}
          </span>
          <span>
            <span className="font-brand text-[10px] tracking-[0.12em] text-gold/65">PRECIO</span>{" "}
            {formatPriceEn(service.price)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            disabled={togglingId === service.id || blockDeactivate}
            title={
              blockDeactivate ? "This service has bookings and cannot be turned off." : undefined
            }
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full border transition",
              service.isActive
                ? "border-emerald-400/45 bg-emerald-500/22"
                : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
              togglingId === service.id && "cursor-not-allowed opacity-60",
              blockDeactivate && "cursor-not-allowed opacity-45",
            )}
            aria-label={`${service.isActive ? "Hide" : "Show"} service`}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                service.isActive ? "left-6" : "left-1",
              )}
            />
          </button>
          <span className="font-body text-xs text-foreground/55">
            {service.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-1 border-t border-gold/10 pt-3">
        <button
          type="button"
          onClick={onView}
          className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
          aria-label="View service"
        >
          <Eye className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
          aria-label="Edit service"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!deletable}
          className={cn(
            "rounded-lg border p-2 transition",
            deletable
              ? "border-red-400/25 text-foreground/55 hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300"
              : "cursor-not-allowed border-gold/10 text-foreground/30",
          )}
          aria-label="Delete service permanently"
          title={
            !deletable
              ? bk > 0
                ? "Has linked bookings"
                : "Has linked gallery photos"
              : "Delete from catalog (irreversible)"
          }
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}

type FilterTab = "all" | "active" | "inactive";

export default function ShamellAdminServicesPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const [serviceTypeId, setServiceTypeId] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [typeFilterId, setTypeFilterId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [viewService, setViewService] = useState<AdminService | null>(null);

  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [originalSnapshot, setOriginalSnapshot] = useState<{
    serviceTypeId: string;
    description: string;
    itemsText: string;
    price: number | null;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState<AdminService[]>([]);
  const [serviceTypes, setServiceTypes] = useState<AdminServiceType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isPreviewLightboxOpen, setIsPreviewLightboxOpen] = useState(false);
  const [pendingClearMedia, setPendingClearMedia] = useState(false);
  const [isClearingMedia, setIsClearingMedia] = useState(false);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const resetForm = useCallback(() => {
    setServiceTypeId((current) => current || serviceTypes.find((item) => item.isActive)?.id || "");
    setDescription("");
    setItemsText("");
    setPriceInput("");
    setImage(null);
    setExistingImageUrl(null);
    setEditingId(null);
    setOriginalSnapshot(null);
    queueMicrotask(() => {
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
    });
  }, [serviceTypes]);

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsTypeDropdownOpen(false);
    setIsPreviewLightboxOpen(false);
    setPendingClearMedia(false);
    resetForm();
  };

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const loadAllData = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setServices([]);
      setServiceTypes([]);
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [typesResponse, servicesResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/services/types/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/v1/services/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const typesData = await typesResponse.json().catch(() => []);
      if (!typesResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(typesData, "Could not load service types."),
        });
        return;
      }

      const normalizedTypes = Array.isArray(typesData) ? (typesData as AdminServiceType[]) : [];
      setServiceTypes(normalizedTypes);
      if (normalizedTypes.length > 0 && !serviceTypeId) {
        const firstActive = normalizedTypes.find((item) => item.isActive);
        setServiceTypeId(firstActive?.id ?? normalizedTypes[0].id);
      }

      const servicesData = await servicesResponse.json().catch(() => []);
      if (!servicesResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(servicesData, "Could not load services."),
        });
        return;
      }
      setServices(
        Array.isArray(servicesData)
          ? (servicesData as Record<string, unknown>[]).map((row) => ({
              id: String(row.id),
              serviceTypeId: String(row.serviceTypeId ?? ""),
              serviceTypeName: String(row.serviceTypeName ?? ""),
              description: String(row.description ?? ""),
              items: Array.isArray(row.items) ? (row.items as unknown[]).map((x) => String(x)) : [],
              price:
                row.price === null || row.price === undefined
                  ? null
                  : typeof row.price === "number"
                    ? row.price
                    : Number(row.price),
              imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : null,
              isActive: Boolean(row.isActive),
              bookingCount: typeof row.bookingCount === "number" ? row.bookingCount : 0,
              galleryPhotoCount: typeof row.galleryPhotoCount === "number" ? row.galleryPhotoCount : 0,
            }))
          : [],
      );
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, parseErrorMessage, serviceTypeId]);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const normalizedItems = itemsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const trimmedDescription = description.trim();
  const hasValidDescriptionLength =
    trimmedDescription.length >= DESCRIPTION_MIN_LENGTH &&
    trimmedDescription.length <= DESCRIPTION_MAX_LENGTH;
  const hasValidItems = normalizedItems.length > 0 && normalizedItems.every((item) => item.length <= ITEM_MAX_LENGTH);
  const hasValidType = Boolean(serviceTypeId);
  const hasImageIfNeeded = editingId ? true : Boolean(image);
  const parsedPrice = (() => {
    const t = priceInput.trim();
    if (!t) return { ok: true as const, value: null as number | null };
    const n = Number(t.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return { ok: false as const, value: null as number | null };
    return { ok: true as const, value: Math.round(n * 100) / 100 };
  })();

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
    !isSubmitting && hasValidType && hasValidDescriptionLength && hasValidItems && hasImageIfNeeded && hasChanges;

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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin to manage services.",
      });
      return;
    }

    const validationError = getValidationError();
    if (validationError) {
      toast({
        variant: "destructive",
        title: "Check the form",
        description: validationError,
      });
      return;
    }

    const formData = new FormData();
    formData.append("serviceTypeId", serviceTypeId);
    formData.append("description", trimmedDescription);
    normalizedItems.forEach((item) => formData.append("items", item));
    if (parsedPrice.ok && parsedPrice.value !== null) {
      formData.append("price", String(parsedPrice.value));
    } else if (editingId && parsedPrice.ok && parsedPrice.value === null) {
      formData.append("price", "");
    }
    if (image) {
      formData.append("image", image);
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingId
        ? `${apiBaseUrl}/api/v1/services/admin/${editingId}`
        : `${apiBaseUrl}/api/v1/services/admin`;
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not save the service."),
        });
        return;
      }

      const wasEditing = Boolean(editingId);
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
      resetForm();
      setIsModalOpen(false);
      toast({
        title: wasEditing ? "Service updated" : "Service created",
        description: wasEditing
          ? "Service changes were saved."
          : "The new service was created successfully.",
      });
      await loadAllData();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    setIsModalOpen(true);
  };

  const onToggleActive = async (service: AdminService) => {
    if (service.isActive && (service.bookingCount ?? 0) > 0) {
      toast({
        variant: "destructive",
        title: "Cannot deactivate",
        description: "This service has linked bookings.",
      });
      return;
    }

    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
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
      const response = await fetch(`${apiBaseUrl}/api/v1/services/admin/${service.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: (() => {
          const form = new FormData();
          form.append("isActive", String(!service.isActive));
          return form;
        })(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not update service status."),
        });
        return;
      }

      if (editingId === service.id) {
        resetForm();
      }
      toast({
        title: service.isActive ? "Service hidden" : "Service visible",
        description: service.isActive
          ? "The service was turned off."
          : "The service was turned on.",
      });
      await loadAllData();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const canDeleteService = (s: AdminService) =>
    (s.bookingCount ?? 0) === 0 && (s.galleryPhotoCount ?? 0) === 0;

  const cannotDeactivateWhileActive = (s: AdminService) =>
    s.isActive && (s.bookingCount ?? 0) > 0;

  const openDeleteConfirm = (service: AdminService) => {
    if (!canDeleteService(service)) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description:
          (service.bookingCount ?? 0) > 0
            ? "This service has linked bookings."
            : "There are gallery photos linked to this service.",
      });
      return;
    }
    setPendingDelete(service);
  };

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
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
      const response = await fetch(`${apiBaseUrl}/api/v1/services/admin/${pendingDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not delete the service."),
        });
        return;
      }

      if (editingId === pendingDelete.id) {
        resetForm();
        setIsModalOpen(false);
      }
      if (viewService?.id === pendingDelete.id) {
        setViewService(null);
      }

      toast({
        title: "Service deleted",
        description: "The service was removed from the catalog.",
      });
      setPendingDelete(null);
      await loadAllData();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const onConfirmClearMedia = async () => {
    if (!editingId) return;
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
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
      const form = new FormData();
      form.append("clearImage", "true");
      const response = await fetch(`${apiBaseUrl}/api/v1/services/admin/${editingId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not remove the media."),
        });
        return;
      }

      setExistingImageUrl(null);
      setImage(null);
      setIsPreviewLightboxOpen(false);
      setPendingClearMedia(false);
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
      toast({
        title: "Media removed",
        description: "The file was deleted from storage and the service was updated.",
      });
      await loadAllData();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsClearingMedia(false);
    }
  };

  const onHeroAction = () => openCreateModal();

  const searchedServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter((service) => {
      const searchable = [
        service.serviceTypeName,
        service.description,
        formatPriceEn(service.price),
        ...service.items,
        service.isActive ? "activo" : "inactivo",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [services, searchQuery]);

  const tabCounts = useMemo(() => {
    const all = searchedServices.length;
    const active = searchedServices.filter((s) => s.isActive).length;
    return { all, active, inactive: all - active };
  }, [searchedServices]);

  const filteredServices = useMemo(() => {
    let list = searchedServices;
    if (filterTab === "active") list = list.filter((s) => s.isActive);
    if (filterTab === "inactive") list = list.filter((s) => !s.isActive);
    if (typeFilterId) list = list.filter((s) => s.serviceTypeId === typeFilterId);
    return list;
  }, [searchedServices, filterTab, typeFilterId]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTab, typeFilterId]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageOffset = (safePage - 1) * PAGE_SIZE;
  const paginatedServices = filteredServices.slice(pageOffset, pageOffset + PAGE_SIZE);

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.isActive).length;
    const itemsTotal = services.reduce((acc, s) => acc + s.items.length, 0);
    return { total, active, inactive: total - active, itemsTotal };
  }, [services]);

  const typeMostUsedLabel = useMemo(() => {
    if (services.length === 0) return "—";
    const counts: Record<string, number> = {};
    for (const s of services) {
      const id = s.serviceTypeId;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    let bestId = "";
    let bestCount = 0;
    for (const [id, c] of Object.entries(counts)) {
      if (c > bestCount || (c === bestCount && (bestId === "" || id < bestId))) {
        bestCount = c;
        bestId = id;
      }
    }
    const name = serviceTypes.find((t) => t.id === bestId)?.name ?? bestId;
    const raw = name.trim() || "—";
    return raw.length > 22 ? `${raw.slice(0, 20)}…` : raw;
  }, [services, serviceTypes]);

  const activeServiceTypes = serviceTypes.filter((item) => item.isActive);
  const selectedTypeName = activeServiceTypes.find((item) => item.id === serviceTypeId)?.name;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Services"
        actionLabel="New service"
        onAction={onHeroAction}
        bordered={false}
      />

      {serviceTypes.filter((item) => item.isActive).length === 0 ? (
        <div className="mb-8 shamell-glass-surface rounded-xl px-5 py-4 text-sm text-foreground/75">
          No active service types.{" "}
          <Link href="/shamell-admin/service-types" className="text-gold underline underline-offset-2">
            Go to service types
          </Link>
          .
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["TOTAL SERVICES", String(stats.total)],
            ["ACTIVE", String(stats.active)],
            ["TOTAL ITEMS", String(stats.itemsTotal)],
            ["MOST-USED TYPE", typeMostUsedLabel],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="shamell-glass-surface rounded-xl px-4 py-3"
          >
            <p className="font-brand text-[10px] tracking-[0.16em] text-gold/75">{label}</p>
            <p className="mt-1 truncate font-brand text-lg tracking-wide text-gold md:text-xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 shamell-glass-surface overflow-hidden rounded-xl">
        <div className="flex flex-col gap-4 p-4 md:p-5 lg:flex-row lg:items-stretch lg:gap-4">
          <AdminSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search services..."
            className="mx-0 min-h-12 max-w-none flex-1 rounded-xl border border-gold/22 bg-black/20"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
            <div className="flex rounded-xl border border-gold/18 bg-black/20 p-1">
              {(
                [
                  ["all", "All", tabCounts.all],
                  ["active", "Active", tabCounts.active],
                  ["inactive", "Inactive", tabCounts.inactive],
                ] as const
              ).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterTab(id)}
                  className={cn(
                    "flex-1 whitespace-nowrap rounded-lg px-3 py-2.5 font-brand text-[10px] tracking-[0.12em] transition sm:flex-none sm:px-4",
                    filterTab === id
                      ? "bg-gold/12 text-gold shadow-inner"
                      : "text-foreground/50 hover:text-foreground/80",
                  )}
                >
                  {label} <span className="text-gold/50">•</span> {count}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="services-type-filters"
              id="services-filters-toggle"
              onClick={() => setFiltersOpen((o) => !o)}
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 font-brand text-[10px] tracking-[0.14em] transition",
                filtersOpen
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-gold/18 text-foreground/60 hover:border-gold/35 hover:text-gold",
              )}
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              Filters
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-gold/80 transition-transform duration-200", filtersOpen && "rotate-180")}
                aria-hidden
              />
            </button>
          </div>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
            filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              id="services-type-filters"
              role="region"
              aria-labelledby="services-filters-toggle"
              className="border-t border-gold/12 px-4 pb-4 md:px-5 md:pb-5"
            >
              <div className="pt-4">
                <p className="font-brand text-[10px] tracking-[0.2em] text-gold/80">SERVICE TYPE</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTypeFilterId(null)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 font-body text-xs transition",
                      typeFilterId === null
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-gold/15 text-foreground/55 hover:border-gold/30",
                    )}
                  >
                    All types
                  </button>
                  {serviceTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeFilterId((prev) => (prev === t.id ? null : t.id))}
                      className={cn(
                        "rounded-full border px-3 py-1.5 font-body text-xs transition",
                        typeFilterId === t.id
                          ? "border-gold/50 bg-gold/10 text-gold"
                          : "border-gold/15 text-foreground/55 hover:border-gold/30",
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="shamell-glass-surface rounded-xl p-4 md:p-5">
        {filteredServices.length === 0 ? (
          isLoading ? (
            <p className="py-12 text-center font-body text-sm text-foreground/65">Loading...</p>
          ) : (
            <p className="py-12 text-center font-body text-sm text-foreground/60">No services to show.</p>
          )
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {paginatedServices.map((service) => {
                const deletable = canDeleteService(service);
                const blockDeactivate = cannotDeactivateWhileActive(service);
                return (
                  <AdminServiceCard
                    key={service.id}
                    service={service}
                    togglingId={togglingId}
                    deletable={deletable}
                    blockDeactivate={blockDeactivate}
                    onView={() => setViewService(service)}
                    onEdit={() => startEdit(service)}
                    onDelete={() => openDeleteConfirm(service)}
                    onToggle={() => void onToggleActive(service)}
                  />
                );
              })}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-gold/14 md:block">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gold/12">
                    <th className="w-14 px-2 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/70" />
                    <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">SERVICE</th>
                    <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">TYPE</th>
                    <th className="w-20 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">ITEMS</th>
                    <th className="w-24 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">PRECIO</th>
                    <th className="min-w-[9rem] px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">
                      ESTADO
                    </th>
                    <th className="w-36 px-3 py-3 text-right font-brand text-[10px] tracking-[0.14em] text-gold/80">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedServices.map((service) => {
                    const { title } = displayServiceHeading(service.description);
                    const bk = service.bookingCount ?? 0;
                    const gal = service.galleryPhotoCount ?? 0;
                    const deletable = canDeleteService(service);
                    const blockDeactivate = cannotDeactivateWhileActive(service);
                    return (
                      <tr key={service.id} className="border-b border-gold/8 transition hover:bg-gold/5">
                        <td className="px-2 py-3 align-middle">
                          <ServiceListMediaThumb imageUrl={service.imageUrl} size="sm" />
                        </td>
                        <td className="max-w-[14rem] px-3 py-3 align-middle md:max-w-[18rem]">
                          <p className="font-brand text-sm tracking-[0.04em] text-gold">{title}</p>
                          {bk > 0 || gal > 0 ? (
                            <p className="mt-1 font-body text-[10px] text-foreground/45">
                              {bk > 0 ? `${bk} booking(s)` : null}
                              {bk > 0 && gal > 0 ? " · " : null}
                              {gal > 0 ? `${gal} in gallery` : null}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-1 font-body text-[11px]",
                              pillClassForTypeName(service.serviceTypeName),
                            )}
                          >
                            {service.serviceTypeName}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle font-body text-sm text-foreground/75">
                          {service.items.length}
                        </td>
                        <td className="px-3 py-3 align-middle font-body text-sm text-foreground/75">
                          {formatPriceEn(service.price)}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => void onToggleActive(service)}
                              disabled={togglingId === service.id || blockDeactivate}
                              title={
                                blockDeactivate
                                  ? "This service has bookings and cannot be turned off."
                                  : undefined
                              }
                              className={cn(
                                "relative h-7 w-12 shrink-0 rounded-full border transition",
                                service.isActive
                                  ? "border-emerald-400/45 bg-emerald-500/22"
                                  : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
                                togglingId === service.id && "cursor-not-allowed opacity-60",
                                blockDeactivate && "cursor-not-allowed opacity-45",
                              )}
                              aria-label={`${service.isActive ? "Hide" : "Show"} service`}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                                  service.isActive ? "left-6" : "left-1",
                                )}
                              />
                            </button>
                            <span className="font-body text-xs text-foreground/55">
                              {service.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewService(service)}
                              className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
                              aria-label="View service"
                            >
                              <Eye className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(service)}
                              className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
                              aria-label="Edit service"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirm(service)}
                              disabled={!deletable}
                              className={cn(
                                "rounded-lg border p-2 transition",
                                deletable
                                  ? "border-red-400/25 text-foreground/55 hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300"
                                  : "cursor-not-allowed border-gold/10 text-foreground/30",
                              )}
                              aria-label="Delete service permanently"
                              title={
                                !deletable
                                  ? bk > 0
                                    ? "Has linked bookings"
                                    : "Has linked gallery photos"
                                  : "Delete from catalog (irreversible)"
                              }
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {filteredServices.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-gold/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-xs text-foreground/50">
              Mostrando {pageOffset + 1}-{pageOffset + paginatedServices.length} de {filteredServices.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gold/20 p-2 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    "min-w-[2.25rem] rounded-lg border px-2.5 py-1.5 font-brand text-xs tracking-wide transition",
                    n === safePage
                      ? "border-gold/55 bg-gold/12 text-gold"
                      : "border-transparent text-foreground/50 hover:border-gold/25 hover:text-gold",
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gold/20 p-2 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {isLoading && filteredServices.length > 0 ? (
          <p className="mt-3 text-sm text-foreground/65">Refreshing...</p>
        ) : null}
      </section>

      <AdminModal
        title={editingId ? "Edit service" : "New service"}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form id="service-form" noValidate onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">SERVICE TYPE</span>
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => {
                  if (activeServiceTypes.length === 0) return;
                  setIsTypeDropdownOpen((prev) => !prev);
                }}
                className="shamell-glass-trigger flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm text-foreground"
              >
                <span className={selectedTypeName ? "text-foreground" : "text-foreground/55"}>
                  {selectedTypeName ?? "Create a service type first"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gold/80 transition ${isTypeDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isTypeDropdownOpen && activeServiceTypes.length > 0 ? (
                <div className="shamell-scrollbar absolute left-0 top-14 z-40 max-h-56 w-full overflow-y-auto rounded-xl border border-gold/35 bg-[#0b0f14] p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
                  {activeServiceTypes.map((item) => {
                    const isSelected = serviceTypeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setServiceTypeId(item.id);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`mb-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition last:mb-0 ${
                          isSelected
                            ? "border border-gold/35 bg-gold/15 text-gold"
                            : "border border-transparent text-foreground/80 hover:border-gold/20 hover:bg-gold/10 hover:text-gold-light"
                        }`}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">DESCRIPCION</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder="Describe the service..."
            />
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">ITEMS (UNO POR LINEA)</span>
            <p className="mt-1 text-xs text-foreground/55 font-body">
              Example bullets on the site (weddings, yachts…). One line = one bullet in the public experience.
            </p>
            <textarea
              value={itemsText}
              onChange={(event) => setItemsText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder={"Item 1\nItem 2\nItem 3"}
            />
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">PRECIO (OPCIONAL)</span>
            <input
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder="e.g. 2500 or 2500.50"
            />
          </label>

          <div className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">IMAGEN O VIDEO</span>
            <AdminMediaPickControl
              ref={mediaFileInputRef}
              onFileChange={(file) => setImage(file)}
              selectedFileName={image?.name ?? null}
              disabled={isSubmitting || isClearingMedia}
              aria-label="Select image or video for this service"
            />
          </div>

          {imagePreviewUrl || existingImageUrl ? (
            <div className="shamell-glass-surface rounded-xl p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs text-gold/85">
                  {imagePreviewUrl
                    ? image && isVideoMediaFile(image)
                      ? "Preview of selected video"
                      : "Preview of selected image"
                    : serviceCatalogMediaTypeFromUrl(existingImageUrl) === "VIDEO"
                      ? "Current service video"
                      : "Current service image"}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  {imagePreviewUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setIsPreviewLightboxOpen(false);
                        if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
                      }}
                      className="rounded-full border border-gold/30 p-1 text-gold/85 transition hover:bg-gold/10 hover:text-gold"
                      aria-label="Remove selected file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {editingId && !image && existingImageUrl ? (
                    <button
                      type="button"
                      onClick={() => setPendingClearMedia(true)}
                      disabled={isClearingMedia}
                      className="rounded-full border border-red-400/35 p-1.5 text-red-300/90 transition hover:bg-red-500/15 disabled:opacity-45"
                      aria-label="Delete saved media from storage"
                      title="Remove from Cloudinary and database"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="shamell-glass-surface overflow-hidden rounded-lg p-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewLightboxOpen(true)}
                  className="block w-full"
                  aria-label="Open enlarged preview"
                >
                  {formPreviewMediaIsVideo ? (
                    <video
                      src={imagePreviewUrl ?? existingImageUrl ?? ""}
                      className="h-44 w-full rounded-md object-cover transition hover:opacity-90"
                      muted
                      playsInline
                      controls
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreviewUrl ?? existingImageUrl ?? ""}
                      alt="Vista previa"
                      className="h-44 w-full rounded-md object-cover transition hover:opacity-90"
                    />
                  )}
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : editingId ? "Save changes" : "Create service"}
            </button>
          </div>
        </form>
      </AdminModal>

      {isPreviewLightboxOpen && (imagePreviewUrl || existingImageUrl) ? (
        <div
          className="fixed inset-0 z-95 flex items-center justify-center bg-black/85 px-4 py-8"
          onClick={() => setIsPreviewLightboxOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl border border-gold/30 bg-[#0a0d12] p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPreviewLightboxOpen(false)}
              className="shamell-glass-surface absolute right-3 top-3 z-10 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            {formPreviewMediaIsVideo ? (
              <video
                src={imagePreviewUrl ?? existingImageUrl ?? ""}
                className="max-h-[82vh] w-full rounded-xl object-contain"
                controls
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreviewUrl ?? existingImageUrl ?? ""}
                alt="Vista ampliada"
                className="max-h-[82vh] w-full rounded-xl object-contain"
              />
            )}
          </div>
        </div>
      ) : null}

      {viewService ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 px-4 py-8"
          onClick={() => setViewService(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/25 bg-[#0c0c0c] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewService(null)}
              className="shamell-glass-surface absolute right-3 top-3 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="font-brand text-[10px] tracking-[0.2em] text-gold/75">QUICK LOOK</p>
            <h2 className="mt-2 font-brand text-xl text-gold">
              {displayServiceHeading(viewService.description).title}
            </h2>
            <p className="mt-1 font-body text-xs text-foreground/45">{viewService.serviceTypeName}</p>
            <p className="mt-2 font-brand text-[10px] tracking-[0.14em] text-gold/80">
              PRECIO <span className="font-body text-foreground/70">{formatPriceEn(viewService.price)}</span>
            </p>
            {viewService.imageUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-gold/15">
                {serviceCatalogMediaTypeFromUrl(viewService.imageUrl) === "VIDEO" ? (
                  <video
                    src={viewService.imageUrl}
                    className="max-h-56 w-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viewService.imageUrl} alt="" className="max-h-56 w-full object-cover" />
                )}
              </div>
            ) : null}
            <p className="mt-4 font-body text-sm leading-relaxed text-foreground/70">{viewService.description}</p>
            <p className="mt-3 font-body text-xs text-foreground/45">
              {viewService.items.length} item(s) · {viewService.isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      ) : null}

      <AdminModal
        title="Remove service media"
        isOpen={pendingClearMedia}
        onClose={() => {
          if (!isClearingMedia) setPendingClearMedia(false);
        }}
      >
        <div className="space-y-5 font-body text-sm text-foreground/85">
          <p>
            Delete this service&apos;s image or video from Cloudinary and clear it in the database? You can upload a
            new file afterward. This cannot be undone.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPendingClearMedia(false)}
              disabled={isClearingMedia}
              className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onConfirmClearMedia()}
              disabled={isClearingMedia}
              className="rounded-xl border border-red-400/45 bg-red-500/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClearingMedia ? "Removing..." : "Remove media"}
            </button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        title="Delete service"
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
      >
        <div className="space-y-5 font-body text-sm text-foreground/85">
          <p>
            Permanently delete{" "}
            <span className="font-brand text-gold">
              {pendingDelete ? displayServiceHeading(pendingDelete.description).title : ""}
            </span>
            This will remove it from the catalog and cloud storage (cannot be undone).
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              disabled={isDeleting}
              className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onConfirmDelete()}
              disabled={isDeleting}
              className="rounded-xl border border-red-400/45 bg-red-500/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
