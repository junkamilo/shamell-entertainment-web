"use client";

import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  FormEvent,
  type DragEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  CloudUpload,
  Crosshair,
  Eye,
  GripVertical,
  ImagePlus,
  Loader2,
  Monitor,
  Smartphone,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModal from "@/components/admin/AdminModal";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminPagination from "@/components/admin/AdminPagination";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { cn } from "@/lib/utils";

type HeaderPhoto = {
  id: string;
  imageUrl: string;
  mediaType?: "IMAGE" | "VIDEO";
  focalX: number;
  focalY: number;
  focalMobileX: number;
  focalMobileY: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function headerLibraryItemIsVideo(photo: HeaderPhoto): boolean {
  if (photo.mediaType === "VIDEO") return true;
  return serviceCatalogMediaTypeFromUrl(photo.imageUrl) === "VIDEO";
}

function HeaderLibraryMedia({
  photo,
  className,
  style,
}: {
  photo: HeaderPhoto;
  className: string;
  style: CSSProperties;
}) {
  if (headerLibraryItemIsVideo(photo)) {
    return (
      <video
        src={photo.imageUrl}
        muted
        playsInline
        loop
        autoPlay
        className={cn("absolute inset-0 h-full w-full", className)}
        style={style}
      />
    );
  }
  return (
    <Image
      src={photo.imageUrl}
      alt=""
      fill
      unoptimized
      className={className}
      style={style}
    />
  );
}

function HeaderFocusMedia({
  url,
  isVideo,
  objectPosition,
  className,
}: {
  url: string;
  isVideo: boolean;
  objectPosition: string;
  className: string;
}) {
  if (isVideo) {
    return (
      <video
        src={url}
        muted
        playsInline
        loop
        autoPlay
        className={cn("absolute inset-0 h-full w-full", className)}
        style={{ objectPosition }}
      />
    );
  }
  return (
    <Image
      src={url}
      alt=""
      fill
      unoptimized
      className={className}
      style={{ objectPosition }}
    />
  );
}

function SectionGoldDivider() {
  return (
    <div className="relative my-8 flex items-center justify-center" aria-hidden>
      <div className="h-px w-full max-w-xl bg-linear-to-r from-transparent via-gold/25 to-transparent" />
      <div className="absolute h-2 w-2 rotate-45 border border-gold/35 bg-black/40" />
    </div>
  );
}

export default function ShamellAdminHeaderMediaPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<HeaderPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<Record<string, string>>(
    {},
  );
  const [dragOver, setDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingFocusPhoto, setEditingFocusPhoto] = useState<HeaderPhoto | null>(null);
  const [focusDraft, setFocusDraft] = useState({
    desktopX: 50,
    desktopY: 35,
    mobileX: 50,
    mobileY: 35,
  });
  const [isSavingFocus, setIsSavingFocus] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<HeaderPhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const paginationMeta = useMemo(() => {
    const totalItems = photos.length;
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
  }, [page, perPage, photos.length]);

  const pagedPhotos = useMemo(() => {
    const start = (paginationMeta.page - 1) * paginationMeta.perPage;
    return photos.slice(start, start + paginationMeta.perPage);
  }, [paginationMeta.page, paginationMeta.perPage, photos]);

  const pendingTotalBytes = useMemo(
    () => pendingFiles.reduce((acc, f) => acc + f.size, 0),
    [pendingFiles],
  );

  const focusEditorIsVideo = useMemo(
    () =>
      editingFocusPhoto ? headerLibraryItemIsVideo(editingFocusPhoto) : false,
    [editingFocusPhoto],
  );

  const mergeFiles = useCallback((incoming: File[]) => {
    const mediaFiles = incoming.filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    );
    setPendingFiles((prev) => {
      const seen = new Set(prev.map(fileKey));
      const next = [...prev];
      for (const f of mediaFiles) {
        const k = fileKey(f);
        if (!seen.has(k)) {
          seen.add(k);
          next.push(f);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const keys = new Set(pendingFiles.map(fileKey));
    setPendingPreviews((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!keys.has(k)) {
          URL.revokeObjectURL(next[k]!);
          delete next[k];
        }
      }
      for (const f of pendingFiles) {
        const k = fileKey(f);
        if (!next[k]) next[k] = URL.createObjectURL(f);
      }
      return next;
    });
  }, [pendingFiles]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/header-media/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error("Could not load header photos.");
      }
      setPhotos(Array.isArray(data) ? (data as HeaderPhoto[]) : []);
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (page > paginationMeta.totalPages) {
      setPage(paginationMeta.totalPages);
    }
  }, [page, paginationMeta.totalPages]);

  const clearPending = useCallback(() => {
    setPendingPreviews((prev) => {
      for (const u of Object.values(prev)) URL.revokeObjectURL(u);
      return {};
    });
    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removePendingOne = useCallback((key: string) => {
    setPendingFiles((prev) => prev.filter((f) => fileKey(f) !== key));
  }, []);

  const onPickFiles = () => fileInputRef.current?.click();

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(event.target.files ?? []);
    if (list.length) mergeFiles(list);
    event.target.value = "";
  };

  const onDropzoneDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDropzoneDragLeave = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onDropzoneDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const list = Array.from(e.dataTransfer.files ?? []);
    if (list.length) mergeFiles(list);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    if (!pendingFiles.length) {
      toast({
        variant: "destructive",
        title: "File required",
        description: "Select at least one image or video.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const body = new FormData();
      pendingFiles.forEach((file) => body.append("images", file));
      const response = await fetch(`${apiBaseUrl}/api/v1/header-media/admin/photos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof data?.message === "string"
            ? data.message
            : "Could not upload header photos.";
        throw new Error(message);
      }
      toast({
        title: "Media uploaded",
        description: "Main header images and videos were saved.",
      });
      clearPending();
      await loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Could not upload header photos.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onToggle = async (photo: HeaderPhoto) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/header-media/admin/photos/${photo.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !photo.isActive }),
        },
      );
      if (!response.ok) throw new Error();
      await loadData();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update the item status.",
      });
    }
  };

  const openDeleteConfirm = (photo: HeaderPhoto) => {
    setPendingDelete(photo);
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
      const response = await fetch(
        `${apiBaseUrl}/api/v1/header-media/admin/photos/${pendingDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error();

      if (editingFocusPhoto?.id === pendingDelete.id) {
        setEditingFocusPhoto(null);
      }

      toast({
        title: "Item removed",
        description: "The item was removed from the main header.",
      });
      setPendingDelete(null);
      await loadData();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete the item.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openFocusEditor = (photo: HeaderPhoto) => {
    setEditingFocusPhoto(photo);
    setFocusDraft({
      desktopX: clampPercent(photo.focalX),
      desktopY: clampPercent(photo.focalY),
      mobileX: clampPercent(photo.focalMobileX),
      mobileY: clampPercent(photo.focalMobileY),
    });
  };

  const closeFocusEditor = () => {
    if (isSavingFocus) return;
    setEditingFocusPhoto(null);
  };

  const setDraftFromPoint = (
    event: MouseEvent<HTMLDivElement>,
    target: "desktop" | "mobile",
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const nextX = clampPercent(x);
    const nextY = clampPercent(y);
    setFocusDraft((prev) =>
      target === "desktop"
        ? { ...prev, desktopX: nextX, desktopY: nextY }
        : { ...prev, mobileX: nextX, mobileY: nextY },
    );
  };

  const saveFocusEditor = async () => {
    if (!editingFocusPhoto) return;
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    setIsSavingFocus(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/header-media/admin/photos/${editingFocusPhoto.id}/focal`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            focalX: clampPercent(focusDraft.desktopX),
            focalY: clampPercent(focusDraft.desktopY),
            focalMobileX: clampPercent(focusDraft.mobileX),
            focalMobileY: clampPercent(focusDraft.mobileY),
          }),
        },
      );
      if (!response.ok) throw new Error();
      setPhotos((prev) =>
        prev.map((item) =>
          item.id === editingFocusPhoto.id
            ? {
                ...item,
                focalX: clampPercent(focusDraft.desktopX),
                focalY: clampPercent(focusDraft.desktopY),
                focalMobileX: clampPercent(focusDraft.mobileX),
                focalMobileY: clampPercent(focusDraft.mobileY),
              }
            : item,
        ),
      );
      toast({
        title: "Focus updated",
        description: "Focal point saved for desktop and mobile.",
      });
      setEditingFocusPhoto(null);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the focal point.",
      });
    } finally {
      setIsSavingFocus(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminBackButton href="/shamell-admin" label="Back" className="mb-4" />

      <AdminModuleHero
        title="Main header"
        actionLabel="Upload media"
        onAction={onPickFiles}
        bordered={false}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={onInputChange}
      />

      <section className="shamell-glass-surface rounded-2xl border border-gold/15 p-5 md:p-6">
        {/* 01 — Upload zone */}
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="font-brand text-[11px] tracking-[0.2em] text-gold/90">
            01 — UPLOAD MEDIA
          </p>
        </div>

        <button
          type="button"
          onClick={onPickFiles}
          onDragOver={onDropzoneDragOver}
          onDragLeave={onDropzoneDragLeave}
          onDrop={onDropzoneDrop}
          className={cn(
            "flex min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition",
            dragOver
              ? "border-gold/50 bg-gold/8 ring-2 ring-gold/20"
              : "border-gold/25 bg-black/10 hover:border-gold/38",
          )}
        >
          <CloudUpload className="h-10 w-10 text-gold/80" strokeWidth={1.25} aria-hidden />
          <p className="mt-4 font-body text-sm text-foreground">
            Drag images or videos here or{" "}
            <span className="font-medium text-gold underline decoration-gold/40 underline-offset-4">
              choose files
            </span>
          </p>
          <p className="mt-2 max-w-md font-body text-xs text-foreground/55">
            JPG · PNG · WebP · MP4 · WebM · 1920 × 1080 recommended · multiple files allowed
          </p>
        </button>

        {/* Library */}
        <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-brand text-lg tracking-[0.08em] text-gold">Library</h2>
            <span className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-0.5 font-brand text-[10px] tracking-widest text-gold">
              {isLoading ? "…" : `${paginationMeta.totalItems} item${paginationMeta.totalItems === 1 ? "" : "s"}`}
            </span>
          </div>
          <span
            className="inline-flex cursor-not-allowed items-center gap-1.5 text-xs text-foreground/40"
            title="Slider order requires server support (coming soon)."
          >
            <GripVertical className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            Manual order unavailable
          </span>
        </div>

        {photos.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gold/20 px-6 py-12 text-center">
            <ImagePlus className="h-9 w-9 text-gold/35" />
            <p className="mt-3 text-sm text-foreground/55">
              No media in the main header yet.
            </p>
          </div>
        ) : isLoading && photos.length === 0 ? (
          <div className="flex justify-center py-14 text-gold">
            <Loader2 className="h-9 w-9 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pagedPhotos.map((photo, idx) => {
              const globalIndex =
                (paginationMeta.page - 1) * paginationMeta.perPage + idx + 1;
              return (
                <article
                  key={photo.id}
                  className={cn(
                    "overflow-hidden rounded-xl border border-gold/18",
                    !photo.isActive && "opacity-55",
                  )}
                >
                  <div className="relative aspect-video">
                    <HeaderLibraryMedia
                      photo={photo}
                      className="object-cover"
                      style={{
                        objectPosition: `${clampPercent(photo.focalX)}% ${clampPercent(photo.focalY)}%`,
                      }}
                    />
                    <span className="absolute left-2 top-2 rounded-md border border-gold/35 bg-black/55 px-2 py-0.5 font-brand text-[10px] tracking-widest text-gold">
                      #{globalIndex}
                    </span>
                    <span
                      className={cn(
                        "absolute right-2 top-2 rounded-md border px-2 py-0.5 font-brand text-[10px] tracking-widest",
                        photo.isActive
                          ? "border-emerald-400/45 bg-black/55 text-emerald-200"
                          : "border-gold/30 bg-black/55 text-foreground/60",
                      )}
                    >
                      {photo.isActive ? "● ACTIVE" : "● INACTIVE"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gold/12 bg-black/20 px-2.5 py-2">
                    <button
                      type="button"
                      onClick={() => window.open(photo.imageUrl, "_blank", "noopener,noreferrer")}
                      className="shrink-0 rounded-lg border border-gold/25 p-1.5 text-gold transition hover:bg-gold/10"
                      aria-label="Open in new tab"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openFocusEditor(photo)}
                      className="shrink-0 rounded-lg border border-gold/25 p-1.5 text-gold transition hover:bg-gold/10"
                      aria-label="Adjust focus"
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggle(photo)}
                      className={cn(
                        "relative h-7 w-12 shrink-0 rounded-full border transition",
                        photo.isActive
                          ? "border-emerald-400/45 bg-emerald-500/22"
                          : "border-gold/40 bg-gold/10",
                      )}
                      aria-label={photo.isActive ? "Hide from slider" : "Show in slider"}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
                          photo.isActive ? "left-6" : "left-1",
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(photo)}
                      className="shrink-0 rounded-lg border border-red-400/30 p-1.5 text-red-200 transition hover:bg-red-500/10"
                      aria-label="Delete item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {photos.length > 0 ? (
          <AdminPagination
            className="mt-6 border-t border-gold/10 pt-4"
            meta={paginationMeta}
            onPageChange={setPage}
            onPerPageChange={(next) => {
              setPerPage(next);
              setPage(DEFAULT_PAGINATION_META.page);
            }}
          />
        ) : null}

        {pendingFiles.length > 0 ? (
          <>
            <SectionGoldDivider />

            <form onSubmit={onSubmit}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="inline-flex rounded-full border border-gold/35 px-3 py-1 font-brand text-[10px] tracking-[0.16em] text-gold">
                  02 — READY TO PUBLISH
                </p>
                <button
                  type="button"
                  onClick={onPickFiles}
                  className="rounded-full border border-gold/28 px-3 py-1.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/12"
                >
                  + ADD MORE
                </button>
              </div>

              <div className="rounded-xl border border-dashed border-gold/22 bg-black/15 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/10 pb-3">
                  <p className="font-body text-sm text-foreground">
                    <span className="font-semibold text-gold/90">{pendingFiles.length}</span> file
                    {pendingFiles.length === 1 ? "" : "s"} selected
                    {" · "}
                    <span className="text-foreground/70">{formatFileSize(pendingTotalBytes)} total</span>
                  </p>
                </div>
                <ul className="mt-3 space-y-3">
                  {pendingFiles.map((file) => {
                    const k = fileKey(file);
                    const previewUrl = pendingPreviews[k];
                    return (
                      <li
                        key={k}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/12 bg-black/20 p-3"
                      >
                        <div className="relative h-14 w-18 shrink-0 overflow-hidden rounded-md border border-gold/15 bg-black/30">
                          {previewUrl ? (
                            file.type.startsWith("video/") ? (
                              <video
                                src={previewUrl}
                                muted
                                playsInline
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <Image
                                src={previewUrl}
                                alt=""
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            )
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImagePlus className="h-6 w-6 text-gold/30" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-body text-xs text-foreground">{file.name}</p>
                          <p className="font-body text-[11px] text-foreground/50">
                            {formatFileSize(file.size)}
                            {isSaving ? (
                              <>
                                {" · "}
                                <span className="text-gold">Publicando...</span>
                              </>
                            ) : (
                              <>
                                {" · "}
                                <span className="text-foreground/45">Queued</span>
                              </>
                            )}
                          </p>
                          {isSaving ? (
                            <div className="mt-2 h-1 overflow-hidden rounded-full bg-gold/15">
                              <div className="h-full w-[60%] animate-pulse rounded-full bg-gold/55" />
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => removePendingOne(k)}
                          className="shrink-0 rounded-lg border border-gold/25 p-1.5 text-foreground/70 transition hover:bg-gold/10 hover:text-gold disabled:opacity-40"
                          aria-label="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 pt-4">
                  <p className="flex items-center gap-2 font-body text-xs text-foreground/50">
                    <span className="inline-block h-2 w-2 rounded-full bg-gold/50" aria-hidden />
                    Images and videos publish when you confirm.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => clearPending()}
                      className="rounded-xl border border-gold/28 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/80 transition hover:border-gold/45 hover:text-gold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || pendingFiles.length === 0}
                      className="inline-flex items-center gap-2 rounded-xl border border-gold/35 bg-gold/12 px-5 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Publish {pendingFiles.length} file{pendingFiles.length === 1 ? "" : "s"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </>
        ) : null}
      </section>

      {editingFocusPhoto ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[94svh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gold/20 bg-[#0b0f14]">
            <div className="flex items-start justify-between gap-4 border-b border-gold/10 px-4 py-3 md:px-6 md:py-4">
              <div>
                <h3 className="font-brand text-base tracking-[0.12em] text-gold">Adjust hero focus</h3>
                <p className="mt-1 text-xs text-foreground/60">
                  Click the preview to move the focal point. This improves framing on laptop and mobile.
                </p>
              </div>
              <button
                type="button"
                onClick={closeFocusEditor}
                className="rounded-lg border border-gold/30 p-1.5 text-foreground/70 transition hover:bg-gold/10 hover:text-gold"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
              <div
                role="button"
                tabIndex={0}
                onClick={(event) => setDraftFromPoint(event, "desktop")}
                onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                  }
                }}
                className="relative aspect-video cursor-crosshair overflow-hidden rounded-xl border border-gold/20 sm:aspect-16/8"
              >
                <HeaderFocusMedia
                  url={editingFocusPhoto.imageUrl}
                  isVideo={focusEditorIsVideo}
                  objectPosition={`${focusDraft.desktopX}% ${focusDraft.desktopY}%`}
                  className="object-cover scale-[1.12]"
                />
                <span
                  className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-black/50"
                  style={{ left: `${focusDraft.desktopX}%`, top: `${focusDraft.desktopY}%` }}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
                <div className="w-full">
                  <p className="mb-2 inline-flex items-center gap-1 text-[11px] tracking-widest text-gold/75">
                    <Monitor className="h-3.5 w-3.5" />
                    PREVIEW DESKTOP
                  </p>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(event) => setDraftFromPoint(event, "desktop")}
                    onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                      }
                    }}
                    className="relative aspect-video w-full cursor-crosshair overflow-hidden rounded-xl border border-gold/20"
                  >
                    <HeaderFocusMedia
                      url={editingFocusPhoto.imageUrl}
                      isVideo={focusEditorIsVideo}
                      objectPosition={`${focusDraft.desktopX}% ${focusDraft.desktopY}%`}
                      className="object-cover scale-[1.12]"
                    />
                    <span
                      className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-black/50"
                      style={{ left: `${focusDraft.desktopX}%`, top: `${focusDraft.desktopY}%` }}
                    />
                  </div>
                  <label className="mt-3 block">
                    <span className="mb-1 block text-[11px] tracking-widest text-gold/80">
                      DESKTOP X ({focusDraft.desktopX}%)
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={focusDraft.desktopX}
                      onChange={(event) =>
                        setFocusDraft((prev) => ({
                          ...prev,
                          desktopX: clampPercent(Number(event.target.value)),
                        }))
                      }
                      className="w-full accent-gold"
                    />
                  </label>
                  <label className="mt-3 block">
                    <span className="mb-1 block text-[11px] tracking-widest text-gold/80">
                      DESKTOP Y ({focusDraft.desktopY}%)
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={focusDraft.desktopY}
                      onChange={(event) =>
                        setFocusDraft((prev) => ({
                          ...prev,
                          desktopY: clampPercent(Number(event.target.value)),
                        }))
                      }
                      className="w-full accent-gold"
                    />
                  </label>
                </div>
                <div className="md:justify-self-end">
                  <p className="mb-2 inline-flex items-center gap-1 text-[11px] tracking-widest text-gold/75">
                    <Smartphone className="h-3.5 w-3.5" />
                    PREVIEW MOBILE
                  </p>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(event) => setDraftFromPoint(event, "mobile")}
                    onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                      }
                    }}
                    className="relative mx-auto aspect-9/16 w-full max-w-[220px] cursor-crosshair overflow-hidden rounded-xl border border-gold/20 md:mx-0"
                  >
                    <HeaderFocusMedia
                      url={editingFocusPhoto.imageUrl}
                      isVideo={focusEditorIsVideo}
                      objectPosition={`${focusDraft.mobileX}% ${focusDraft.mobileY}%`}
                      className="object-cover scale-[1.12]"
                    />
                    <span
                      className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-black/50"
                      style={{ left: `${focusDraft.mobileX}%`, top: `${focusDraft.mobileY}%` }}
                    />
                  </div>
                  <label className="mt-3 block">
                    <span className="mb-1 block text-[11px] tracking-widest text-gold/80">
                      MOBILE X ({focusDraft.mobileX}%)
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={focusDraft.mobileX}
                      onChange={(event) =>
                        setFocusDraft((prev) => ({
                          ...prev,
                          mobileX: clampPercent(Number(event.target.value)),
                        }))
                      }
                      className="w-full accent-gold"
                    />
                  </label>
                  <label className="mt-3 block">
                    <span className="mb-1 block text-[11px] tracking-widest text-gold/80">
                      MOBILE Y ({focusDraft.mobileY}%)
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={focusDraft.mobileY}
                      onChange={(event) =>
                        setFocusDraft((prev) => ({
                          ...prev,
                          mobileY: clampPercent(Number(event.target.value)),
                        }))
                      }
                      className="w-full accent-gold"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 px-4 py-3 md:px-6 md:py-4">
              <p className="text-xs text-foreground/55">
                Tip: use a sharp image with the main subject centered and a little breathing room.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeFocusEditor}
                  disabled={isSavingFocus}
                  className="rounded-xl border border-gold/28 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/80 transition hover:border-gold/45 hover:text-gold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveFocusEditor}
                  disabled={isSavingFocus}
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/35 bg-gold/12 px-5 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/20 disabled:opacity-50"
                >
                  {isSavingFocus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save focal point
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AdminModal
        title="Remove header media"
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
      >
        <div className="space-y-5 font-body text-sm text-foreground/85">
          <p>
            Permanently remove this{" "}
            {pendingDelete && headerLibraryItemIsVideo(pendingDelete)
              ? "video"
              : "image"}{" "}
            from the main header? You will not be able to recover it.
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
