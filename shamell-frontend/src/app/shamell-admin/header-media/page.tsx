"use client";

import {
  type ChangeEvent,
  FormEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  CloudUpload,
  Eye,
  GripVertical,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminPagination from "@/components/admin/AdminPagination";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type HeaderPhoto = {
  id: string;
  imageUrl: string;
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

function displayNameFromImageUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last && last.includes(".")) return decodeURIComponent(last.slice(0, 48));
    return decodeURIComponent(last ?? "Imagen").slice(0, 48);
  } catch {
    const trimmed = url.split("?")[0];
    const last = trimmed.split("/").pop();
    return (last ? decodeURIComponent(last) : "Imagen").slice(0, 48);
  }
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

  const mergeFiles = useCallback((incoming: File[]) => {
    const imageFiles = incoming.filter((f) => f.type.startsWith("image/"));
    setPendingFiles((prev) => {
      const seen = new Set(prev.map(fileKey));
      const next = [...prev];
      for (const f of imageFiles) {
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
        throw new Error("No se pudieron cargar las fotos del header.");
      }
      setPhotos(Array.isArray(data) ? (data as HeaderPhoto[]) : []);
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexión",
        description: "No se pudo conectar con el backend.",
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
        title: "Archivo requerido",
        description: "Selecciona al menos una imagen.",
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
            : "No se pudieron subir las fotos del header.";
        throw new Error(message);
      }
      toast({
        title: "Fotos subidas",
        description: "Las imágenes del header principal se guardaron correctamente.",
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
            : "No se pudieron subir las fotos del header.",
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
        description: "No se pudo actualizar el estado de la foto.",
      });
    }
  };

  const onDelete = async (photoId: string) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/header-media/admin/photos/${photoId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error();
      toast({
        title: "Foto eliminada",
        description: "La foto se eliminó del header principal.",
      });
      await loadData();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la foto.",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminBackButton href="/shamell-admin" label="Volver" className="mb-4" />

      <AdminModuleHero
        title="Header principal"
        actionLabel="Subir fotos"
        onAction={onPickFiles}
        bordered={false}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onInputChange}
      />

      <section className="shamell-glass-surface rounded-2xl border border-gold/15 p-5 md:p-6">
        {/* 01 — Zona de carga */}
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="font-brand text-[11px] tracking-[0.2em] text-gold/90">
            01 — SUBIR IMÁGENES
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
            Arrastra imágenes aquí o{" "}
            <span className="font-medium text-gold underline decoration-gold/40 underline-offset-4">
              selecciona archivos
            </span>
          </p>
          <p className="mt-2 max-w-md font-body text-xs text-foreground/55">
            JPG · PNG · WebP · recomendado 1920 × 1080 · varias archivos permitidas
          </p>
        </button>

        {/* Biblioteca */}
        <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-brand text-lg tracking-[0.08em] text-gold">Biblioteca</h2>
            <span className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-0.5 font-brand text-[10px] tracking-widest text-gold">
              {isLoading ? "…" : `${paginationMeta.totalItems} foto${paginationMeta.totalItems === 1 ? "" : "s"}`}
            </span>
          </div>
          <span
            className="inline-flex cursor-not-allowed items-center gap-1.5 text-xs text-foreground/40"
            title="El orden del slider requiere soporte en el servidor (próximamente)."
          >
            <GripVertical className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            Orden manual no disponible
          </span>
        </div>

        {photos.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gold/20 px-6 py-12 text-center">
            <ImagePlus className="h-9 w-9 text-gold/35" />
            <p className="mt-3 text-sm text-foreground/55">
              No hay fotos en el header principal todavía.
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
              const fileLabel = displayNameFromImageUrl(photo.imageUrl);
              return (
                <article
                  key={photo.id}
                  className={cn(
                    "overflow-hidden rounded-xl border border-gold/18",
                    !photo.isActive && "opacity-55",
                  )}
                >
                  <div className="relative aspect-video">
                    <Image
                      src={photo.imageUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
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
                      {photo.isActive ? "● ACTIVA" : "● INACTIVA"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-gold/12 bg-black/20 px-2.5 py-2">
                    <p className="min-w-0 flex-1 truncate font-body text-[11px] text-foreground/70" title={fileLabel}>
                      {fileLabel}
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open(photo.imageUrl, "_blank", "noopener,noreferrer")}
                      className="shrink-0 rounded-lg border border-gold/25 p-1.5 text-gold transition hover:bg-gold/10"
                      aria-label="Ver imagen en nueva pestaña"
                    >
                      <Eye className="h-3.5 w-3.5" />
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
                      aria-label={photo.isActive ? "Desactivar en slider" : "Activar en slider"}
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
                      onClick={() => onDelete(photo.id)}
                      className="ml-auto shrink-0 rounded-lg border border-red-400/30 p-1.5 text-red-200 transition hover:bg-red-500/10"
                      aria-label="Eliminar foto"
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
                  02 — LISTO PARA PUBLICAR
                </p>
                <button
                  type="button"
                  onClick={onPickFiles}
                  className="rounded-full border border-gold/28 px-3 py-1.5 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/12"
                >
                  + AÑADIR
                </button>
              </div>

              <div className="rounded-xl border border-dashed border-gold/22 bg-black/15 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/10 pb-3">
                  <p className="font-body text-sm text-foreground">
                    <span className="font-semibold text-gold/90">{pendingFiles.length}</span> archivo
                    {pendingFiles.length === 1 ? "" : "s"} seleccionado
                    {pendingFiles.length === 1 ? "" : "s"}
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
                        <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-md border border-gold/15 bg-black/30">
                          {previewUrl ? (
                            <Image
                              src={previewUrl}
                              alt=""
                              fill
                              unoptimized
                              className="object-cover"
                            />
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
                                <span className="text-foreground/45">En cola</span>
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
                          aria-label="Quitar archivo"
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
                    Las imágenes se publican al confirmar.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => clearPending()}
                      className="rounded-xl border border-gold/28 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/80 transition hover:border-gold/45 hover:text-gold disabled:opacity-50"
                    >
                      Cancelar
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
                      Publicar {pendingFiles.length} foto{pendingFiles.length === 1 ? "" : "s"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </>
        ) : null}
      </section>
    </div>
  );
}
