"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Sparkles, Trash2 } from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type OccasionRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  bookingCount?: number;
  eventTypeLinkCount?: number;
};

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 120;
const NAME_REGEX = /^[A-Za-zÀ-ÿ0-9\s&,.()'\-/_]+$/;

type FilterTab = "all" | "active" | "inactive";

export default function ShamellAdminOccasionTypesPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001", []);

  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [rows, setRows] = useState<OccasionRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OccasionRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  const loadRows = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setRows([]);
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/events/occasions/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not load occasion types."),
        });
        return;
      }
      setRows(
        Array.isArray(data)
          ? (data as Record<string, unknown>[]).map((row) => ({
              id: String(row.id),
              name: String(row.name ?? ""),
              isActive: Boolean(row.isActive),
              createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
              updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
              bookingCount: typeof row.bookingCount === "number" ? row.bookingCount : 0,
              eventTypeLinkCount:
                typeof row.eventTypeLinkCount === "number" ? row.eventTypeLinkCount : 0,
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
  }, [apiBaseUrl, parseErrorMessage]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const trimmedName = name.trim();
  const isNameValid =
    trimmedName.length >= NAME_MIN_LENGTH &&
    trimmedName.length <= NAME_MAX_LENGTH &&
    NAME_REGEX.test(trimmedName);
  const editingRow = editingId ? rows.find((r) => r.id === editingId) : undefined;
  const nameChanged = !editingId || trimmedName !== (editingRow?.name.trim() ?? "");
  const hasChanges = editingId ? nameChanged : trimmedName.length > 0;
  const canSubmit = !isSubmitting && isNameValid && hasChanges;

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
    if (!canSubmit) {
      toast({ variant: "destructive", title: "Check the form", description: "Invalid name or no changes." });
      return;
    }
    setIsSubmitting(true);
    try {
      const endpoint = editingId
        ? `${apiBaseUrl}/api/v1/events/occasions/admin/${editingId}`
        : `${apiBaseUrl}/api/v1/events/occasions/admin`;
      const method = editingId ? "PATCH" : "POST";
      const body = JSON.stringify({ name: trimmedName });
      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not save."),
        });
        return;
      }
      toast({
        title: editingId ? "Updated" : "Created",
        description: editingId ? "Occasion type updated." : "Occasion type created.",
      });
      setIsModalOpen(false);
      resetForm();
      await loadRows();
    } catch {
      toast({ variant: "destructive", title: "Offline", description: "Could not reach the server." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: OccasionRow) => {
    setEditingId(item.id);
    setName(item.name);
    setIsModalOpen(true);
  };

  const onToggleActive = async (item: OccasionRow) => {
    if (item.isActive && (item.bookingCount ?? 0) > 0) {
      toast({
        variant: "destructive",
        title: "Cannot turn off",
        description: "This occasion type has linked bookings.",
      });
      return;
    }

    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    setTogglingId(item.id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/events/occasions/admin/${item.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not update."),
        });
        return;
      }
      toast({ title: item.isActive ? "Hidden" : "Visible" });
      await loadRows();
    } catch {
      toast({ variant: "destructive", title: "Offline" });
    } finally {
      setTogglingId(null);
    }
  };

  const canDeleteOccasion = (item: OccasionRow) => (item.bookingCount ?? 0) === 0;

  const cannotDeactivateWhileActive = (item: OccasionRow) =>
    item.isActive && (item.bookingCount ?? 0) > 0;

  const openDeleteConfirm = (item: OccasionRow) => {
    if (!canDeleteOccasion(item)) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description: "There are bookings linked to this occasion type.",
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
      const response = await fetch(`${apiBaseUrl}/api/v1/events/occasions/admin/${pendingDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not delete the occasion type."),
        });
        return;
      }

      if (editingId === pendingDelete.id) {
        resetForm();
        setIsModalOpen(false);
      }

      toast({
        title: "Type deleted",
        description: "The occasion type was removed from the catalog.",
      });
      setPendingDelete(null);
      await loadRows();
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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = rows.filter((item) => item.name.toLowerCase().includes(q));
    if (filterTab === "active") list = list.filter((t) => t.isActive);
    if (filterTab === "inactive") list = list.filter((t) => !t.isActive);
    list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    return list;
  }, [rows, searchQuery, filterTab]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTab]);

  const paginationMeta = useMemo(() => {
    const totalItems = filtered.length;
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
  }, [page, perPage, filtered.length]);

  const pagedRows = useMemo(() => {
    const start = (paginationMeta.page - 1) * paginationMeta.perPage;
    return filtered.slice(start, start + paginationMeta.perPage);
  }, [filtered, paginationMeta.page, paginationMeta.perPage]);

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
        title="Occasion types"
        actionLabel="New type"
        onAction={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        bordered={false}
      />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search occasions..."
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
        ) : filtered.length === 0 ? (
          rows.length === 0 ? (
            <AdminCatalogEmptyState
              title="No occasion types yet"
              description="These are the options clients see for each event type."
              tone="primary"
              action={{
                label: "Create occasion type",
                onClick: () => {
                  resetForm();
                  setIsModalOpen(true);
                },
              }}
            />
          ) : (
            <AdminCatalogEmptyState
              title="No matches for your search"
              description="Try different search words or switch the filter between All, Active, and Inactive."
              tone="muted"
            />
          )
        ) : (
          <>
            <div className="grid gap-3">
              {pagedRows.map((item) => {
                const deletable = canDeleteOccasion(item);
                const blockDeactivate = cannotDeactivateWhileActive(item);
                return (
                  <div
                    key={item.id}
                    className="shamell-glass-surface flex items-center gap-3 rounded-xl border border-gold/14 px-4 py-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
                      <Sparkles className="h-4 w-4 text-gold/90" strokeWidth={1.4} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-brand text-sm tracking-wide text-gold">{item.name}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
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
                            ? "Bookings are linked"
                            : "Delete from catalog (also removes links on event types)"
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
                            ? "Bookings are linked; cannot turn off."
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
        title={editingId ? "Edit occasion type" : "New occasion type"}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
      >
        <form noValidate onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">NAME</span>
            <input
              type="text"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-base text-foreground outline-none focus:border-gold"
              placeholder="e.g. Luxury birthday"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : editingId ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        title="Delete occasion type"
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
      >
        <div className="space-y-5 font-body text-sm text-foreground/85">
          <p>
            Permanently delete{" "}
            <span className="font-brand text-gold">{pendingDelete?.name}</span>? It will also be removed from
            event types where it is linked (when there are no bookings).
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
