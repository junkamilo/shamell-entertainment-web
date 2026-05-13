"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Cake,
  Crown,
  Flame,
  Heart,
  Music,
  Pencil,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type OccasionUsage = "OCCASION_SINGLE" | "BESPOKE_PROJECT" | "BESPOKE_ROLE";

type OccasionCatalogItem = {
  id: string;
  name: string;
  isActive: boolean;
};

type EventTypeItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  eventCount?: number;
  bookingCount?: number;
  galleryPhotoCount?: number;
  occasionAssignments?: {
    occasionTypeId: string;
    usage: OccasionUsage;
    sortOrder?: number;
    occasionName?: string;
  }[];
};

/** All selected occasions are stored as `OCCASION_SINGLE` (contact list). */
function packLinkedOccasionsForApi(linkedIds: string[], catalog: OccasionCatalogItem[]) {
  const order = new Map(catalog.map((c, i) => [c.id, i]));
  const sorted = [...linkedIds].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
  return sorted.map((occasionTypeId) => ({ occasionTypeId, usage: "OCCASION_SINGLE" as const }));
}

function linkedOccasionIdsSignature(ids: string[]) {
  return JSON.stringify([...ids].sort());
}

/** Merge all already-linked occasions (any prior use) for editing in one list. */
function flattenLinkedOccasionIdsFromAssignments(
  assignments: NonNullable<EventTypeItem["occasionAssignments"]> | undefined,
): string[] {
  if (!assignments?.length) return [];
  const sorted = [...assignments].sort((a, b) => {
    if (a.usage !== b.usage) return a.usage.localeCompare(b.usage);
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of sorted) {
    if (seen.has(a.occasionTypeId)) continue;
    seen.add(a.occasionTypeId);
    out.push(a.occasionTypeId);
  }
  return out;
}

function formatLinkedOccasionLine(
  assignments: NonNullable<EventTypeItem["occasionAssignments"]> | undefined,
): string | null {
  if (!assignments?.length) return null;
  const seen = new Set<string>();
  const names: string[] = [];
  for (const a of assignments) {
    if (seen.has(a.occasionTypeId)) continue;
    seen.add(a.occasionTypeId);
    names.push(a.occasionName?.trim() || "…");
  }
  return names.length ? names.join(", ") : null;
}

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const NAME_REGEX = /^[A-Za-zÀ-ÿ\s&-]+$/;

const TYPE_ICONS = [Sparkles, Heart, Briefcase, Music, Cake, Crown, Flame, Star] as const;

function iconForTypeName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TYPE_ICONS[Math.abs(hash) % TYPE_ICONS.length];
}

function formatRelativeEn(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

type FilterTab = "all" | "active" | "inactive";

export default function ShamellAdminEventTypesPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [types, setTypes] = useState<EventTypeItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EventTypeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [occasionCatalog, setOccasionCatalog] = useState<OccasionCatalogItem[]>([]);
  /** Active occasion ids (and optionally inherited inactive links) checked for this type. */
  const [linkedOccasionIds, setLinkedOccasionIds] = useState<string[]>([]);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const resetForm = () => {
    setName("");
    setLinkedOccasionIds([]);
    setEditingId(null);
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    let cancelled = false;
    void fetch(`${apiBaseUrl}/api/v1/events/occasions/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data)) return;
        setOccasionCatalog(
          (data as Record<string, unknown>[]).map((row) => ({
            id: String(row.id),
            name: String(row.name ?? ""),
            isActive: Boolean(row.isActive),
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setOccasionCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isModalOpen, apiBaseUrl]);

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const loadTypes = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setTypes([]);
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const typesResponse = await fetch(`${apiBaseUrl}/api/v1/events/types/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const typesData = await typesResponse.json().catch(() => []);
      if (!typesResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(typesData, "Could not load event types."),
        });
        return;
      }
      setTypes(
        Array.isArray(typesData)
          ? (typesData as Record<string, unknown>[]).map((t) => {
              const rawAssign = t.occasionAssignments;
              const occasionAssignments = Array.isArray(rawAssign)
                ? (rawAssign as Record<string, unknown>[]).map((a) => ({
                    occasionTypeId: String(a.occasionTypeId),
                    usage: String(a.usage) as OccasionUsage,
                    sortOrder: typeof a.sortOrder === "number" ? a.sortOrder : 0,
                    occasionName: typeof a.occasionName === "string" ? a.occasionName : undefined,
                  }))
                : undefined;
              return {
                id: String(t.id),
                name: String(t.name),
                isActive: Boolean(t.isActive),
                createdAt: typeof t.createdAt === "string" ? t.createdAt : undefined,
                updatedAt: typeof t.updatedAt === "string" ? t.updatedAt : undefined,
                eventCount: typeof t.eventCount === "number" ? t.eventCount : 0,
                bookingCount: typeof t.bookingCount === "number" ? t.bookingCount : 0,
                galleryPhotoCount: typeof t.galleryPhotoCount === "number" ? t.galleryPhotoCount : 0,
                occasionAssignments,
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
  }, [apiBaseUrl, parseErrorMessage]);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  const trimmedName = name.trim();
  const hasValidChars = NAME_REGEX.test(trimmedName);
  const hasValidLength = trimmedName.length >= NAME_MIN_LENGTH && trimmedName.length <= NAME_MAX_LENGTH;
  const isNameValid = hasValidChars && hasValidLength;

  const editingRow = editingId ? types.find((item) => item.id === editingId) : undefined;
  const originalName = editingRow?.name.trim() ?? "";
  const nameChanged = !editingId || trimmedName !== originalName;

  const activeOccasionsCatalog = useMemo(
    () => occasionCatalog.filter((c) => c.isActive),
    [occasionCatalog],
  );

  const activeOccasionIdSet = useMemo(
    () => new Set(activeOccasionsCatalog.map((c) => c.id)),
    [activeOccasionsCatalog],
  );

  const originalIdsFlat = flattenLinkedOccasionIdsFromAssignments(editingRow?.occasionAssignments);
  const idsForSave = linkedOccasionIds.filter((id) => activeOccasionIdSet.has(id));
  const baselineIdsForSave = originalIdsFlat.filter((id) => activeOccasionIdSet.has(id));
  const willSendOccasions = packLinkedOccasionsForApi(idsForSave, occasionCatalog);
  const baselineOccasions = packLinkedOccasionsForApi(baselineIdsForSave, occasionCatalog);
  const hadNonSingleUsage = (editingRow?.occasionAssignments ?? []).some((a) => a.usage !== "OCCASION_SINGLE");
  const hadInactiveLinksOnly =
    originalIdsFlat.length > 0 && baselineIdsForSave.length === 0 && idsForSave.length === 0;
  const assignmentsChanged =
    hadNonSingleUsage ||
    hadInactiveLinksOnly ||
    JSON.stringify(willSendOccasions) !== JSON.stringify(baselineOccasions) ||
    linkedOccasionIdsSignature(linkedOccasionIds) !== linkedOccasionIdsSignature(originalIdsFlat);
  const hasChanges = editingId ? nameChanged || assignmentsChanged : trimmedName.length > 0;
  const canSubmit = !isSubmitting && isNameValid && hasChanges;

  const linkedOrphanIds = useMemo(
    () => linkedOccasionIds.filter((id) => !activeOccasionIdSet.has(id)),
    [linkedOccasionIds, activeOccasionIdSet],
  );

  const toggleLinkedOccasion = (id: string) => {
    setLinkedOccasionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const getNameValidationError = () => {
    if (!trimmedName) return "Enter a name for the event type.";
    if (!hasValidLength) {
      return `Name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`;
    }
    if (!hasValidChars) {
      return "Only letters, spaces, hyphens, and '&' are allowed. Numbers are not allowed.";
    }
    if (!hasChanges) {
      return "Nothing to save.";
    }
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    const validationError = getNameValidationError();
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
      const endpoint = editingId
        ? `${apiBaseUrl}/api/v1/events/types/admin/${editingId}`
        : `${apiBaseUrl}/api/v1/events/types/admin`;
      const method = editingId ? "PATCH" : "POST";
      const idsForApi = linkedOccasionIds.filter((id) => activeOccasionIdSet.has(id));
      const occasions = packLinkedOccasionsForApi(idsForApi, occasionCatalog);
      const body = JSON.stringify({
        name: trimmedName,
        occasions,
      });

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not save event type."),
        });
        return;
      }

      toast({
        title: editingId ? "Type updated" : "Type created",
        description: editingId
          ? "Event type changes were saved."
          : "The new event type was created successfully.",
      });
      resetForm();
      setIsModalOpen(false);
      await loadTypes();
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

  const startEdit = (item: EventTypeItem) => {
    setEditingId(item.id);
    setName(item.name);
    setLinkedOccasionIds(flattenLinkedOccasionIdsFromAssignments(item.occasionAssignments));
    setIsModalOpen(true);
  };

  const hasBlockingUsage = (item: EventTypeItem) =>
    (item.eventCount ?? 0) > 0 || (item.bookingCount ?? 0) > 0 || (item.galleryPhotoCount ?? 0) > 0;

  const canDeleteEventType = (item: EventTypeItem) => !hasBlockingUsage(item);

  const cannotDeactivateWhileActive = (item: EventTypeItem) => item.isActive && hasBlockingUsage(item);

  const onToggleActive = async (item: EventTypeItem) => {
    if (item.isActive && hasBlockingUsage(item)) {
      toast({
        variant: "destructive",
        title: "Cannot turn off",
        description:
          "This type has catalog events, bookings, or gallery photos linked. Remove or reassign that data first.",
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
      const response = await fetch(`${apiBaseUrl}/api/v1/events/types/admin/${item.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not update event type status."),
        });
        return;
      }

      if (editingId === item.id && !item.isActive) {
        resetForm();
      }

      toast({
        title: item.isActive ? "Type hidden" : "Type visible",
        description: item.isActive
          ? "The event type was turned off."
          : "The event type was turned on.",
      });
      await loadTypes();
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

  const openDeleteConfirm = (item: EventTypeItem) => {
    if (!canDeleteEventType(item)) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description:
          "There are catalog events, bookings, or gallery photos linked to this type. Remove or reassign them first.",
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
      const response = await fetch(`${apiBaseUrl}/api/v1/events/types/admin/${pendingDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not delete event type."),
        });
        return;
      }

      if (editingId === pendingDelete.id) {
        resetForm();
        setIsModalOpen(false);
      }

      toast({
        title: "Type deleted",
        description: "The event type was removed from the catalog.",
      });
      setPendingDelete(null);
      await loadTypes();
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

  const onHeroAction = () => openCreateModal();

  const filteredTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = types.filter((item) => item.name.toLowerCase().includes(q));
    if (filterTab === "active") list = list.filter((t) => t.isActive);
    if (filterTab === "inactive") list = list.filter((t) => !t.isActive);
    return list;
  }, [types, searchQuery, filterTab]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTab]);

  const paginationMeta = useMemo(() => {
    const totalItems = filteredTypes.length;
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    const safePage = Math.min(Math.max(1, page), totalPages);
    return {
      page: safePage,
      perPage,
      totalItems,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    };
  }, [page, perPage, filteredTypes.length]);

  const pagedTypes = useMemo(() => {
    const start = (paginationMeta.page - 1) * paginationMeta.perPage;
    return filteredTypes.slice(start, start + paginationMeta.perPage);
  }, [filteredTypes, paginationMeta.page, paginationMeta.perPage]);

  const stats = useMemo(() => {
    const total = types.length;
    const active = types.filter((t) => t.isActive).length;
    const inactive = total - active;
    let recentLabel = "—";
    if (types.length > 0) {
      const sorted = [...types].sort((a, b) => {
        const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      const top = sorted[0];
      if (top) recentLabel = top.name.length > 18 ? `${top.name.slice(0, 16)}…` : top.name;
    }
    return { total, active, inactive, recentLabel };
  }, [types]);

  const filterPill = (id: FilterTab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilterTab(id)}
      className={cn(
        "rounded-full border px-4 py-2 font-brand text-[10px] tracking-[0.14em] transition-colors",
        filterTab === id
          ? "border-gold/55 bg-gold/10 text-gold"
          : "border-gold/15 text-foreground/50 hover:border-gold/35 hover:text-foreground/75",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Event types"
        actionLabel="New type"
        onAction={onHeroAction}
        bordered={false}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["TOTAL", String(stats.total)],
            ["ACTIVE", String(stats.active)],
            ["INACTIVE", String(stats.inactive)],
            ["LAST UPDATED", stats.recentLabel],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="shamell-glass-surface rounded-xl px-4 py-3"
          >
            <p className="font-brand text-[10px] tracking-[0.18em] text-gold/75">{label}</p>
            <p className="mt-1 truncate font-brand text-lg tracking-wide text-gold md:text-xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search event types..."
          className="shamell-glass-surface mx-0 min-h-12 max-w-none flex-1 rounded-xl"
        />
        <div className="flex flex-wrap gap-2 lg:shrink-0">
          {filterPill("all", "All")}
          {filterPill("active", "Active")}
          {filterPill("inactive", "Inactive")}
        </div>
      </div>

      <section className="shamell-glass-surface rounded-xl p-5 md:p-7">
        {isLoading ? (
          <p className="py-16 text-center font-body text-sm text-foreground/65">Loading...</p>
        ) : filteredTypes.length === 0 ? (
          types.length === 0 ? (
            <AdminCatalogEmptyState
              title="No event types yet"
              description="Categories organize your experiences and link the occasions the client sees in contact."
              tone="primary"
              action={{ label: "Create event type", onClick: openCreateModal }}
            />
          ) : (
            <AdminCatalogEmptyState
              title="No matches for your search"
              description="Try different words or switch the filter between All, Active, and Inactive."
              tone="muted"
            />
          )
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedTypes.map((item) => {
            const Icon = iconForTypeName(item.name);
            const nEvents = item.eventCount ?? 0;
            const nBk = item.bookingCount ?? 0;
            const nGal = item.galleryPhotoCount ?? 0;
            const catalogLabel = nEvents === 1 ? "1 catalog event" : `${nEvents} catalog events`;
            const extraParts: string[] = [];
            if (nBk > 0) extraParts.push(nBk === 1 ? "1 booking" : `${nBk} bookings`);
            if (nGal > 0) extraParts.push(nGal === 1 ? "1 gallery photo" : `${nGal} gallery photos`);
            const usageLine = extraParts.length ? `${catalogLabel} · ${extraParts.join(" · ")}` : catalogLabel;
            const occasionSummary = formatLinkedOccasionLine(item.occasionAssignments);
            const deletable = canDeleteEventType(item);
            const blockDeactivate = cannotDeactivateWhileActive(item);
            return (
              <article
                key={item.id}
                className="shamell-glass-surface relative flex flex-col rounded-2xl border border-gold/16 p-4"
              >
                <div className="flex items-start gap-2">
                  <p
                    className={cn(
                      "flex items-center gap-2 font-brand text-[10px] tracking-[0.16em]",
                      item.isActive ? "text-emerald-400/90" : "text-foreground/45",
                    )}
                  >
                    <span className="text-gold/90">•</span>
                    {item.isActive ? "ACTIVE" : "INACTIVE"}
                  </p>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10">
                    <Icon className="h-5 w-5 text-gold/90" strokeWidth={1.4} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-brand text-lg tracking-[0.06em] text-gold md:text-xl">{item.name}</h2>
                    <p className="mt-1 font-body text-xs leading-relaxed text-foreground/50">
                      {occasionSummary ??
                        "No linked occasions: the contact form will not show lists for this type until you edit and assign occasions."}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gold/12 pt-4 font-body text-[11px] text-foreground/45">
                  <span className="min-w-0 flex-1 basis-full sm:basis-auto">{usageLine}</span>
                  <span className="hidden text-gold/25 sm:inline">·</span>
                  <span>{formatRelativeEn(item.updatedAt ?? item.createdAt)}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-lg border border-gold/22 p-2 text-foreground/65 transition hover:bg-gold/10 hover:text-gold"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(item)}
                      disabled={!deletable}
                      className={cn(
                        "rounded-lg border p-2 transition",
                        deletable
                          ? "border-red-400/30 text-red-300/90 hover:border-red-400/50 hover:bg-red-500/10"
                          : "cursor-not-allowed border-gold/10 text-foreground/30",
                      )}
                      aria-label={`Delete ${item.name}`}
                      title={
                        !deletable
                          ? "Has catalog events, bookings, or gallery photos linked"
                          : "Delete from catalog (occasion links are removed)"
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onToggleActive(item)}
                      disabled={togglingId === item.id || blockDeactivate}
                      title={
                        blockDeactivate
                          ? "Catalog, bookings, or photos are linked; cannot turn off."
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
                      aria-label={`${item.isActive ? "Hide" : "Show"} ${item.name}`}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                          item.isActive ? "left-6" : "left-1",
                        )}
                      />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
            </div>
            <AdminPagination
              className="mt-6 border-t border-gold/10 pt-4"
              meta={paginationMeta}
              onPageChange={setPage}
              onPerPageChange={(next) => {
                setPerPage(next);
                setPage(DEFAULT_PAGINATION_META.page);
              }}
            />
          </>
        )}
      </section>

      <AdminModal
        title={editingId ? "Edit event type" : "New event type"}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form id="event-type-form" noValidate onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TYPE NAME</span>
            <input
              type="text"
              value={name}
              required
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-base text-foreground outline-none focus:border-gold"
              placeholder="e.g. Private weddings"
            />
          </label>

          <div className="rounded-xl border border-gold/16 p-4">
            <p className="font-brand text-[11px] tracking-[0.2em] text-gold/95">OCCASION TYPES</p>
            <p className="mt-1 font-body text-xs leading-relaxed text-foreground/55">
              Only active occasions are shown. Check those that apply to this event type.
            </p>
            {occasionCatalog.length === 0 ? (
              <p className="mt-3 font-body text-xs text-foreground/45">Loading occasions…</p>
            ) : activeOccasionsCatalog.length === 0 ? (
              <p className="mt-3 font-body text-xs text-foreground/45">
                No active occasions. Create or reactivate occasion types in their module.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 border-t border-gold/10 pt-4">
                {activeOccasionsCatalog.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gold/12 px-3 py-2.5 font-body text-sm text-foreground/90 transition hover:border-gold/25 hover:bg-gold/5">
                      <input
                        type="checkbox"
                        checked={linkedOccasionIds.includes(c.id)}
                        onChange={() => toggleLinkedOccasion(c.id)}
                        className="h-4 w-4 shrink-0 rounded border-gold/40 text-gold focus:ring-gold"
                      />
                      <span>{c.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            {linkedOrphanIds.length > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-3">
                <p className="font-brand text-[10px] tracking-[0.14em] text-amber-200/90">INACTIVE LINKS</p>
                <p className="mt-1 font-body text-[11px] text-foreground/55">
                  These occasions are no longer active in the catalog. Uncheck to remove them or reactivate them in
                  Occasions.
                </p>
                <ul className="mt-2 space-y-2">
                  {linkedOrphanIds.map((id) => {
                    const label =
                      editingRow?.occasionAssignments?.find((a) => a.occasionTypeId === id)?.occasionName ?? id;
                    return (
                      <li key={id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-amber-500/20 px-3 py-2 font-body text-sm text-foreground/80">
                          <input
                            type="checkbox"
                            checked={linkedOccasionIds.includes(id)}
                            onChange={() => toggleLinkedOccasion(id)}
                            className="h-4 w-4 shrink-0 rounded border-amber-400/50 text-amber-400 focus:ring-amber-400"
                          />
                          <span>{label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
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
              {isSubmitting ? "Saving..." : editingId ? "Save changes" : "Create event type"}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        title="Delete event type"
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
      >
        <div className="space-y-5 font-body text-sm text-foreground/85">
          <p>
            Permanently delete{" "}
            <span className="font-brand text-gold">{pendingDelete?.name}</span>? Occasion-type links on this type will
            also be removed. You can only delete it when there are no catalog events, bookings, or linked gallery photos.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setPendingDelete(null)}
              className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => void onConfirmDelete()}
              className="rounded-xl border border-red-400/40 bg-red-500/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
