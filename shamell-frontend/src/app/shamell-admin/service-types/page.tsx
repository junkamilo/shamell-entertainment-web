"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Cake,
  Crown,
  Flame,
  Heart,
  MoreHorizontal,
  Music,
  Pencil,
  Sparkles,
  Star,
} from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PAGINATION_META } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type ServiceTypeItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

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

type FilterTab = "all" | "active" | "inactive";

export default function ShamellAdminServiceTypesPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [types, setTypes] = useState<ServiceTypeItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpenId]);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

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
        title: "Sesión requerida",
        description: "Debes iniciar sesión como admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const typesResponse = await fetch(`${apiBaseUrl}/api/v1/services/types/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const typesData = await typesResponse.json().catch(() => []);
      if (!typesResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(typesData, "No se pudieron cargar los tipos de servicio."),
        });
        return;
      }
      setTypes(Array.isArray(typesData) ? (typesData as ServiceTypeItem[]) : []);
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexión",
        description: "No se pudo conectar con el backend.",
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
  const hasChanges = editingId ? nameChanged : trimmedName.length > 0;
  const canSubmit = !isSubmitting && isNameValid && hasChanges;

  const getNameValidationError = () => {
    if (!trimmedName) return "Debes ingresar un nombre para el tipo de servicio.";
    if (!hasValidLength) {
      return `El nombre debe tener entre ${NAME_MIN_LENGTH} y ${NAME_MAX_LENGTH} caracteres.`;
    }
    if (!hasValidChars) {
      return "Solo se permiten letras, espacios, guiones y '&'. No se permiten números.";
    }
    if (!hasChanges) {
      return "No hay cambios para guardar.";
    }
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sesión requerida",
        description: "Debes iniciar sesión como admin.",
      });
      return;
    }

    const validationError = getNameValidationError();
    if (validationError) {
      toast({
        variant: "destructive",
        title: "Revisa el formulario",
        description: validationError,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingId
        ? `${apiBaseUrl}/api/v1/services/types/admin/${editingId}`
        : `${apiBaseUrl}/api/v1/services/types/admin`;
      const method = editingId ? "PATCH" : "POST";
      const body = JSON.stringify({ name: trimmedName });

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
          description: parseErrorMessage(data, "No se pudo guardar el tipo de servicio."),
        });
        return;
      }

      toast({
        title: editingId ? "Tipo actualizado" : "Tipo creado",
        description: editingId
          ? "Los cambios del tipo se guardaron correctamente."
          : "El nuevo tipo de servicio se creó correctamente.",
      });
      resetForm();
      setIsModalOpen(false);
      await loadTypes();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexión",
        description: "No se pudo conectar con el backend.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: ServiceTypeItem) => {
    setEditingId(item.id);
    setName(item.name);
    setIsModalOpen(true);
    setMenuOpenId(null);
  };

  const onToggleActive = async (item: ServiceTypeItem) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sesión requerida",
        description: "Debes iniciar sesión como admin.",
      });
      return;
    }

    setTogglingId(item.id);
    setMenuOpenId(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/services/types/admin/${item.id}`, {
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
          description: parseErrorMessage(data, "No se pudo actualizar el estado del tipo de servicio."),
        });
        return;
      }

      if (editingId === item.id && !item.isActive) {
        resetForm();
      }

      toast({
        title: item.isActive ? "Tipo desactivado" : "Tipo activado",
        description: item.isActive
          ? "El tipo de servicio fue desactivado correctamente."
          : "El tipo de servicio fue activado correctamente.",
      });
      await loadTypes();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexión",
        description: "No se pudo conectar con el backend.",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const onHeroAction = () => openCreateModal();

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTab]);

  const filteredTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = types.filter((item) => item.name.toLowerCase().includes(q));
    if (filterTab === "active") list = list.filter((t) => t.isActive);
    if (filterTab === "inactive") list = list.filter((t) => !t.isActive);
    return list;
  }, [types, searchQuery, filterTab]);

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
        title="Tipos de servicio"
        actionLabel="Nuevo tipo"
        onAction={onHeroAction}
        bordered={false}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["TOTAL", String(stats.total)],
            ["ACTIVOS", String(stats.active)],
            ["INACTIVOS", String(stats.inactive)],
            ["ACTUALIZADO", stats.recentLabel],
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
          placeholder="Buscar tipo de servicio..."
          className="mx-0 min-h-[3rem] max-w-none flex-1"
        />
        <div className="flex flex-wrap gap-2 lg:shrink-0">
          {filterPill("all", "Todos")}
          {filterPill("active", "Activos")}
          {filterPill("inactive", "Inactivos")}
        </div>
      </div>

      <section className="shamell-glass-surface rounded-xl p-5 md:p-7">
        {isLoading ? <p className="text-sm text-foreground/65">Cargando...</p> : null}
        {!isLoading && filteredTypes.length === 0 ? (
          <p className="text-sm text-foreground/65">
            {types.length === 0 ? "Aún no hay tipos de servicio." : "Nada coincide con tu búsqueda o filtro."}
          </p>
        ) : null}

        <div className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedTypes.map((item) => {
            const Icon = iconForTypeName(item.name);
            return (
              <article
                key={item.id}
                className="shamell-glass-surface relative flex flex-col rounded-2xl border border-gold/16 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "flex items-center gap-2 font-brand text-[10px] tracking-[0.16em]",
                      item.isActive ? "text-emerald-400/90" : "text-foreground/45",
                    )}
                  >
                    <span className="text-gold/90">•</span>
                    {item.isActive ? "ACTIVA" : "INACTIVA"}
                  </p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpenId((prev) => (prev === item.id ? null : item.id));
                      }}
                      className="rounded-lg border border-transparent p-1.5 text-foreground/55 transition hover:border-gold/20 hover:bg-gold/5 hover:text-gold"
                      aria-label={`Más opciones: ${item.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" strokeWidth={1.6} />
                    </button>
                    {menuOpenId === item.id ? (
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-lg border border-gold/20 bg-[#0c0c0c] py-1 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full px-3 py-2 text-left text-xs text-foreground/85 hover:bg-gold/10 hover:text-gold"
                          onClick={() => startEdit(item)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full px-3 py-2 text-left text-xs text-foreground/85 hover:bg-gold/10 hover:text-gold"
                          onClick={() => void onToggleActive(item)}
                          disabled={togglingId === item.id}
                        >
                          {item.isActive ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10">
                    <Icon className="h-5 w-5 text-gold/90" strokeWidth={1.4} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-brand text-lg tracking-[0.06em] text-gold md:text-xl">{item.name}</h2>
                    <p className="mt-1 font-body text-xs leading-relaxed text-foreground/50">
                      Servicios y paquetes agrupados bajo esta categoría.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2 border-t border-gold/12 pt-4">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-lg border border-gold/22 p-2 text-foreground/65 transition hover:bg-gold/10 hover:text-gold"
                    aria-label={`Editar ${item.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onToggleActive(item)}
                    disabled={togglingId === item.id}
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full border transition",
                      item.isActive
                        ? "border-emerald-400/45 bg-emerald-500/22"
                        : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
                      togglingId === item.id && "cursor-not-allowed opacity-60",
                    )}
                    aria-label={`${item.isActive ? "Desactivar" : "Activar"} ${item.name}`}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                        item.isActive ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {!isLoading && filteredTypes.length > 0 ? (
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
      </section>

      <AdminModal
        title={editingId ? "Editar tipo de servicio" : "Nuevo tipo de servicio"}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form id="service-type-form" noValidate onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">NOMBRE DEL TIPO</span>
            <input
              type="text"
              value={name}
              required
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-base text-foreground outline-none focus:border-gold"
              placeholder="Ej. Bodas"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear tipo"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
