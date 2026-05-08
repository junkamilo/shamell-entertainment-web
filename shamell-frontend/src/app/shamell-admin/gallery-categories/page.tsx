"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Aperture,
  ArrowRight,
  ChevronDown,
  Image as ImageIcon,
  Layers,
  Pencil,
} from "lucide-react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type GalleryCategory = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AdminGalleryPhoto = {
  categoryId: string;
  imageUrl: string;
};

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

function slugifyDisplay(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type FilterTab = "all" | "active" | "inactive";

export default function ShamellAdminGalleryCategoriesPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [photos, setPhotos] = useState<AdminGalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  /** Category ids with detail (description + preview) expanded; all collapsed by default. */
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(() => new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const loadCategories = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setCategories([]);
      setPhotos([]);
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [catRes, photoRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/gallery/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/v1/gallery/admin/photos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const catData = await catRes.json().catch(() => []);
      if (!catRes.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(catData, "Could not load categories."),
        });
        return;
      }
      setCategories(Array.isArray(catData) ? (catData as GalleryCategory[]) : []);

      const photoData = await photoRes.json().catch(() => []);
      if (photoRes.ok && Array.isArray(photoData)) {
        setPhotos(
          (photoData as { categoryId?: string; imageUrl?: string }[])
            .filter((p) => p.categoryId && p.imageUrl)
            .map((p) => ({ categoryId: p.categoryId as string, imageUrl: p.imageUrl as string })),
        );
      } else {
        setPhotos([]);
      }
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
    void loadCategories();
  }, [loadCategories]);

  const photoCountByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of photos) {
      m[p.categoryId] = (m[p.categoryId] ?? 0) + 1;
    }
    return m;
  }, [photos]);

  const previewUrlsByCategory = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const p of photos) {
      if (!m[p.categoryId]) m[p.categoryId] = [];
      if (m[p.categoryId].length < 5) m[p.categoryId].push(p.imageUrl);
    }
    return m;
  }, [photos]);

  const spotlightCategoryId = useMemo(() => {
    let best = "";
    let n = -1;
    for (const c of categories) {
      const count = photoCountByCategory[c.id] ?? 0;
      if (count > n) {
        n = count;
        best = c.id;
      }
    }
    return n > 0 ? best : "";
  }, [categories, photoCountByCategory]);

  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.isActive).length;
    const withMedia = categories.filter((c) => (photoCountByCategory[c.id] ?? 0) > 0).length;
    let star = "—";
    if (spotlightCategoryId) {
      const c = categories.find((x) => x.id === spotlightCategoryId);
      if (c) star = c.name.length > 20 ? `${c.name.slice(0, 18)}…` : c.name;
    }
    return { total, active, inactive: total - active, withMedia, star };
  }, [categories, photoCountByCategory, spotlightCategoryId]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = categories.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q),
    );
    if (filterTab === "active") list = list.filter((c) => c.isActive);
    if (filterTab === "inactive") list = list.filter((c) => !c.isActive);
    const spotlight = spotlightCategoryId && list.some((c) => c.id === spotlightCategoryId);
    return [...list].sort((a, b) => {
      if (spotlight) {
        if (a.id === spotlightCategoryId) return -1;
        if (b.id === spotlightCategoryId) return 1;
      }
      return a.name.localeCompare(b.name, "en");
    });
  }, [categories, searchQuery, filterTab, spotlightCategoryId]);

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryName("");
  };

  const openCategoryCreate = () => {
    resetCategoryForm();
    setIsCategoryModalOpen(true);
  };

  const startCategoryEdit = (category: GalleryCategory) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setIsCategoryModalOpen(true);
  };

  const toggleCategoryExpanded = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmitCategory = async (event: FormEvent<HTMLFormElement>) => {
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

    const name = categoryName.trim();
    if (!name) {
      toast({
        variant: "destructive",
        title: "Check the form",
        description: "Name is required.",
      });
      return;
    }

    setIsSubmittingCategory(true);
    try {
      const endpoint = editingCategoryId
        ? `${apiBaseUrl}/api/v1/gallery/admin/categories/${editingCategoryId}`
        : `${apiBaseUrl}/api/v1/gallery/admin/categories`;
      const method = editingCategoryId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not save the category."),
        });
        return;
      }

      toast({
        title: editingCategoryId ? "Category updated" : "Category created",
        description: "The gallery category was saved.",
      });
      setIsCategoryModalOpen(false);
      resetCategoryForm();
      await loadCategories();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const onToggleCategoryActive = async (category: GalleryCategory) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setTogglingId(category.id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/gallery/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not change the category status."),
        });
        return;
      }
      toast({
        title: category.isActive ? "Category hidden" : "Category visible",
        description: category.isActive
          ? "The category is no longer shown on the public gallery."
          : "The category is active again.",
      });
      await loadCategories();
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
        title="Gallery categories"
        subtitle="Curated albums for your public gallery."
        actionLabel="New category"
        onAction={openCategoryCreate}
        bordered={false}
      />

      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        <Link
          href="/shamell-admin/gallery"
          className="shamell-glass-surface inline-flex items-center gap-2 rounded-full border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold/90 transition hover:border-gold/45 hover:bg-gold/10"
        >
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          Go to gallery
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["TOTAL", String(stats.total)],
            ["ACTIVE", String(stats.active)],
            ["WITH MEDIA", String(stats.withMedia)],
            ["SPOTLIGHT", stats.star],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="group relative overflow-hidden shamell-glass-surface rounded-xl px-4 py-3 transition hover:border-gold/25"
          >
            <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/15" />
            <p className="relative font-brand text-[10px] tracking-[0.18em] text-gold/75">{label}</p>
            <p className="relative mt-1 truncate font-brand text-lg tracking-wide text-gold md:text-xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name or slug..."
          className="shamell-glass-surface mx-0 min-h-12 max-w-none flex-1 rounded-xl"
        />
        <div className="flex flex-wrap gap-2 lg:shrink-0">
          {filterPill("all", "All")}
          {filterPill("active", "Active")}
          {filterPill("inactive", "Inactive")}
        </div>
      </div>

      <section className="shamell-glass-surface rounded-xl p-5 md:p-7">
        {isLoading ? <p className="text-sm text-foreground/65">Loading...</p> : null}
        {!isLoading && filteredCategories.length === 0 ? (
          <p className="text-sm text-foreground/65">
            {categories.length === 0 ? "No categories yet." : "Nothing matches your search or filter."}
          </p>
        ) : null}

        <div className="mt-2 grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
          {filteredCategories.map((category) => {
            const count = photoCountByCategory[category.id] ?? 0;
            const previews = previewUrlsByCategory[category.id] ?? [];
            const isSpotlight = Boolean(spotlightCategoryId && category.id === spotlightCategoryId);
            const mediaLabel = count === 1 ? "1 item" : `${count} items`;
            const isExpanded = expandedCategoryIds.has(category.id);

            return (
              <article
                key={category.id}
                className={cn(
                  "shamell-glass-surface relative flex flex-col overflow-hidden rounded-2xl border p-1 transition",
                  isSpotlight
                    ? "border-gold/40 ring-1 ring-gold/25 md:col-span-2"
                    : "border-gold/16 hover:border-gold/28",
                )}
              >
                <div
                  className={cn(
                  "pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br opacity-90",
                  isSpotlight
                    ? "from-gold/12 via-transparent to-violet-950/20"
                    : "from-gold/5 via-transparent to-transparent",
                  )}
                />

                <div className="relative z-1 flex min-h-0 flex-1 flex-col gap-3 p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={cn(
                        "flex items-center gap-2 font-brand text-[10px] tracking-[0.16em]",
                        category.isActive ? "text-emerald-400/90" : "text-foreground/45",
                      )}
                    >
                      <span className="text-gold/90">•</span>
                      {category.isActive ? "ACTIVE" : "INACTIVE"}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpanded(category.id)}
                      aria-expanded={isExpanded}
                      aria-label={
                        isExpanded
                          ? `Hide preview for ${category.name}`
                          : `Show preview for ${category.name}`
                      }
                      className="shrink-0 rounded-lg border border-gold/18 p-1.5 text-gold/85 transition hover:border-gold/40 hover:bg-gold/10"
                    >
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")}
                        strokeWidth={1.75}
                      />
                    </button>
                  </div>

                  <h2 className="min-w-0 font-brand text-xl tracking-[0.06em] text-gold md:text-2xl">{category.name}</h2>

                  {isExpanded ? (
                    <>
                      <p className="flex items-start gap-2 font-body text-xs leading-relaxed text-foreground/50">
                        <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/40" strokeWidth={1.5} />
                        Collection to group photos and videos in the public gallery.
                      </p>

                      <div className="shamell-glass-surface relative overflow-hidden rounded-xl border border-gold/14 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Aperture className="h-3.5 w-3.5 text-gold/45" strokeWidth={1.5} />
                          <p className="font-brand text-[9px] tracking-[0.14em] text-gold/55">PREVIEW</p>
                        </div>
                        {previews.length > 0 ? (
                          <div
                            className={cn(
                              "grid gap-2",
                              isSpotlight
                                ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5"
                                : "grid-cols-3 sm:grid-cols-4",
                            )}
                          >
                            {previews.slice(0, isSpotlight ? 5 : 4).map((url, i) => (
                              <div
                                key={`${category.id}-${i}`}
                                className="relative aspect-square overflow-hidden rounded-lg border border-gold/22 bg-gold/5 shadow-inner"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="" className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="shamell-glass-surface flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gold/20 px-4 py-10 text-center">
                            <ImageIcon className="h-8 w-8 text-gold/30" strokeWidth={1.2} />
                            <p className="font-body text-[11px] text-foreground/40">No preview yet</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gold/12 pt-4 font-body text-[11px] text-foreground/45">
                    <span className="text-gold/70">{mediaLabel}</span>
                    <span className="text-gold/25">·</span>
                    <span>{formatRelativeEn(category.updatedAt ?? category.createdAt)}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startCategoryEdit(category)}
                        className="rounded-lg border border-gold/22 p-2 text-foreground/65 transition hover:bg-gold/10 hover:text-gold"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.6} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void onToggleCategoryActive(category)}
                        disabled={togglingId === category.id}
                        className={cn(
                          "relative h-7 w-12 shrink-0 rounded-full border transition",
                          category.isActive
                            ? "border-emerald-400/45 bg-emerald-500/22"
                            : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
                          togglingId === category.id && "cursor-not-allowed opacity-60",
                        )}
                        aria-label={`${category.isActive ? "Hide" : "Show"} ${category.name}`}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                            category.isActive ? "left-6" : "left-1",
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <AdminModal
        title={editingCategoryId ? "Edit category" : "New category"}
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          resetCategoryForm();
        }}
      >
        <form id="gallery-category-form" onSubmit={onSubmitCategory} className="space-y-5">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">NAME</span>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none focus:border-gold"
              placeholder="e.g. Live performance"
            />
            {!editingCategoryId ? (
              <p className="mt-2 font-body text-[11px] text-foreground/50">
                Slug preview:{" "}
                <code className="shamell-glass-surface rounded border border-gold/15 px-1.5 py-0.5 font-mono text-gold/80">
                  {slugifyDisplay(categoryName) || "…"}
                </code>{" "}
                (confirmed on save; the backend enforces uniqueness).
              </p>
            ) : (
              <p className="mt-2 font-body text-[11px] text-foreground/50">
                Published slug:{" "}
                <code className="shamell-glass-surface rounded border border-gold/15 px-1.5 py-0.5 font-mono text-gold/80">
                  /
                  {categories.find((c) => c.id === editingCategoryId)?.slug ?? "…"}
                </code>
                . If you change the name, the slug updates with the same rules (unique in the system).
              </p>
            )}
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setIsCategoryModalOpen(false);
                resetCategoryForm();
              }}
              className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingCategory || !categoryName.trim()}
              className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingCategory ? "Saving..." : editingCategoryId ? "Save changes" : "Create category"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
