"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  FolderOpen,
  Image as ImageIcon,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
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
};

type GalleryPhoto = {
  id: string;
  imageUrl: string;
  isActive: boolean;
  mediaType?: string;
  createdAt?: string;
  updatedAt?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
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

function isVideoMedia(photo: GalleryPhoto) {
  return (photo.mediaType ?? "IMAGE").toUpperCase() === "VIDEO";
}

export default function ShamellAdminGalleryPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [listCategoryFilter, setListCategoryFilter] = useState<string | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  /** Albums with the preview grid expanded; all collapsed by default. */
  const [expandedAlbumIds, setExpandedAlbumIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [originalCategoryId, setOriginalCategoryId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [categoriesResponse, photosResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/gallery/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/v1/gallery/admin/photos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const categoriesData = await categoriesResponse.json().catch(() => []);
      if (!categoriesResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(categoriesData, "Could not load categories."),
        });
        return;
      }
      setCategories(Array.isArray(categoriesData) ? (categoriesData as GalleryCategory[]) : []);

      const photosData = await photosResponse.json().catch(() => []);
      if (!photosResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(photosData, "Could not load media."),
        });
        return;
      }
      setPhotos(Array.isArray(photosData) ? (photosData as GalleryPhoto[]) : []);
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
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!filterDropdownOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = filterDropdownRef.current;
      if (el && !el.contains(e.target as Node)) setFilterDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [filterDropdownOpen]);

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories]);

  const categoriesForLibrary = useMemo(() => {
    if (listCategoryFilter) {
      const one = activeCategories.find((c) => c.id === listCategoryFilter);
      return one ? [one] : [];
    }
    return [...activeCategories].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [activeCategories, listCategoryFilter]);

  const countByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of photos) {
      const id = p.category.id;
      m[id] = (m[id] ?? 0) + 1;
    }
    return m;
  }, [photos]);

  const stats = useMemo(() => {
    const total = photos.length;
    const visible = photos.filter((p) => p.isActive).length;
    const catsWith = categories.filter((c) => (countByCategory[c.id] ?? 0) > 0).length;
    let recent = "—";
    if (photos.length > 0) {
      const sorted = [...photos].sort((a, b) => {
        const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      recent = formatRelativeEn(sorted[0]?.updatedAt ?? sorted[0]?.createdAt);
    }
    return { total, visible, catsWith, recent };
  }, [photos, categories, countByCategory]);

  const resetPhotoForm = useCallback(() => {
    setEditingPhotoId(null);
    setOriginalCategoryId(null);
    setImageFile(null);
    setSelectedCategoryId((current) => {
      if (current) return current;
      const first = activeCategories[0]?.id ?? "";
      return first;
    });
  }, [activeCategories]);

  const openUploadToCategory = (categoryId: string) => {
    setEditingPhotoId(null);
    setOriginalCategoryId(null);
    setImageFile(null);
    const id =
      categoryId && activeCategories.some((c) => c.id === categoryId)
        ? categoryId
        : (activeCategories[0]?.id ?? "");
    setSelectedCategoryId(id);
    setIsPhotoModalOpen(true);
  };

  const openPhotoCreate = () => {
    const preferred =
      listCategoryFilter && activeCategories.some((c) => c.id === listCategoryFilter)
        ? listCategoryFilter
        : (activeCategories[0]?.id ?? "");
    openUploadToCategory(preferred);
  };

  const toggleAlbumExpanded = (categoryId: string) => {
    setExpandedAlbumIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const startPhotoEdit = (photo: GalleryPhoto) => {
    setEditingPhotoId(photo.id);
    setSelectedCategoryId(photo.category.id);
    setOriginalCategoryId(photo.category.id);
    setImageFile(null);
    setIsPhotoModalOpen(true);
  };

  const selectedCategoryName = activeCategories.find((c) => c.id === selectedCategoryId)?.name;

  const canSubmitPhoto = useMemo(() => {
    if (!selectedCategoryId) return false;
    if (!editingPhotoId) return Boolean(imageFile);
    return Boolean(imageFile) || selectedCategoryId !== (originalCategoryId ?? "");
  }, [selectedCategoryId, editingPhotoId, imageFile, originalCategoryId]);

  const onSubmitPhoto = async (event: FormEvent<HTMLFormElement>) => {
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

    if (!selectedCategoryId) {
      toast({
        variant: "destructive",
        title: "Choose category",
        description: "Pick the gallery category where this file will be saved.",
      });
      return;
    }

    if (!editingPhotoId && !imageFile) {
      toast({
        variant: "destructive",
        title: "File required",
        description: "Select an image or video to upload.",
      });
      return;
    }

    if (editingPhotoId && !imageFile && selectedCategoryId === (originalCategoryId ?? "")) {
      toast({
        variant: "destructive",
        title: "No changes",
        description: "Choose another category or replace the file.",
      });
      return;
    }

    setIsSubmittingPhoto(true);
    try {
      const endpoint = editingPhotoId
        ? `${apiBaseUrl}/api/v1/gallery/admin/photos/${editingPhotoId}`
        : `${apiBaseUrl}/api/v1/gallery/admin/photos`;
      const method = editingPhotoId ? "PATCH" : "POST";
      const body = new FormData();
      body.append("categoryId", selectedCategoryId);
      if (imageFile) {
        body.append("media", imageFile);
      }

      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not save media."),
        });
        return;
      }

      const catLabel = activeCategories.find((c) => c.id === selectedCategoryId)?.name ?? "the category";
      toast({
        title: editingPhotoId ? "Media updated" : "Upload complete",
        description: editingPhotoId
          ? `Changes were applied in “${catLabel}”.`
          : `The file was saved in category “${catLabel}”.`,
      });
      setIsPhotoModalOpen(false);
      resetPhotoForm();
      await loadData();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

  const onTogglePhotoActive = async (photo: GalleryPhoto) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/gallery/admin/photos/${photo.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !photo.isActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not update media status."),
        });
        return;
      }
      toast({
        title: photo.isActive ? "Hidden on site" : "Visible on site",
        description: `Album: ${photo.category.name}.`,
      });
      await loadData();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    }
  };

  const onDisablePhoto = async (photoId: string) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/gallery/admin/photos/${photoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not delete media."),
        });
        return;
      }
      toast({ title: "Media removed", description: "Removed from gallery and storage." });
      await loadData();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    }
  };

  const filteredPhotos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return photos.filter((photo) => {
      if (listCategoryFilter && photo.category.id !== listCategoryFilter) return false;
      if (!q) return true;
      const searchable = `${photo.category.name} ${photo.category.slug}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [photos, searchQuery, listCategoryFilter]);

  const totalForFilterAll = photos.length;
  const filterCount =
    listCategoryFilter === null ? totalForFilterAll : (countByCategory[listCategoryFilter] ?? 0);
  const filterMedioLabel = filterCount === 1 ? "file" : "files";

  const filterSummaryLabel =
    listCategoryFilter === null
      ? "All categories"
      : (activeCategories.find((c) => c.id === listCategoryFilter)?.name ?? "Category");

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Gallery"
        actionLabel="Upload to category"
        onAction={openPhotoCreate}
        bordered={false}
      />

      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        <Link
          href="/shamell-admin/gallery-categories"
          className="shamell-glass-surface inline-flex items-center gap-2 rounded-full border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold/90 transition hover:border-gold/45 hover:bg-gold/10"
        >
          <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
          Manage categories
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Link>
      </div>

      {activeCategories.length === 0 ? (
        <div className="mb-8 rounded-xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 text-sm text-foreground/85">
          You need at least one active category to upload media.{" "}
          <Link href="/shamell-admin/gallery-categories" className="font-medium text-gold underline underline-offset-2">
            Create or activate categories
          </Link>
          .
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["TOTAL MEDIOS", String(stats.total)],
            ["VISIBLES", String(stats.visible)],
            ["ALBUMS IN USE", String(stats.catsWith)],
            ["LAST UPLOAD", stats.recent],
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

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by category name..."
          className="shamell-glass-surface mx-0 min-h-12 max-w-none flex-1 rounded-xl"
        />
        <div ref={filterDropdownRef} className="relative w-full shrink-0 lg:w-72">
          <button
            type="button"
            onClick={() => setFilterDropdownOpen((o) => !o)}
            aria-expanded={filterDropdownOpen}
            aria-haspopup="listbox"
            className={cn(
              "flex h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 font-brand text-[10px] tracking-[0.14em] transition",
              filterDropdownOpen
                ? "border-gold/50 bg-gold/10 text-gold shadow-[inset_0_1px_0_rgba(197,165,90,0.12)]"
                : "border-gold/18 text-foreground/80 hover:border-gold/35 hover:text-gold",
            )}
          >
            <span className="min-w-0 truncate text-left">
              <span className="block text-[9px] tracking-[0.18em] text-gold/60">FILTER BY ALBUM</span>
              <span className="mt-0.5 block truncate text-gold">
                {filterSummaryLabel}
                <span className="ml-1.5 font-body text-[11px] font-normal text-foreground/45">
                  · {filterCount} {filterMedioLabel}
                </span>
              </span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-gold/80 transition-transform", filterDropdownOpen && "rotate-180")}
              strokeWidth={1.75}
            />
          </button>
          {filterDropdownOpen ? (
            <div
              role="listbox"
              className="absolute right-0 top-full z-40 mt-2 w-full min-w-[16rem] overflow-hidden rounded-xl border border-gold/25 bg-[#0a0c10] py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-gold/10"
            >
              <button
                type="button"
                role="option"
                aria-selected={listCategoryFilter === null}
                onClick={() => {
                  setListCategoryFilter(null);
                  setFilterDropdownOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-brand text-[10px] tracking-[0.12em] transition",
                  listCategoryFilter === null ? "bg-gold/12 text-gold" : "text-foreground/75 hover:bg-gold/8 hover:text-gold",
                )}
              >
                <span>All categories</span>
                <span className="shamell-glass-surface rounded-full border border-gold/20 px-2 py-0.5 font-body text-[10px] text-foreground/55">
                  {totalForFilterAll}
                </span>
              </button>
              <div className="mx-3 border-t border-gold/12" />
              {activeCategories.map((c) => {
                const n = countByCategory[c.id] ?? 0;
                const selected = listCategoryFilter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setListCategoryFilter(c.id);
                      setFilterDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition",
                      selected ? "bg-gold/12 text-gold" : "text-foreground/75 hover:bg-gold/8 hover:text-gold",
                    )}
                  >
                    <span className="min-w-0 truncate font-brand text-[10px] tracking-[0.12em]">{c.name}</span>
                    <span className="shamell-glass-surface shrink-0 rounded-full border border-gold/18 px-2 py-0.5 font-body text-[10px] text-foreground/50">
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <section className="shamell-glass-surface rounded-xl p-5 md:p-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-brand text-lg tracking-[0.08em] text-gold">Media library</h2>
          {isLoading ? <p className="text-xs text-foreground/60">Loading...</p> : null}
        </div>

        <div className="space-y-6">
          {categoriesForLibrary.map((cat) => {
            const catPhotos = filteredPhotos.filter((p) => p.category.id === cat.id);
            const n = catPhotos.length;
            const albumExpanded = expandedAlbumIds.has(cat.id);
            return (
              <article
                key={cat.id}
                className="shamell-glass-surface relative overflow-hidden rounded-2xl border border-gold/14"
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-gold/6 via-transparent to-transparent opacity-90" />
                <div className="shamell-glass-surface relative border-b border-gold/12 px-5 py-4 md:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 w-full sm:flex-1 sm:pr-1">
                      <p className="font-brand text-[9px] tracking-[0.18em] text-gold/55">ALBUM</p>
                      <h3 className="mt-1 wrap-break-word font-brand text-xl tracking-[0.06em] text-gold md:text-2xl">
                        {cat.name}
                      </h3>
                      <p className="mt-1 font-body text-xs text-foreground/45">
                        {n === 0 ? "No files in this album" : n === 1 ? "1 file" : `${n} files`}
                      </p>
                    </div>
                    <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
                      <button
                        type="button"
                        onClick={() => openUploadToCategory(cat.id)}
                        className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/10 px-4 py-2.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:border-gold/55 hover:bg-gold/18 sm:flex-initial sm:px-4"
                      >
                        <Upload className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
                        <span className="truncate sm:whitespace-normal">Upload here</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAlbumExpanded(cat.id)}
                        aria-expanded={albumExpanded}
                        aria-label={
                          albumExpanded
                            ? `Hide album preview ${cat.name}`
                            : `Show album preview ${cat.name}`
                        }
                        className="shrink-0 rounded-xl border border-gold/18 p-2.5 text-gold/85 transition hover:border-gold/40 hover:bg-gold/10"
                      >
                        <ChevronDown
                          className={cn("h-4 w-4 transition-transform duration-200", albumExpanded && "rotate-180")}
                          strokeWidth={1.75}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {albumExpanded ? (
                <div className="relative p-4 md:p-5">
                  {n === 0 ? (
                    <div className="shamell-glass-surface flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gold/20 px-6 py-12 text-center">
                      <ImageIcon className="h-9 w-9 text-gold/25" strokeWidth={1.2} />
                      <p className="font-body text-sm text-foreground/45">No media in this album yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {catPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className={cn(
                            "shamell-glass-surface group flex flex-col overflow-hidden rounded-xl border border-gold/16 transition hover:border-gold/30",
                            !photo.isActive && "opacity-60",
                          )}
                        >
                          <div className="relative aspect-square w-full overflow-hidden bg-gold/5">
                            {isVideoMedia(photo) ? (
                              <video
                                src={photo.imageUrl}
                                className="h-full w-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <Image
                                src={photo.imageUrl}
                                alt={`Medio en ${cat.name}`}
                                fill
                                className="object-cover transition duration-300 group-hover:scale-[1.02]"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                              />
                            )}
                            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                              {isVideoMedia(photo) ? (
                                <span className="shamell-glass-surface rounded border border-sky-400/35 px-1.5 py-0.5 font-body text-[8px] uppercase tracking-wide text-sky-100/95">
                                  Video
                                </span>
                              ) : null}
                              {!photo.isActive ? (
                                <span className="shamell-glass-surface rounded border border-foreground/25 px-1.5 py-0.5 font-brand text-[8px] tracking-[0.1em] text-foreground/70">
                                  Oculto
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 border-t border-gold/10 p-2.5">
                            <p className="truncate font-body text-[10px] text-foreground/40">
                              {formatRelativeEn(photo.updatedAt ?? photo.createdAt)}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startPhotoEdit(photo)}
                                className="rounded-lg border border-gold/20 p-1.5 text-foreground/65 transition hover:bg-gold/10 hover:text-gold"
                                aria-label="Edit media"
                              >
                                <Pencil className="h-3.5 w-3.5" strokeWidth={1.6} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDisablePhoto(photo.id)}
                                className="rounded-lg border border-red-400/25 p-1.5 text-foreground/65 transition hover:bg-red-500/10 hover:text-red-300"
                                aria-label="Delete media"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onTogglePhotoActive(photo)}
                                className={cn(
                                  "relative ml-auto h-7 w-12 shrink-0 rounded-full border transition",
                                  photo.isActive
                                    ? "border-emerald-400/45 bg-emerald-500/22"
                                    : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
                                )}
                                title={photo.isActive ? "Visible on site" : "Hidden on site"}
                                aria-label={`${photo.isActive ? "Hide" : "Show"} on site`}
                              >
                                <span
                                  className={cn(
                                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                                    photo.isActive ? "left-6" : "left-1",
                                  )}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {!isLoading && filteredPhotos.length === 0 ? (
          <p className="mt-8 text-center text-sm text-foreground/60">
            {photos.length === 0
              ? 'No media yet. Use "Upload to category" or "Upload here" on an album.'
              : "Nothing matches the filter or search."}
          </p>
        ) : null}
      </section>

      <AdminModal
        title={editingPhotoId ? "Edit media" : "Upload to a category"}
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          resetPhotoForm();
        }}
      >
        <form id="gallery-photo-form" onSubmit={onSubmitPhoto} className="space-y-6">
          <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
            <p className="flex items-start gap-2 font-body text-xs leading-relaxed text-foreground/75">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
              <span>
                <strong className="text-gold/95">Important:</strong> the file is linked to the category selected
                below. You can switch albums when editing and replace the file if needed.
              </span>
            </p>
          </div>

          <div>
            <p className="font-brand text-[11px] tracking-[0.2em] text-gold/95">1 · DESTINATION CATEGORY</p>
            <div className="mt-3 grid max-h-52 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {activeCategories.map((c) => {
                const selected = selectedCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={cn(
                      "flex flex-col rounded-xl border px-3 py-3 text-left transition",
                      selected
                        ? "border-gold/55 bg-gold/15 ring-1 ring-gold/30"
                        : "shamell-glass-surface border-gold/15 hover:border-gold/30",
                    )}
                  >
                    <span className="font-brand text-sm tracking-[0.06em] text-gold">{c.name}</span>
                    <span className="mt-0.5 font-mono text-[10px] text-foreground/45">/{c.slug}</span>
                    <span className="mt-2 font-body text-[10px] text-foreground/40">
                      {countByCategory[c.id] ?? 0} file(s) in this album
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedCategoryName ? (
              <p className="mt-3 font-body text-xs text-foreground/55">
                Destino: <span className="text-gold/90">«{selectedCategoryName}»</span>
              </p>
            ) : (
              <p className="mt-3 text-xs text-amber-300/90">Select a category to continue.</p>
            )}
          </div>

          <label className="block">
            <p className="font-brand text-[11px] tracking-[0.2em] text-gold/95">2 · FILE</p>
            <div className="shamell-glass-surface mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-gold/25 px-4 py-8 text-center">
              <Upload className="mx-auto h-8 w-8 text-gold/50" strokeWidth={1.3} />
              <p className="mt-2 font-body text-xs text-foreground/55">
                {editingPhotoId
                  ? "Optional: new file (replaces the current one)."
                  : "Image or video — required."}
              </p>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                className="mt-4 w-full max-w-xs cursor-pointer rounded-lg border border-gold/20 px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-gold/20 file:px-3 file:py-1.5 file:text-gold"
              />
              {imageFile ? (
                <p className="mt-2 font-mono text-[10px] text-foreground/50">{imageFile.name}</p>
              ) : null}
            </div>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setIsPhotoModalOpen(false);
                resetPhotoForm();
              }}
              className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingPhoto || !canSubmitPhoto}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
              {isSubmittingPhoto ? "Saving..." : editingPhotoId ? "Save changes" : "Upload to this category"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
