"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AdminEventType = { id: string; name: string; isActive: boolean };

type AdminEvent = {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  description: string;
  items: string[];
  price: number | null;
  catalogImages: { id: string; imageUrl: string }[];
  isActive: boolean;
  showOnHome: boolean;
  createdAt?: string;
  updatedAt?: string;
  bookingCount?: number;
  galleryPhotoCount?: number;
};

const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 5000;
const ITEM_MAX_LENGTH = 180;
const PAGE_SIZE = 6;
const MAX_CATALOG_IMAGES = 12;

function parseOptionalPrice(
  raw: string,
  mode: "create" | "edit",
): { ok: true; value: number | null | undefined } | { ok: false; message: string } {
  const t = raw.trim();
  if (!t) return { ok: true, value: mode === "edit" ? null : undefined };
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return { ok: false, message: "Invalid price." };
  if (n > 99_999_999.99) return { ok: false, message: "Price is too high." };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

function formatPriceEn(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatPriceInput(value: number): string {
  return String(value);
}

const TYPE_PILL_STYLES = [
  "border-gold/50 bg-gold/12 text-gold-light",
  "border-rose-400/45 bg-rose-500/12 text-rose-100",
  "border-sky-400/40 bg-sky-500/12 text-sky-100",
  "border-amber-400/40 bg-amber-500/12 text-amber-100",
  "border-teal-400/40 bg-teal-500/12 text-teal-100",
];

function pillClassForTypeName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return TYPE_PILL_STYLES[Math.abs(h) % TYPE_PILL_STYLES.length];
}

function displayEventHeading(description: string): { title: string; subtitle: string } {
  const t = description.trim();
  if (!t) return { title: "No description", subtitle: "" };
  const firstBlock = t.split(/\n/)[0]?.trim() ?? t;
  const title = firstBlock.length > 64 ? `${firstBlock.slice(0, 62).trim()}…` : firstBlock;
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

function formatShortDateUs(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" }).replace(".", "");
}

type FilterTab = "all" | "upcoming" | "completed";

export default function ShamellAdminEventsPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001", []);

  const [eventTypeId, setEventTypeId] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [viewEvent, setViewEvent] = useState<AdminEvent | null>(null);

  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [existingImages, setExistingImages] = useState<{ id: string; imageUrl: string }[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [originalSnapshot, setOriginalSnapshot] = useState<{
    eventTypeId: string;
    description: string;
    itemsText: string;
    price: number | null;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<AdminEventType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const resetForm = useCallback(() => {
    setEventTypeId((current) => current || eventTypes.find((item) => item.isActive)?.id || "");
    setDescription("");
    setItemsText("");
    setPriceInput("");
    setExistingImages([]);
    setPendingFiles([]);
    setEditingId(null);
    setOriginalSnapshot(null);
  }, [eventTypes]);

  const pendingPreviewUrls = useMemo(() => pendingFiles.map((f) => URL.createObjectURL(f)), [pendingFiles]);
  useEffect(() => {
    return () => pendingPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [pendingPreviewUrls]);

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsTypeDropdownOpen(false);
    resetForm();
  };

  const loadAllData = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setEvents([]);
      setEventTypes([]);
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [typesResponse, eventsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/events/types/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/v1/events/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const typesData = await typesResponse.json().catch(() => []);
      if (!typesResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(typesData, "Could not load event types."),
        });
        return;
      }

      const normalizedTypes = Array.isArray(typesData)
        ? (typesData as Record<string, unknown>[]).map((t) => ({
            id: String(t.id),
            name: String(t.name),
            isActive: Boolean(t.isActive),
          }))
        : [];
      setEventTypes(normalizedTypes);
      if (normalizedTypes.length > 0 && !eventTypeId) {
        const firstActive = normalizedTypes.find((item) => item.isActive);
        setEventTypeId(firstActive?.id ?? normalizedTypes[0].id);
      }

      const eventsData = await eventsResponse.json().catch(() => []);
      if (!eventsResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(eventsData, "Could not load events."),
        });
        return;
      }
      setEvents(
        Array.isArray(eventsData)
          ? (eventsData as Record<string, unknown>[]).map((ev) => {
              const rawPrice = ev.price;
              const priceParsed =
                rawPrice === null || rawPrice === undefined
                  ? null
                  : typeof rawPrice === "number"
                    ? rawPrice
                    : Number(rawPrice);
              const catalogRaw = ev.catalogImages;
              const catalogImages = Array.isArray(catalogRaw)
                ? (catalogRaw as Record<string, unknown>[]).flatMap((row) => {
                    const id = row.id != null ? String(row.id) : "";
                    const imageUrl = row.imageUrl != null ? String(row.imageUrl) : "";
                    return id && imageUrl ? [{ id, imageUrl }] : [];
                  })
                : [];
              return {
                id: String(ev.id),
                eventTypeId: String(ev.eventTypeId),
                eventTypeName: String(ev.eventTypeName ?? ""),
                description: String(ev.description ?? ""),
                items: Array.isArray(ev.items) ? (ev.items as string[]) : [],
                price: Number.isFinite(priceParsed as number) ? (priceParsed as number) : null,
                catalogImages,
                isActive: Boolean(ev.isActive),
                showOnHome: ev.showOnHome !== undefined ? Boolean(ev.showOnHome) : true,
                createdAt: typeof ev.createdAt === "string" ? ev.createdAt : undefined,
                updatedAt: typeof ev.updatedAt === "string" ? ev.updatedAt : undefined,
                bookingCount: typeof ev.bookingCount === "number" ? ev.bookingCount : 0,
                galleryPhotoCount: typeof ev.galleryPhotoCount === "number" ? ev.galleryPhotoCount : 0,
              };
            })
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
  }, [apiBaseUrl, eventTypeId, parseErrorMessage]);

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
  const hasValidType = Boolean(eventTypeId);
  const priceMode = editingId ? ("edit" as const) : ("create" as const);
  const priceResult = parseOptionalPrice(priceInput, priceMode);

  const hasChanges = editingId
    ? Boolean(
        originalSnapshot &&
          (eventTypeId !== originalSnapshot.eventTypeId ||
            trimmedDescription !== originalSnapshot.description ||
            normalizedItems.join("\n") !== originalSnapshot.itemsText ||
            pendingFiles.length > 0 ||
            (priceResult.ok && (originalSnapshot.price ?? null) !== (priceResult.value ?? null))),
      )
    : Boolean(
        eventTypeId ||
          trimmedDescription ||
          normalizedItems.length ||
          Boolean(priceInput.trim()) ||
          pendingFiles.length > 0,
      );

  const priceOk = priceResult.ok;
  const canSubmit =
    !isSubmitting && hasValidType && hasValidDescriptionLength && hasValidItems && priceOk && hasChanges;

  const getValidationError = () => {
    if (!hasValidType) return "You must select an event type.";
    if (!priceOk) return priceResult.message;
    if (!hasValidDescriptionLength) {
      return `The description must be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters.`;
    }
    if (!hasValidItems) return "Add at least one line item. Each line may be up to 180 characters.";
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
        description: "You must sign in as an admin to manage events.",
      });
      return;
    }

    const validationError = getValidationError();
    if (validationError) {
      toast({ variant: "destructive", title: "Check the form", description: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingId
        ? `${apiBaseUrl}/api/v1/events/admin/${editingId}`
        : `${apiBaseUrl}/api/v1/events/admin`;
      const method = editingId ? "PATCH" : "POST";
      const pricePayload =
        editingId && priceResult.ok
          ? { price: priceResult.value ?? null }
          : !editingId && priceResult.ok && priceResult.value !== undefined
            ? { price: priceResult.value }
            : {};

      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId,
          description: trimmedDescription,
          items: normalizedItems,
          showOnHome: true,
          ...pricePayload,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not save the event."),
        });
        return;
      }

      const payload = data as { event?: { id?: string } };
      const savedId = editingId ?? (payload.event?.id ? String(payload.event.id) : undefined);
      if (savedId && pendingFiles.length > 0) {
        const fd = new FormData();
        pendingFiles.forEach((f) => fd.append("media", f));
        const imgRes = await fetch(`${apiBaseUrl}/api/v1/events/admin/${savedId}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const imgData = await imgRes.json().catch(() => ({}));
        if (!imgRes.ok) {
          toast({
            variant: "destructive",
            title: "Images not saved",
            description: parseErrorMessage(imgData, "The event was saved but image upload failed."),
          });
        }
      }

      const wasEditing = Boolean(editingId);
      closeModal();
      toast({
        title: wasEditing ? "Event updated" : "Event created",
        description: wasEditing
          ? "Event changes were saved successfully."
          : "The new event was created successfully.",
      });
      await loadAllData();
    } catch {
      toast({ variant: "destructive", title: "Offline", description: "Could not reach the server." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: AdminEvent) => {
    setEditingId(item.id);
    setEventTypeId(item.eventTypeId);
    setDescription(item.description);
    const itemsJoined = item.items.join("\n");
    setItemsText(itemsJoined);
    setPriceInput(item.price != null ? formatPriceInput(item.price) : "");
    setExistingImages(item.catalogImages);
    setPendingFiles([]);
    setOriginalSnapshot({
      eventTypeId: item.eventTypeId,
      description: item.description.trim(),
      itemsText: itemsJoined,
      price: item.price ?? null,
    });
    setIsModalOpen(true);
  };

  const onPickCatalogImages = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next: File[] = [];
    const capacity = MAX_CATALOG_IMAGES - existingImages.length - pendingFiles.length;
    if (capacity <= 0) return;
    for (let i = 0; i < fileList.length && next.length < capacity; i++) {
      const f = fileList.item(i);
      if (!f || !f.type.startsWith("image/")) continue;
      next.push(f);
    }
    if (next.length) setPendingFiles((prev) => [...prev, ...next]);
  };

  const removePendingAt = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingCatalogImage = async (photoId: string) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/gallery/admin/photos/${photoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const delData = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(delData, "Could not delete the image."),
        });
        return;
      }
      setExistingImages((prev) => prev.filter((p) => p.id !== photoId));
      toast({ title: "Image removed" });
      await loadAllData();
    } catch {
      toast({ variant: "destructive", title: "Offline", description: "Could not reach the server." });
    }
  };

  const onToggleActive = async (item: AdminEvent) => {
    if (item.isActive && (item.bookingCount ?? 0) > 0) {
      toast({
        variant: "destructive",
        title: "Cannot deactivate",
        description: "This event has linked bookings.",
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

    setTogglingId(item.id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/events/admin/${item.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not update the event status."),
        });
        return;
      }

      if (editingId === item.id) {
        resetForm();
      }

      toast({
        title: item.isActive ? "Event hidden" : "Event visible",
        description: item.isActive
          ? "The event is hidden from the catalog."
          : "The event is visible again in the catalog.",
      });
      await loadAllData();
    } catch {
      toast({ variant: "destructive", title: "Offline", description: "Could not reach the server." });
    } finally {
      setTogglingId(null);
    }
  };

  const canDeleteEvent = (item: AdminEvent) =>
    (item.bookingCount ?? 0) === 0 && (item.galleryPhotoCount ?? 0) === 0;

  const cannotDeactivateWhileActive = (item: AdminEvent) =>
    item.isActive && (item.bookingCount ?? 0) > 0;

  const openDeleteConfirm = (item: AdminEvent) => {
    if (!canDeleteEvent(item)) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description:
          (item.bookingCount ?? 0) > 0
            ? "This event has linked bookings."
            : "Remove linked catalog images before deleting this event.",
      });
      return;
    }
    setPendingDelete(item);
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
      const response = await fetch(`${apiBaseUrl}/api/v1/events/admin/${pendingDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not delete the event."),
        });
        return;
      }

      if (editingId === pendingDelete.id) {
        resetForm();
        setIsModalOpen(false);
      }
      if (viewEvent?.id === pendingDelete.id) {
        setViewEvent(null);
      }

      toast({
        title: "Event deleted",
        description: "The event was removed from the catalog.",
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

  const searchedEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter((item) => {
      const searchable = [
        item.eventTypeName,
        item.description,
        ...item.items,
        formatPriceEn(item.price),
        item.isActive ? "active" : "inactive",
        "upcoming",
        "proximo",
        "completed",
        String(item.bookingCount ?? 0),
        "booking",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [events, searchQuery]);

  const tabCounts = useMemo(() => {
    const all = searchedEvents.length;
    const upcoming = searchedEvents.filter((e) => e.isActive).length;
    return { all, upcoming, completed: all - upcoming };
  }, [searchedEvents]);

  const filteredEvents = useMemo(() => {
    let list = searchedEvents;
    if (filterTab === "upcoming") list = list.filter((e) => e.isActive);
    if (filterTab === "completed") list = list.filter((e) => !e.isActive);
    return list;
  }, [searchedEvents, filterTab]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTab]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageOffset = (safePage - 1) * PAGE_SIZE;
  const paginatedEvents = filteredEvents.slice(pageOffset, pageOffset + PAGE_SIZE);

  const stats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((e) => e.isActive).length;
    const itemsTotal = events.reduce((acc, e) => acc + e.items.length, 0);
    const activeWithDates = events.filter((e) => e.isActive);
    let nearestLabel = "—";
    if (activeWithDates.length > 0) {
      const sorted = [...activeWithDates].sort((a, b) => {
        const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      nearestLabel = formatShortDateUs(sorted[0]?.updatedAt ?? sorted[0]?.createdAt);
    }
    return { total, upcoming, completed: total - upcoming, itemsTotal, nearestLabel };
  }, [events]);

  const activeEventTypes = eventTypes.filter((item) => item.isActive);
  const selectedTypeName = activeEventTypes.find((item) => item.id === eventTypeId)?.name;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Events"
        actionLabel="New event"
        onAction={openCreateModal}
        bordered={false}
      />

      {eventTypes.filter((item) => item.isActive).length === 0 ? (
        <section className="mb-8 shamell-glass-surface rounded-xl p-5 md:p-7">
          <AdminCatalogEmptyState
            title="No active event types"
            description="Create or activate categories under Event types before you add performances here."
            tone="primary"
            icon={Tags}
            action={{ label: "Go to event types", href: "/shamell-admin/event-types" }}
          />
        </section>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["TOTAL EVENTS", String(stats.total)],
            ["UPCOMING", String(stats.upcoming)],
            ["ITEMS TOTAL", String(stats.itemsTotal)],
            ["MOST RECENT", stats.nearestLabel],
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

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-4">
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search events..."
          className="shamell-glass-surface mx-0 min-h-12 max-w-none flex-1 rounded-xl"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:shrink-0">
          <div className="shamell-glass-surface flex flex-wrap rounded-xl p-1">
            {(
              [
                ["all", "All", tabCounts.all],
                ["upcoming", "Upcoming", tabCounts.upcoming],
                ["completed", "Completed", tabCounts.completed],
              ] as const
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilterTab(id)}
                className={cn(
                  "rounded-lg px-3 py-2.5 font-brand text-[10px] tracking-[0.12em] transition sm:px-4",
                  filterTab === id
                    ? "bg-gold/12 text-gold shadow-inner"
                    : "text-foreground/50 hover:text-foreground/80",
                )}
              >
                {label} <span className="text-gold/45">·</span> {count}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="shamell-glass-surface rounded-xl p-4 md:p-5">
        <div className="overflow-x-auto rounded-xl border border-gold/14">
              <table className="w-full min-w-[1080px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gold/12">
                    <th className="w-14 px-2 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/70" />
                    <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">EVENT</th>
                    <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">TYPE</th>
                    <th className="w-16 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">ITEMS</th>
                    <th className="min-w-24 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">PRICE</th>
                    <th className="min-w-36 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">DATE</th>
                    <th className="min-w-36 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">
                      STATUS
                    </th>
                    <th className="w-32 px-3 py-3 text-right font-brand text-[10px] tracking-[0.14em] text-gold/80">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEvents.map((item) => {
                    const { title, subtitle } = displayEventHeading(item.description);
                    const dateIso = item.updatedAt ?? item.createdAt;
                    const bk = item.bookingCount ?? 0;
                    const gal = item.galleryPhotoCount ?? 0;
                    const deletable = canDeleteEvent(item);
                    const blockDeactivate = cannotDeactivateWhileActive(item);
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          "border-b border-gold/8 transition hover:bg-gold/5",
                          !item.isActive && "opacity-55",
                        )}
                      >
                        <td className="px-2 py-3 align-middle">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/22 bg-gold/10">
                            <Calendar className="h-4 w-4 text-gold/85" strokeWidth={1.4} />
                          </div>
                        </td>
                        <td className="max-w-56 px-3 py-3 align-middle md:max-w-72">
                          <p className="font-brand text-sm tracking-[0.04em] text-gold">{title}</p>
                          {subtitle ? (
                            <p className="mt-0.5 font-body text-xs leading-snug text-foreground/45">{subtitle}</p>
                          ) : null}
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
                              pillClassForTypeName(item.eventTypeName),
                            )}
                          >
                            {item.eventTypeName}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle font-body text-sm text-foreground/75">
                          {item.items.length}
                        </td>
                        <td className="px-3 py-3 align-middle font-body text-sm text-foreground/75 whitespace-nowrap">
                          {formatPriceEn(item.price)}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <div className="flex items-center gap-2 font-body text-xs text-foreground/65">
                            {!item.isActive ? (
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" strokeWidth={2} />
                            ) : (
                              <Calendar className="h-3.5 w-3.5 shrink-0 text-gold/60" strokeWidth={1.5} />
                            )}
                            <span>{formatShortDateUs(dateIso)}</span>
                          </div>
                          <p className="mt-0.5 font-body text-[10px] text-foreground/35">Last updated</p>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => void onToggleActive(item)}
                              disabled={togglingId === item.id || blockDeactivate}
                              title={
                                blockDeactivate
                                  ? "This event has bookings and cannot be turned off."
                                  : undefined
                              }
                              className={cn(
                                "relative h-7 w-12 shrink-0 rounded-full border transition",
                                item.isActive
                                  ? "border-emerald-400/45 bg-emerald-500/22"
                                  : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
                                togglingId === item.id && "cursor-not-allowed opacity-60",
                                blockDeactivate && "cursor-not-allowed opacity-45",
                              )}
                              aria-label={`${item.isActive ? "Hide" : "Show"} event`}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                                  item.isActive ? "left-6" : "left-1",
                                )}
                              />
                            </button>
                            <span className="font-body text-xs text-foreground/55">
                              {item.isActive ? "Active" : "Hidden"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewEvent(item)}
                              className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
                              aria-label="View event"
                            >
                              <Eye className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
                              aria-label="Edit event"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirm(item)}
                              disabled={!deletable}
                              className={cn(
                                "rounded-lg border p-2 transition",
                                deletable
                                  ? "border-red-400/25 text-foreground/55 hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300"
                                  : "cursor-not-allowed border-gold/10 text-foreground/30",
                              )}
                              aria-label="Delete event permanently"
                              title={
                                !deletable
                                  ? bk > 0
                                    ? "Has linked bookings"
                                    : "Has linked gallery photos"
                                  : "Delete from catalog (cannot undo)"
                              }
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border-b border-gold/8 p-0 align-middle">
                        {events.length === 0 ? (
                          <AdminCatalogEmptyState
                            title="No events yet"
                            description="Add a performance with type, description, and line items for the team."
                            tone="primary"
                            variant="embedded"
                            icon={Calendar}
                            action={{ label: "New event", onClick: openCreateModal }}
                          />
                        ) : (
                          <AdminCatalogEmptyState
                            title="No matches for your search"
                            description="Try other words or switch the filter tab (All, Upcoming, Completed)."
                            tone="muted"
                            variant="embedded"
                            icon={Calendar}
                          />
                        )}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gold/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-body text-xs text-foreground/50">
                {filteredEvents.length === 0
                  ? "Showing 0 of 0"
                  : `Showing ${pageOffset + 1}-${pageOffset + paginatedEvents.length} of ${filteredEvents.length}`}
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
                      "min-w-9 rounded-lg border px-2.5 py-1.5 font-brand text-xs tracking-wide transition",
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

        {isLoading ? <p className="mt-4 text-sm text-foreground/65">Loading...</p> : null}
      </section>

      <AdminModal title={editingId ? "Edit event" : "New event"} isOpen={isModalOpen} onClose={closeModal}>
        <form id="event-form" noValidate onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">EVENT TYPE</span>
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => {
                  if (activeEventTypes.length === 0) return;
                  setIsTypeDropdownOpen((prev) => !prev);
                }}
                className="shamell-glass-trigger flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm text-foreground"
              >
                <span className={selectedTypeName ? "text-foreground" : "text-foreground/55"}>
                  {selectedTypeName ?? "Create an event type first"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gold/80 transition ${isTypeDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isTypeDropdownOpen && activeEventTypes.length > 0 ? (
                <div className="shamell-scrollbar absolute left-0 top-14 z-40 max-h-56 w-full overflow-y-auto rounded-xl border border-gold/35 bg-[#0b0f14] p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
                  {activeEventTypes.map((item) => {
                    const isSelected = eventTypeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setEventTypeId(item.id);
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
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">DESCRIPTION</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder="Describe this event..."
            />
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">LINE ITEMS (ONE PER LINE)</span>
            <p className="mt-1 text-xs text-foreground/55 font-body">
              Example bullets shown on the public site (weddings, yachts, villas…). One line = one bullet in the public
              catalog.
            </p>
            <textarea
              value={itemsText}
              onChange={(event) => setItemsText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder={"Line 1\nLine 2\nLine 3"}
            />
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">PRICE (OPTIONAL)</span>
            <p className="mt-1 font-body text-xs text-foreground/55">
              Reference amount for the public catalog (comma or decimal point allowed).
            </p>
            <input
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder="e.g. 2500 or 2500.50"
              autoComplete="off"
            />
          </label>

          <div className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">CATALOG IMAGES</span>
            <p className="mt-1 font-body text-xs text-foreground/55">
              Uploaded to the gallery and linked to this event. Up to {MAX_CATALOG_IMAGES} images. New files upload when
              you save the form.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {existingImages.map((img) => (
                <div
                  key={img.id}
                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-gold/22 bg-black/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => void removeExistingCatalogImage(img.id)}
                    className="absolute right-1 top-1 rounded-md border border-white/25 bg-black/70 p-1 text-white transition hover:bg-red-500/80"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))}
              {pendingPreviewUrls.map((url, idx) => (
                <div
                  key={`pending-${idx}`}
                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-gold/35 bg-black/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover opacity-90" />
                  <button
                    type="button"
                    onClick={() => removePendingAt(idx)}
                    className="absolute right-1 top-1 rounded-md border border-white/25 bg-black/70 p-1 text-white transition hover:bg-red-500/80"
                    aria-label="Remove pending image"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))}
              {existingImages.length + pendingFiles.length < MAX_CATALOG_IMAGES ? (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gold/40 bg-gold/5 text-gold transition hover:border-gold/60 hover:bg-gold/10">
                  <Plus className="h-7 w-7" strokeWidth={1.25} aria-hidden />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      onPickCatalogImages(event.target.files);
                      event.target.value = "";
                    }}
                  />
                  <span className="sr-only">Add image</span>
                </label>
              ) : null}
            </div>
          </div>

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
              {isSubmitting ? "Saving..." : editingId ? "Save changes" : "Create event"}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        title="Delete event"
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
      >
        <div className="space-y-5 font-body text-sm text-foreground/85">
          <p>
            Permanently delete{" "}
            <span className="font-brand text-gold">
              {pendingDelete ? displayEventHeading(pendingDelete.description).title : ""}
            </span>
            ? This is only allowed when there are no bookings or linked gallery photos. You cannot undo it.
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

      {viewEvent ? (
        <div
          className="fixed inset-0 z-90 flex items-center justify-center bg-black/85 px-4 py-8"
          onClick={() => setViewEvent(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/25 bg-[#0c0c0c] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewEvent(null)}
              className="absolute right-3 top-3 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="font-brand text-[10px] tracking-[0.2em] text-gold/75">QUICK LOOK</p>
            <h2 className="mt-2 font-brand text-xl text-gold">{displayEventHeading(viewEvent.description).title}</h2>
            <p className="mt-1 font-body text-xs text-foreground/45">{viewEvent.eventTypeName}</p>
            <p className="mt-3 font-brand text-xs tracking-[0.14em] text-gold/85">
              PRECIO <span className="font-body text-foreground/75">{formatPriceEn(viewEvent.price)}</span>
            </p>
            {viewEvent.catalogImages.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {viewEvent.catalogImages.map((img) => (
                  <div key={img.id} className="h-16 w-16 overflow-hidden rounded-lg border border-gold/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
            <p className="mt-4 font-body text-sm leading-relaxed text-foreground/70">{viewEvent.description}</p>
            <p className="mt-3 font-body text-xs text-foreground/45">
              {viewEvent.items.length} item(s) · {formatShortDateUs(viewEvent.updatedAt ?? viewEvent.createdAt)} ·{" "}
              {viewEvent.isActive ? "Upcoming" : "Completed"}
              {(viewEvent.bookingCount ?? 0) > 0
                ? ` · ${viewEvent.bookingCount} booking(s)`
                : ""}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
