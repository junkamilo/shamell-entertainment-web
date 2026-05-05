"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Cake,
  ChevronDown,
  ChevronUp,
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
import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";
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
  occasionAssignments?: { occasionTypeId: string; usage: OccasionUsage; sortOrder?: number }[];
};

type AdminEventRow = {
  eventTypeId: string;
};

function packOccasionAssignments(singleIds: string[], projectIds: string[], roleIds: string[]) {
  return [
    ...singleIds.map((occasionTypeId) => ({ occasionTypeId, usage: "OCCASION_SINGLE" as const })),
    ...projectIds.map((occasionTypeId) => ({ occasionTypeId, usage: "BESPOKE_PROJECT" as const })),
    ...roleIds.map((occasionTypeId) => ({ occasionTypeId, usage: "BESPOKE_ROLE" as const })),
  ];
}

/** Order matters: matches backend `EventTypeOccasion.sortOrder` sequence within each usage block. */
function occasionAssignmentsOrderedSignature(rows: { occasionTypeId: string; usage: OccasionUsage }[]) {
  return JSON.stringify(rows.map((r) => ({ occasionTypeId: r.occasionTypeId, usage: r.usage })));
}

function swapAdjacentInList(ids: string[], index: number, delta: number): string[] {
  const j = index + delta;
  if (j < 0 || j >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[j]] = [next[j], next[index]];
  return next;
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

function formatRelativeEs(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 45) return "Hace un momento";
  const min = Math.floor(sec / 60);
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d}d`;
  const w = Math.floor(d / 7);
  if (w < 8) return `Hace ${w} sem`;
  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [types, setTypes] = useState<EventTypeItem[]>([]);
  const [eventCountByTypeId, setEventCountByTypeId] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [occasionCatalog, setOccasionCatalog] = useState<OccasionCatalogItem[]>([]);
  const [singleIds, setSingleIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [occasionPickerOpen, setOccasionPickerOpen] = useState(false);
  const occasionPickerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!occasionPickerOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = occasionPickerRef.current;
      if (el && !el.contains(e.target as Node)) setOccasionPickerOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [occasionPickerOpen]);

  useEffect(() => {
    if (!isModalOpen) setOccasionPickerOpen(false);
  }, [isModalOpen]);

  const resetForm = () => {
    setName("");
    setSingleIds([]);
    setProjectIds([]);
    setRoleIds([]);
    setEditingId(null);
    setOccasionPickerOpen(false);
  };

  const toggleOccasion = (id: string, list: string[], setList: (next: string[]) => void) => {
    if (list.includes(id)) setList(list.filter((x) => x !== id));
    else setList([...list, id]);
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
      setEventCountByTypeId({});
      toast({
        variant: "destructive",
        title: "Sesión requerida",
        description: "Debes iniciar sesión como admin.",
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
          description: parseErrorMessage(typesData, "No se pudieron cargar los tipos de evento."),
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
                  }))
                : undefined;
              return {
                id: String(t.id),
                name: String(t.name),
                isActive: Boolean(t.isActive),
                createdAt: typeof t.createdAt === "string" ? t.createdAt : undefined,
                updatedAt: typeof t.updatedAt === "string" ? t.updatedAt : undefined,
                occasionAssignments,
              };
            })
          : [],
      );

      const eventsData = await eventsResponse.json().catch(() => []);
      if (eventsResponse.ok && Array.isArray(eventsData)) {
        const counts: Record<string, number> = {};
        for (const row of eventsData as AdminEventRow[]) {
          const tid = row.eventTypeId;
          if (tid) counts[tid] = (counts[tid] ?? 0) + 1;
        }
        setEventCountByTypeId(counts);
      } else {
        setEventCountByTypeId({});
      }
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

  useEffect(() => {
    if (!editingId && !isNameValid) setOccasionPickerOpen(false);
  }, [editingId, isNameValid]);

  const editingRow = editingId ? types.find((item) => item.id === editingId) : undefined;
  const originalName = editingRow?.name.trim() ?? "";
  const nameChanged = !editingId || trimmedName !== originalName;
  const packedNow = packOccasionAssignments(singleIds, projectIds, roleIds);
  const originalPacked = editingRow?.occasionAssignments ?? [];
  const assignmentsChanged =
    !editingId ||
    occasionAssignmentsOrderedSignature(packedNow) !== occasionAssignmentsOrderedSignature(originalPacked);
  const hasChanges = editingId ? nameChanged || assignmentsChanged : trimmedName.length > 0;
  const canSubmit = !isSubmitting && isNameValid && hasChanges;

  const getNameValidationError = () => {
    if (!trimmedName) return "Debes ingresar un nombre para el tipo de evento.";
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
        ? `${apiBaseUrl}/api/v1/events/types/admin/${editingId}`
        : `${apiBaseUrl}/api/v1/events/types/admin`;
      const method = editingId ? "PATCH" : "POST";
      const occasions = packOccasionAssignments(singleIds, projectIds, roleIds);
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
          description: parseErrorMessage(data, "No se pudo guardar el tipo de evento."),
        });
        return;
      }

      toast({
        title: editingId ? "Tipo actualizado" : "Tipo creado",
        description: editingId
          ? "Los cambios del tipo se guardaron correctamente."
          : "El nuevo tipo de evento se creó correctamente.",
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

  const startEdit = (item: EventTypeItem) => {
    setOccasionPickerOpen(false);
    setEditingId(item.id);
    setName(item.name);
    const a = item.occasionAssignments ?? [];
    const sortWithin = (u: OccasionUsage) =>
      a
        .filter((x) => x.usage === u)
        .sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0))
        .map((x) => x.occasionTypeId);
    setSingleIds(sortWithin("OCCASION_SINGLE"));
    setProjectIds(sortWithin("BESPOKE_PROJECT"));
    setRoleIds(sortWithin("BESPOKE_ROLE"));
    setIsModalOpen(true);
    setMenuOpenId(null);
  };

  const onToggleActive = async (item: EventTypeItem) => {
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
          description: parseErrorMessage(data, "No se pudo actualizar el estado del tipo de evento."),
        });
        return;
      }

      if (editingId === item.id && !item.isActive) {
        resetForm();
      }

      toast({
        title: item.isActive ? "Tipo desactivado" : "Tipo activado",
        description: item.isActive
          ? "El tipo de evento fue desactivado correctamente."
          : "El tipo de evento fue activado correctamente.",
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

  const filteredTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = types.filter((item) => item.name.toLowerCase().includes(q));
    if (filterTab === "active") list = list.filter((t) => t.isActive);
    if (filterTab === "inactive") list = list.filter((t) => !t.isActive);
    return list;
  }, [types, searchQuery, filterTab]);

  const sortedActiveOccasions = useMemo(
    () =>
      [...occasionCatalog]
        .filter((o) => o.isActive)
        .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    [occasionCatalog],
  );

  const occasionNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of occasionCatalog) m.set(o.id, o.name);
    return m;
  }, [occasionCatalog]);

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
        title="Tipos de eventos"
        subtitle="Categorías que organizan tus experiencias en vivo."
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
            className="rounded-xl border border-gold/15 bg-black/25 px-4 py-3 shadow-[inset_0_1px_0_rgba(197,165,90,0.06)]"
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
          placeholder="Buscar tipo de evento..."
          className="mx-0 min-h-12 max-w-none flex-1 rounded-xl border-gold/18 bg-black/22"
        />
        <div className="flex flex-wrap gap-2 lg:shrink-0">
          {filterPill("all", "Todos")}
          {filterPill("active", "Activos")}
          {filterPill("inactive", "Inactivos")}
        </div>
      </div>

      <section className="rounded-xl border border-gold/12 bg-black/15 p-5 md:p-7">
        {isLoading ? (
          <p className="py-16 text-center font-body text-sm text-foreground/65">Cargando...</p>
        ) : filteredTypes.length === 0 ? (
          types.length === 0 ? (
            <AdminCatalogEmptyState
              title="Aún no hay tipos de eventos"
              description="Las categorías organizan tus experiencias y enlazan las ocasiones que verá el cliente en el contacto."
              tone="primary"
              action={{ label: "Crear tipo de evento", onClick: openCreateModal }}
            />
          ) : (
            <AdminCatalogEmptyState
              title="Nada coincide con tu búsqueda"
              description="Prueba otras palabras o cambia el filtro entre Todos, Activos e Inactivos."
              tone="muted"
            />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTypes.map((item) => {
            const Icon = iconForTypeName(item.name);
            const nEvents = eventCountByTypeId[item.id] ?? 0;
            const eventLabel = nEvents === 1 ? "1 evento" : `${nEvents} eventos`;
            return (
              <article
                key={item.id}
                className="relative flex flex-col rounded-2xl border border-gold/16 bg-black/28 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
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
                        className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-lg border border-gold/20 bg-[#0c0c0c] py-1 shadow-xl"
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
                      Eventos y propuestas agrupados bajo esta categoría.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gold/12 pt-4 font-body text-[11px] text-foreground/45">
                  <span>{eventLabel}</span>
                  <span className="text-gold/25">·</span>
                  <span>{formatRelativeEs(item.updatedAt ?? item.createdAt)}</span>
                  <div className="ml-auto flex items-center gap-2">
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
                          : "border-foreground/22 bg-black/45",
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
                </div>
              </article>
            );
          })}
          </div>
        )}
      </section>

      <AdminModal
        title={editingId ? "Editar tipo de evento" : "Nuevo tipo de evento"}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form id="event-type-form" noValidate onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">NOMBRE DEL TIPO</span>
            <input
              type="text"
              value={name}
              required
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-gold/30 bg-black/35 px-4 text-base text-foreground outline-none focus:border-gold"
              placeholder="Ej. Bodas privadas"
            />
          </label>

          {editingId || isNameValid ? (
            <div className="rounded-xl border border-gold/18 bg-black/22 p-4">
              <p className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TIPOS DE OCASIÓN (FORMULARIO)</p>
              {sortedActiveOccasions.length === 0 ? (
                <div className="mt-5 flex flex-col items-center justify-center gap-5 rounded-xl border border-gold/14 bg-linear-to-b from-black/35 to-black/20 px-6 py-12 text-center">
                  <p className="font-brand text-xl tracking-[0.06em] text-gold sm:text-2xl">No hay ocasiones creadas</p>
                  <p className="max-w-sm font-body text-base leading-relaxed text-foreground/55">
                    Crea tipos de ocasión en el catálogo para poder vincularlos aquí y mostrarlos en el contacto público.
                  </p>
                  <Link
                    href="/shamell-admin/occasion-types"
                    className="inline-flex items-center justify-center rounded-xl border border-gold/45 bg-gold/12 px-8 py-3.5 font-brand text-[11px] tracking-[0.18em] text-gold shadow-sm transition hover:border-gold/70 hover:bg-gold/20"
                  >
                    Ir a Tipos de ocasión
                  </Link>
                </div>
              ) : editingId ? (
                <div className="mt-4 space-y-5">
                  <p className="font-body text-sm leading-relaxed text-foreground/55">
                    Elige las que aplican a esta categoría. Con varias opciones en un grupo, usa las flechas para el orden en el
                    formulario de contacto.
                  </p>
                  <div>
                    <p className="font-brand text-[9px] tracking-widest text-gold/65">UNA OPCIÓN (GALA / VIP)</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {sortedActiveOccasions.map((o) => (
                        <label key={`s-${o.id}`} className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
                          <input
                            type="checkbox"
                            checked={singleIds.includes(o.id)}
                            onChange={() => toggleOccasion(o.id, singleIds, setSingleIds)}
                            className="h-4 w-4 rounded border-gold/35 text-gold"
                          />
                          {o.name}
                        </label>
                      ))}
                    </div>
                    {singleIds.length > 1 ? (
                      <div className="mt-3 rounded-lg border border-gold/12 bg-black/35 px-3 py-2">
                        <p className="font-brand text-[9px] tracking-[0.14em] text-gold/55">
                          ORDEN EN CONTACTO (ARRIBA → SE MUESTRA PRIMERO)
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {singleIds.map((id, idx) => (
                            <li
                              key={id}
                              className="flex items-center justify-between gap-2 rounded-md border border-gold/10 bg-black/25 px-2 py-1.5"
                            >
                              <span className="min-w-0 truncate text-xs text-foreground/85">
                                {occasionNameById.get(id) ?? id}
                              </span>
                              <span className="flex shrink-0 gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  aria-label="Subir"
                                  onClick={() => setSingleIds(swapAdjacentInList(singleIds, idx, -1))}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-gold/25 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === singleIds.length - 1}
                                  aria-label="Bajar"
                                  onClick={() => setSingleIds(swapAdjacentInList(singleIds, idx, 1))}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-gold/25 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <p className="font-brand text-[9px] tracking-widest text-gold/65">PROYECTOS BESPOKE (VARIAS)</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {sortedActiveOccasions.map((o) => (
                        <label key={`p-${o.id}`} className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
                          <input
                            type="checkbox"
                            checked={projectIds.includes(o.id)}
                            onChange={() => toggleOccasion(o.id, projectIds, setProjectIds)}
                            className="h-4 w-4 rounded border-gold/35 text-gold"
                          />
                          {o.name}
                        </label>
                      ))}
                    </div>
                    {projectIds.length > 1 ? (
                      <div className="mt-3 rounded-lg border border-gold/12 bg-black/35 px-3 py-2">
                        <p className="font-brand text-[9px] tracking-[0.14em] text-gold/55">
                          ORDEN EN CONTACTO (ARRIBA → SE MUESTRA PRIMERO)
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {projectIds.map((id, idx) => (
                            <li
                              key={id}
                              className="flex items-center justify-between gap-2 rounded-md border border-gold/10 bg-black/25 px-2 py-1.5"
                            >
                              <span className="min-w-0 truncate text-xs text-foreground/85">
                                {occasionNameById.get(id) ?? id}
                              </span>
                              <span className="flex shrink-0 gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  aria-label="Subir"
                                  onClick={() => setProjectIds(swapAdjacentInList(projectIds, idx, -1))}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-gold/25 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === projectIds.length - 1}
                                  aria-label="Bajar"
                                  onClick={() => setProjectIds(swapAdjacentInList(projectIds, idx, 1))}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-gold/25 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <p className="font-brand text-[9px] tracking-widest text-gold/65">ROLES / COLABORACIÓN (VARIAS)</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {sortedActiveOccasions.map((o) => (
                        <label key={`r-${o.id}`} className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
                          <input
                            type="checkbox"
                            checked={roleIds.includes(o.id)}
                            onChange={() => toggleOccasion(o.id, roleIds, setRoleIds)}
                            className="h-4 w-4 rounded border-gold/35 text-gold"
                          />
                          {o.name}
                        </label>
                      ))}
                    </div>
                    {roleIds.length > 1 ? (
                      <div className="mt-3 rounded-lg border border-gold/12 bg-black/35 px-3 py-2">
                        <p className="font-brand text-[9px] tracking-[0.14em] text-gold/55">
                          ORDEN EN CONTACTO (ARRIBA → SE MUESTRA PRIMERO)
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {roleIds.map((id, idx) => (
                            <li
                              key={id}
                              className="flex items-center justify-between gap-2 rounded-md border border-gold/10 bg-black/25 px-2 py-1.5"
                            >
                              <span className="min-w-0 truncate text-xs text-foreground/85">
                                {occasionNameById.get(id) ?? id}
                              </span>
                              <span className="flex shrink-0 gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  aria-label="Subir"
                                  onClick={() => setRoleIds(swapAdjacentInList(roleIds, idx, -1))}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-gold/25 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === roleIds.length - 1}
                                  aria-label="Bajar"
                                  onClick={() => setRoleIds(swapAdjacentInList(roleIds, idx, 1))}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-gold/25 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="font-body text-sm leading-relaxed text-foreground/55">
                    Elige una o más ocasiones del catálogo para el formulario de contacto (Gala/VIP). El orden en la lista del
                    contacto lo ajustas con las flechas si marcas varias.
                  </p>
                  <div ref={occasionPickerRef} className="relative">
                    <button
                      type="button"
                      aria-expanded={occasionPickerOpen}
                      aria-haspopup="listbox"
                      onClick={() => setOccasionPickerOpen((open) => !open)}
                      className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-gold/30 bg-black/35 px-4 text-left text-sm text-foreground outline-none transition hover:border-gold/45 focus-visible:border-gold"
                    >
                      <span className={cn("min-w-0 truncate", singleIds.length ? "text-foreground" : "text-foreground/45")}>
                        {singleIds.length === 0
                          ? "Elegir tipos de ocasión…"
                          : singleIds.map((id) => occasionNameById.get(id) ?? id).join(" · ")}
                      </span>
                      <ChevronDown
                        className={cn("h-4 w-4 shrink-0 text-gold/80 transition", occasionPickerOpen && "rotate-180")}
                        strokeWidth={1.5}
                      />
                    </button>
                    {occasionPickerOpen ? (
                      <div
                        role="listbox"
                        className="shamell-scrollbar absolute left-0 right-0 top-full z-40 mt-2 max-h-56 overflow-y-auto rounded-xl border border-gold/30 bg-[#0b0f14] p-2 shadow-[0_16px_36px_rgba(0,0,0,0.55)]"
                      >
                        {sortedActiveOccasions.map((o) => (
                          <label
                            key={o.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground/85 transition hover:bg-gold/10"
                          >
                            <input
                              type="checkbox"
                              checked={singleIds.includes(o.id)}
                              onChange={() => toggleOccasion(o.id, singleIds, setSingleIds)}
                              className="h-4 w-4 shrink-0 rounded border-gold/35 text-gold"
                            />
                            {o.name}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {singleIds.length > 1 ? (
                    <div className="rounded-lg border border-gold/12 bg-black/35 px-3 py-2">
                      <p className="font-brand text-[9px] tracking-[0.14em] text-gold/55">
                        ORDEN EN CONTACTO (ARRIBA → SE MUESTRA PRIMERO)
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {singleIds.map((id, idx) => (
                          <li
                            key={id}
                            className="flex items-center justify-between gap-2 rounded-md border border-gold/10 bg-black/25 px-2 py-1.5"
                          >
                            <span className="min-w-0 truncate text-xs text-foreground/85">
                              {occasionNameById.get(id) ?? id}
                            </span>
                            <span className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                aria-label="Subir"
                                onClick={() => setSingleIds(swapAdjacentInList(singleIds, idx, -1))}
                                className="inline-flex h-7 w-7 items-center justify-center rounded border border-gold/25 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === singleIds.length - 1}
                                aria-label="Bajar"
                                onClick={() => setSingleIds(swapAdjacentInList(singleIds, idx, 1))}
                                className="inline-flex h-7 w-7 items-center justify-center rounded border border-gold/25 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

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
