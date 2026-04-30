"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { toast } from "@/hooks/use-toast";

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
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export default function ShamellAdminGalleryPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
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
        title: "Sesion requerida",
        description: "Debes iniciar sesion como admin.",
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
          description: parseErrorMessage(categoriesData, "No se pudieron cargar las categorias."),
        });
        return;
      }
      setCategories(Array.isArray(categoriesData) ? (categoriesData as GalleryCategory[]) : []);

      const photosData = await photosResponse.json().catch(() => []);
      if (!photosResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(photosData, "No se pudieron cargar las fotos."),
        });
        return;
      }
      setPhotos(Array.isArray(photosData) ? (photosData as GalleryPhoto[]) : []);
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexion",
        description: "No se pudo conectar con el backend.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, parseErrorMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const resetPhotoForm = () => {
    setEditingPhotoId(null);
    setSelectedCategoryId((current) => current || categories.find((item) => item.isActive)?.id || "");
    setImageFile(null);
  };

  const openPhotoCreate = () => {
    resetPhotoForm();
    setIsPhotoModalOpen(true);
  };

  const startPhotoEdit = (photo: GalleryPhoto) => {
    setEditingPhotoId(photo.id);
    setSelectedCategoryId(photo.category.id);
    setImageFile(null);
    setIsPhotoModalOpen(true);
  };

  const onSubmitPhoto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;

    if (!editingPhotoId && !imageFile) {
      toast({
        variant: "destructive",
        title: "Revisa el formulario",
        description: "Debes seleccionar una imagen.",
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
      if (imageFile) body.append("image", imageFile);

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
          description: parseErrorMessage(data, "No se pudo guardar la foto."),
        });
        return;
      }

      toast({
        title: editingPhotoId ? "Foto actualizada" : "Foto subida",
        description: "La imagen se guardo correctamente.",
      });
      setIsPhotoModalOpen(false);
      resetPhotoForm();
      await loadData();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexion",
        description: "No se pudo conectar con el backend.",
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
          description: parseErrorMessage(data, "No se pudo cambiar el estado de la foto."),
        });
        return;
      }
      await loadData();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexion",
        description: "No se pudo conectar con el backend.",
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
          description: parseErrorMessage(data, "No se pudo desactivar la foto."),
        });
        return;
      }
      await loadData();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexion",
        description: "No se pudo conectar con el backend.",
      });
    }
  };

  const filteredPhotos = photos.filter((photo) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const searchable = `${photo.category.name} ${photo.category.slug}`.toLowerCase();
    return searchable.includes(q);
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero title="Galería" actionLabel="Subir Imagen" onAction={openPhotoCreate} bordered={false} />

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/shamell-admin/gallery-categories"
          className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/15 px-4 py-2 text-sm text-gold transition hover:bg-gold/25"
        >
          Gestionar categorias
        </Link>
      </div>

      <AdminSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar por categoria..."
        className="mb-6"
      />

      <section id="media-library" className="rounded-xl border border-gold/20 bg-black/20 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-brand text-lg tracking-[0.08em] text-gold">Fotos</h2>
          {isLoading ? <p className="text-xs text-foreground/60">Cargando...</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPhotos.map((photo) => (
            <article key={photo.id} className="overflow-hidden rounded-xl border border-gold/20 bg-black/25">
              <div className="relative h-48 w-full">
                <Image
                  src={photo.imageUrl}
                  alt={`Foto de ${photo.category.name}`}
                  fill
                  className="object-cover"
                  sizes="33vw"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-foreground">{photo.category.name}</p>
                <p className="mt-1 text-xs text-foreground/60">{photo.category.slug}</p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPhotoEdit(photo)}
                    className="rounded-full border border-gold/25 p-1.5 text-foreground/70 transition hover:bg-gold/10 hover:text-gold"
                    aria-label="Editar foto"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDisablePhoto(photo.id)}
                    className="rounded-full border border-red-300/30 p-1.5 text-foreground/70 transition hover:bg-red-300/10 hover:text-red-300"
                    aria-label="Desactivar foto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onTogglePhotoActive(photo)}
                    className={`relative ml-auto h-7 w-12 rounded-full border transition ${
                      photo.isActive
                        ? "border-emerald-400/50 bg-emerald-500/25"
                        : "border-foreground/25 bg-black/40"
                    }`}
                    aria-label={`${photo.isActive ? "Desactivar" : "Activar"} foto`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                        photo.isActive ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <AdminModal
        title={editingPhotoId ? "Editar Foto" : "Nueva Foto"}
        isOpen={isPhotoModalOpen}
        onClose={() => {
          setIsPhotoModalOpen(false);
          resetPhotoForm();
        }}
      >
        <form onSubmit={onSubmitPhoto} className="space-y-5">
          <label className="block">
            <span className="text-xs tracking-[0.16em] text-gold/90">CATEGORIA</span>
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gold/30 bg-black/35 px-4 text-sm text-foreground outline-none focus:border-gold"
            >
              <option value="">Selecciona una categoria</option>
              {categories
                .filter((category) => category.isActive)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs tracking-[0.16em] text-gold/90">IMAGEN</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-xl border border-gold/30 bg-black/35 px-4 py-3 text-sm text-foreground outline-none file:mr-3 file:border-0 file:bg-gold/20 file:px-3 file:py-1 file:text-gold"
            />
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingPhoto || !selectedCategoryId}
              className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingPhoto ? "Guardando..." : "Guardar foto"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
