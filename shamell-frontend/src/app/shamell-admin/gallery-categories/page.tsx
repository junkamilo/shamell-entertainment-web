"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { toast } from "@/hooks/use-toast";

type GalleryCategory = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export default function ShamellAdminGalleryCategoriesPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const loadCategories = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/gallery/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudieron cargar las categorias."),
        });
        return;
      }
      setCategories(Array.isArray(data) ? (data as GalleryCategory[]) : []);
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
    void loadCategories();
  }, [loadCategories]);

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategorySlug("");
  };

  const openCategoryCreate = () => {
    resetCategoryForm();
    setIsCategoryModalOpen(true);
  };

  const startCategoryEdit = (category: GalleryCategory) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategorySlug(category.slug);
    setIsCategoryModalOpen(true);
  };

  const onSubmitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;

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
        body: JSON.stringify({
          name: categoryName.trim(),
          slug: categorySlug.trim().toLowerCase(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudo guardar la categoria."),
        });
        return;
      }

      toast({
        title: editingCategoryId ? "Categoria actualizada" : "Categoria creada",
        description: "La categoria de galeria se guardo correctamente.",
      });
      setIsCategoryModalOpen(false);
      resetCategoryForm();
      await loadCategories();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexion",
        description: "No se pudo conectar con el backend.",
      });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const onToggleCategoryActive = async (category: GalleryCategory) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;

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
          description: parseErrorMessage(data, "No se pudo cambiar el estado de la categoria."),
        });
        return;
      }
      await loadCategories();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexion",
        description: "No se pudo conectar con el backend.",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero title="Categorias De Galeria" actionLabel="Nueva categoria" onAction={openCategoryCreate} bordered={false} />

      <section className="rounded-xl border border-gold/20 bg-black/20 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-brand text-lg tracking-[0.08em] text-gold">Categorias</h2>
          {isLoading ? <p className="text-xs text-foreground/60">Cargando...</p> : null}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="rounded-lg border border-gold/20 bg-black/25 p-4">
              <p className="font-brand text-sm tracking-[0.08em] text-gold">{category.name}</p>
              <p className="mt-1 text-xs text-foreground/60">{category.slug}</p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startCategoryEdit(category)}
                  className="rounded-full border border-gold/25 p-1.5 text-foreground/70 transition hover:bg-gold/10 hover:text-gold"
                  aria-label="Editar categoria"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleCategoryActive(category)}
                  className={`relative h-7 w-12 rounded-full border transition ${
                    category.isActive
                      ? "border-emerald-400/50 bg-emerald-500/25"
                      : "border-foreground/25 bg-black/40"
                  }`}
                  aria-label={`${category.isActive ? "Desactivar" : "Activar"} categoria`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      category.isActive ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <AdminModal
        title={editingCategoryId ? "Editar Categoria" : "Nueva Categoria"}
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          resetCategoryForm();
        }}
      >
        <form onSubmit={onSubmitCategory} className="space-y-5">
          <label className="block">
            <span className="text-xs tracking-[0.16em] text-gold/90">NOMBRE</span>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gold/30 bg-black/35 px-4 text-sm text-foreground outline-none focus:border-gold"
              placeholder="Ej. Fire Performance"
            />
          </label>
          <label className="block">
            <span className="text-xs tracking-[0.16em] text-gold/90">SLUG</span>
            <input
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gold/30 bg-black/35 px-4 text-sm text-foreground outline-none focus:border-gold"
              placeholder="fire-performance"
            />
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingCategory || !categoryName.trim() || !categorySlug.trim()}
              className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingCategory ? "Guardando..." : "Guardar categoria"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
