"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutGrid,
  Pencil,
  Table2,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AdminEventType = { id: string; name: string; isActive: boolean };

type AdminEvent = {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  description: string;
  items: string[];
  isActive: boolean;
  showOnHome: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 5000;
const ITEM_MAX_LENGTH = 180;
const PAGE_SIZE = 6;

const TYPE_PILL_STYLES = [
  "border-gold/50 bg-gold/12 text-gold-light",
  "border-rose-400/45 bg-rose-500/12 text-rose-100",
  "border-sky-400/40 bg-sky-500/12 text-sky-100",
  "border-amber-400/40 bg-amber-500/12 text-amber-100",
  "border-teal-400/40 bg-teal-500/12 text-teal-100",
];

function pillClassForTypeName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return TYPE_PILL_STYLES[Math.abs(h) % TYPE_PILL_STYLES.length];
}

function displayEventHeading(description: string): { title: string; subtitle: string } {
  const t = description.trim();
  if (!t) return { title: "Sin descripción", subtitle: "" };
  const firstBlock = t.split(/\n/)[0]?.trim() ?? t;
  const title = firstBlock.length > 64 ? `${firstBlock.slice(0, 62).trim()}…` : firstBlock;
  let subtitle = "";
  if (t.includes("\n")) {
    subtitle = t
      .split(/\n/)
      .slice(1)
      .join(" ")
      .trim()
      .slice(0, 140);
  } else if (t.length > title.length) {
    subtitle = t.slice(title.length).trim().replace(/^\.+\s*/, "").slice(0, 140);
  }
  if (subtitle.length > 130) subtitle = `${subtitle.slice(0, 128)}…`;
  return { title, subtitle };
}

function formatShortDateEs(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es", { day: "numeric", month: "short" }).replace(".", "");
}

type FilterTab = "all" | "upcoming" | "completed";
type ViewMode = "table" | "calendar";

export default function ShamellAdminEventsPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001", []);

  const [eventTypeId, setEventTypeId] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);
  const [viewEvent, setViewEvent] = useState<AdminEvent | null>(null);

  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [originalSnapshot, setOriginalSnapshot] = useState<{
    eventTypeId: string;
    description: string;
    itemsText: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<AdminEventType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const resetForm = useCallback(() => {
    setEventTypeId((current) => current || eventTypes.find((item) => item.isActive)?.id || "");
    setDescription("");
    setItemsText("");
    setEditingId(null);
    setOriginalSnapshot(null);
  }, [eventTypes]);

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsTypeDropdownOpen(false);
    resetForm();
  };

  const loadAllData = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setEvents([]);
      setEventTypes([]);
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
          description: parseErrorMessage(typesData, "No se pudo cargar la lista de tipos de evento."),
        });
        return;
      }

      const normalizedTypes = Array.isArray(typesData)
        ? (typesData as Record<string, unknown>[]).map((t) => ({
            id: String(t.id),
            name: String(t.name),
            isActive: Boolean(t.isActive),
          }))
        : [];
      setEventTypes(normalizedTypes);
      if (normalizedTypes.length > 0 && !eventTypeId) {
        const firstActive = normalizedTypes.find((item) => item.isActive);
        setEventTypeId(firstActive?.id ?? normalizedTypes[0].id);
      }

      const eventsData = await eventsResponse.json().catch(() => []);
      if (!eventsResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(eventsData, "No se pudo cargar la lista de eventos."),
        });
        return;
      }
      setEvents(
        Array.isArray(eventsData)
          ? (eventsData as Record<string, unknown>[]).map((ev) => ({
              id: String(ev.id),
              eventTypeId: String(ev.eventTypeId),
              eventTypeName: String(ev.eventTypeName ?? ""),
              description: String(ev.description ?? ""),
              items: Array.isArray(ev.items) ? (ev.items as string[]) : [],
              isActive: Boolean(ev.isActive),
              showOnHome: ev.showOnHome !== undefined ? Boolean(ev.showOnHome) : true,
              createdAt: typeof ev.createdAt === "string" ? ev.createdAt : undefined,
              updatedAt: typeof ev.updatedAt === "string" ? ev.updatedAt : undefined,
            }))
          : [],
      );
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexión",
        description: "No se pudo conectar con el backend.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, eventTypeId, parseErrorMessage]);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const normalizedItems = itemsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const trimmedDescription = description.trim();
  const hasValidDescriptionLength =
    trimmedDescription.length >= DESCRIPTION_MIN_LENGTH &&
    trimmedDescription.length <= DESCRIPTION_MAX_LENGTH;
  const hasValidItems = normalizedItems.length > 0 && normalizedItems.every((item) => item.length <= ITEM_MAX_LENGTH);
  const hasValidType = Boolean(eventTypeId);

  const hasChanges = editingId
    ? Boolean(
        originalSnapshot &&
          (eventTypeId !== originalSnapshot.eventTypeId ||
            trimmedDescription !== originalSnapshot.description ||
            normalizedItems.join("\n") !== originalSnapshot.itemsText),
      )
    : Boolean(eventTypeId || trimmedDescription || normalizedItems.length);

  const canSubmit = !isSubmitting && hasValidType && hasValidDescriptionLength && hasValidItems && hasChanges;

  const getValidationError = () => {
    if (!hasValidType) return "Debes seleccionar un tipo de evento.";
    if (!hasValidDescriptionLength) {
      return `La descripción debe tener entre ${DESCRIPTION_MIN_LENGTH} y ${DESCRIPTION_MAX_LENGTH} caracteres.`;
    }
    if (!hasValidItems) return "Debes agregar al menos 1 ítem. Cada ítem máximo 180 caracteres.";
    if (!hasChanges) return "No hay cambios para guardar.";
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sesión requerida",
        description: "Debes iniciar sesión como admin para gestionar eventos.",
      });
      return;
    }

    const validationError = getValidationError();
    if (validationError) {
      toast({ variant: "destructive", title: "Revisa el formulario", description: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingId
        ? `${apiBaseUrl}/api/v1/events/admin/${editingId}`
        : `${apiBaseUrl}/api/v1/events/admin`;
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId,
          description: trimmedDescription,
          items: normalizedItems,
          showOnHome: true,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudo guardar el evento."),
        });
        return;
      }

      const wasEditing = Boolean(editingId);
      closeModal();
      toast({
        title: wasEditing ? "Evento actualizado" : "Evento creado",
        description: wasEditing
          ? "Los cambios del evento se guardaron correctamente."
          : "El nuevo evento se creó correctamente.",
      });
      await loadAllData();
    } catch {
      toast({ variant: "destructive", title: "Sin conexión", description: "No se pudo conectar con el backend." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: AdminEvent) => {
    setEditingId(item.id);
    setEventTypeId(item.eventTypeId);
    setDescription(item.description);
    const itemsJoined = item.items.join("\n");
    setItemsText(itemsJoined);
    setOriginalSnapshot({
      eventTypeId: item.eventTypeId,
      description: item.description.trim(),
      itemsText: itemsJoined,
    });
    setIsModalOpen(true);
  };

  const onDisable = async (eventId: string) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sesión requerida",
        description: "Debes iniciar sesión como admin.",
      });
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/events/admin/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudo desactivar el evento."),
        });
        return;
      }
      toast({ title: "Evento desactivado", description: "El evento fue desactivado correctamente." });
      await loadAllData();
    } catch {
      toast({ variant: "destructive", title: "Sin conexión", description: "No se pudo conectar con el backend." });
    }
  };

  const searchedEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter((item) => {
      const searchable = [
        item.eventTypeName,
        item.description,
        ...item.items,
        item.isActive ? "activo" : "inactivo",
        "próximo",
        "proximo",
        "completado",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [events, searchQuery]);

  const tabCounts = useMemo(() => {
    const all = searchedEvents.length;
    const upcoming = searchedEvents.filter((e) => e.isActive).length;
    return { all, upcoming, completed: all - upcoming };
  }, [searchedEvents]);

  const filteredEvents = useMemo(() => {
    let list = searchedEvents;
    if (filterTab === "upcoming") list = list.filter((e) => e.isActive);
    if (filterTab === "completed") list = list.filter((e) => !e.isActive);
    return list;
  }, [searchedEvents, filterTab]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTab]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageOffset = (safePage - 1) * PAGE_SIZE;
  const paginatedEvents = filteredEvents.slice(pageOffset, pageOffset + PAGE_SIZE);

  const stats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((e) => e.isActive).length;
    const itemsTotal = events.reduce((acc, e) => acc + e.items.length, 0);
    const activeWithDates = events.filter((e) => e.isActive);
    let nearestLabel = "—";
    if (activeWithDates.length > 0) {
      const sorted = [...activeWithDates].sort((a, b) => {
        const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      nearestLabel = formatShortDateEs(sorted[0]?.updatedAt ?? sorted[0]?.createdAt);
    }
    return { total, upcoming, completed: total - upcoming, itemsTotal, nearestLabel };
  }, [events]);

  const calendarMonthLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("es", { month: "long", year: "numeric" });
  }, []);

  const calendarCells = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const startMonday = (firstDow + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: { day: number | null; events: AdminEvent[] }[] = [];
    for (let i = 0; i < startMonday; i++) cells.push({ day: null, events: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const onDay = filteredEvents.filter((ev) => {
        const iso = ev.updatedAt ?? ev.createdAt;
        if (!iso) return false;
        const dt = new Date(iso);
        return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
      });
      cells.push({ day: d, events: onDay });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, events: [] });
    return cells;
  }, [filteredEvents]);

  const activeEventTypes = eventTypes.filter((item) => item.isActive);
  const selectedTypeName = activeEventTypes.find((item) => item.id === eventTypeId)?.name;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Eventos"
        subtitle="Calendario y gestión de presentaciones."
        actionLabel="Nuevo evento"
        onAction={openCreateModal}
        bordered={false}
      />

      {eventTypes.filter((item) => item.isActive).length === 0 ? (
        <section className="mb-8 rounded-xl border border-gold/12 bg-black/15 p-5 md:p-7">
          <AdminCatalogEmptyState
            title="No hay tipos de evento activos"
            description="Crea o activa categorías en Tipos de eventos antes de registrar presentaciones aquí."
            tone="primary"
            icon={Tags}
            action={{ label: "Ir a Tipos de eventos", href: "/shamell-admin/event-types" }}
          />
        </section>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["TOTAL EVENTOS", String(stats.total)],
            ["PRÓXIMOS", String(stats.upcoming)],
            ["ITEMS TOTALES", String(stats.itemsTotal)],
            ["MÁS CERCANO", stats.nearestLabel],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-gold/15 bg-black/25 px-4 py-3 shadow-[inset_0_1px_0_rgba(197,165,90,0.06)]"
          >
            <p className="font-brand text-[10px] tracking-[0.16em] text-gold/75">{label}</p>
            <p className="mt-1 truncate font-brand text-lg tracking-wide text-gold md:text-xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-4">
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar evento..."
          className="mx-0 min-h-12 max-w-none flex-1 rounded-xl border-gold/18 bg-black/22"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:shrink-0">
          <div className="flex flex-wrap rounded-xl border border-gold/18 bg-black/22 p-1">
            {(
              [
                ["all", "Todos", tabCounts.all],
                ["upcoming", "Próximos", tabCounts.upcoming],
                ["completed", "Completados", tabCounts.completed],
              ] as const
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilterTab(id)}
                className={cn(
                  "rounded-lg px-3 py-2.5 font-brand text-[10px] tracking-[0.12em] transition sm:px-4",
                  filterTab === id
                    ? "bg-gold/12 text-gold shadow-inner"
                    : "text-foreground/50 hover:text-foreground/80",
                )}
              >
                {label} <span className="text-gold/45">·</span> {count}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl border border-gold/18 bg-black/22 p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-brand text-[10px] tracking-[0.12em] transition sm:flex-none",
                viewMode === "table"
                  ? "border border-gold/40 bg-gold/10 text-gold"
                  : "border border-transparent text-foreground/50 hover:text-foreground/75",
              )}
            >
              <Table2 className="h-4 w-4" strokeWidth={1.5} />
              Tabla
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-brand text-[10px] tracking-[0.12em] transition sm:flex-none",
                viewMode === "calendar"
                  ? "border border-gold/40 bg-gold/10 text-gold"
                  : "border border-transparent text-foreground/50 hover:text-foreground/75",
              )}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
              Calendario
            </button>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-gold/12 bg-black/15 p-4 md:p-5">
        {viewMode === "table" ? (
          <>
            <div className="overflow-x-auto rounded-xl border border-gold/14">
              <table className="w-full min-w-[960px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gold/12 bg-black/40">
                    <th className="w-14 px-2 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/70" />
                    <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">EVENTO</th>
                    <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">TIPO</th>
                    <th className="w-16 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">ITEMS</th>
                    <th className="min-w-36 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">FECHA</th>
                    <th className="min-w-32 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">CLIENTE</th>
                    <th className="w-32 px-3 py-3 text-right font-brand text-[10px] tracking-[0.14em] text-gold/80">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEvents.map((item) => {
                    const { title, subtitle } = displayEventHeading(item.description);
                    const dateIso = item.updatedAt ?? item.createdAt;
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          "border-b border-gold/8 bg-black/15 transition hover:bg-gold/5",
                          !item.isActive && "opacity-55",
                        )}
                      >
                        <td className="px-2 py-3 align-middle">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/22 bg-gold/10">
                            <Calendar className="h-4 w-4 text-gold/85" strokeWidth={1.4} />
                          </div>
                        </td>
                        <td className="max-w-56 px-3 py-3 align-middle md:max-w-72">
                          <p className="font-brand text-sm tracking-[0.04em] text-gold">{title}</p>
                          {subtitle ? (
                            <p className="mt-0.5 font-body text-xs leading-snug text-foreground/45">{subtitle}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-1 font-body text-[11px]",
                              pillClassForTypeName(item.eventTypeName),
                            )}
                          >
                            {item.eventTypeName}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle font-body text-sm text-foreground/75">
                          {item.items.length}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <div className="flex items-center gap-2 font-body text-xs text-foreground/65">
                            {!item.isActive ? (
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" strokeWidth={2} />
                            ) : (
                              <Calendar className="h-3.5 w-3.5 shrink-0 text-gold/60" strokeWidth={1.5} />
                            )}
                            <span>{formatShortDateEs(dateIso)}</span>
                          </div>
                          <p className="mt-0.5 font-body text-[10px] text-foreground/35">Última gestión</p>
                        </td>
                        <td className="px-3 py-3 align-middle font-body text-xs text-foreground/45">Sin asignar</td>
                        <td className="px-3 py-3 align-middle">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewEvent(item)}
                              className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
                              aria-label="Ver evento"
                            >
                              <Eye className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
                              aria-label="Editar evento"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDisable(item.id)}
                              className="rounded-lg border border-red-400/25 p-2 text-foreground/55 transition hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300"
                              aria-label="Desactivar evento"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border-b border-gold/8 p-0 align-middle">
                        {events.length === 0 ? (
                          <AdminCatalogEmptyState
                            title="Aún no hay eventos"
                            description="Registra una presentación con tipo, descripción y detalle para el equipo."
                            tone="primary"
                            variant="embedded"
                            icon={Calendar}
                            action={{ label: "Nuevo evento", onClick: openCreateModal }}
                          />
                        ) : (
                          <AdminCatalogEmptyState
                            title="Nada coincide con tu búsqueda"
                            description="Prueba otras palabras o cambia la pestaña de filtro (Todos, Próximos, Completados)."
                            tone="muted"
                            variant="embedded"
                            icon={Calendar}
                          />
                        )}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-gold/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-body text-xs text-foreground/50">
                {filteredEvents.length === 0
                  ? "Mostrando 0 de 0"
                  : `Mostrando ${pageOffset + 1}-${pageOffset + paginatedEvents.length} de ${filteredEvents.length}`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gold/20 p-2 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={cn(
                      "min-w-9 rounded-lg border px-2.5 py-1.5 font-brand text-xs tracking-wide transition",
                      n === safePage
                        ? "border-gold/55 bg-gold/12 text-gold"
                        : "border-transparent text-foreground/50 hover:border-gold/25 hover:text-gold",
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gold/20 p-2 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div>
            <p className="mb-1 font-brand text-sm capitalize tracking-[0.08em] text-gold">{calendarMonthLabel}</p>
            <p className="mb-4 font-body text-xs text-foreground/50">
              Las celdas usan la fecha de última actualización del registro. Cuando agregues fecha de presentación al
              modelo, aquí se mostrará el calendario real.
            </p>
            <div className="grid grid-cols-7 gap-1.5 text-center font-brand text-[10px] tracking-[0.14em] text-gold/60">
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "min-h-18 rounded-lg border border-gold/12 bg-black/25 p-1.5 text-left",
                    !cell.day && "border-transparent bg-transparent",
                  )}
                >
                  {cell.day ? (
                    <>
                      <p className="font-brand text-xs text-gold/80">{cell.day}</p>
                      <div className="mt-1 space-y-0.5">
                        {cell.events.slice(0, 2).map((ev) => {
                          const t = displayEventHeading(ev.description).title;
                          return (
                            <p
                              key={ev.id}
                              className={cn(
                                "truncate rounded border border-gold/10 bg-gold/5 px-1 py-0.5 font-body text-[9px] text-foreground/70",
                                !ev.isActive && "opacity-50",
                              )}
                              title={t}
                            >
                              {t.slice(0, 18)}
                              {t.length > 18 ? "…" : ""}
                            </p>
                          );
                        })}
                        {cell.events.length > 2 ? (
                          <p className="text-[9px] text-gold/60">+{cell.events.length - 2}</p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading ? <p className="mt-4 text-sm text-foreground/65">Cargando...</p> : null}
      </section>

      <AdminModal title={editingId ? "Editar evento" : "Nuevo evento"} isOpen={isModalOpen} onClose={closeModal}>
        <form id="event-form" noValidate onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TIPO DE EVENTO</span>
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => {
                  if (activeEventTypes.length === 0) return;
                  setIsTypeDropdownOpen((prev) => !prev);
                }}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-gold/30 bg-black/35 px-4 text-sm text-foreground transition hover:border-gold/55"
              >
                <span className={selectedTypeName ? "text-foreground" : "text-foreground/55"}>
                  {selectedTypeName ?? "Primero crea un tipo de evento"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gold/80 transition ${isTypeDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isTypeDropdownOpen && activeEventTypes.length > 0 ? (
                <div className="shamell-scrollbar absolute left-0 top-14 z-40 max-h-56 w-full overflow-y-auto rounded-xl border border-gold/35 bg-[#0b0f14] p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
                  {activeEventTypes.map((item) => {
                    const isSelected = eventTypeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setEventTypeId(item.id);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`mb-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition last:mb-0 ${
                          isSelected
                            ? "border border-gold/35 bg-gold/15 text-gold"
                            : "border border-transparent text-foreground/80 hover:border-gold/20 hover:bg-gold/10 hover:text-gold-light"
                        }`}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">DESCRIPCIÓN</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-gold/30 bg-black/35 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder="Describe el evento..."
            />
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">ÍTEMS (UNO POR LÍNEA)</span>
            <p className="mt-1 text-xs text-foreground/55 font-body">
              Lista de ejemplos que aparece en el sitio (bodas, yates, villas…). Una línea = un bullet en el
              catálogo público.
            </p>
            <textarea
              value={itemsText}
              onChange={(event) => setItemsText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gold/30 bg-black/35 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder={"Ítem 1\nÍtem 2\nÍtem 3"}
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
              {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </form>
      </AdminModal>

      {viewEvent ? (
        <div
          className="fixed inset-0 z-90 flex items-center justify-center bg-black/85 px-4 py-8"
          onClick={() => setViewEvent(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/25 bg-[#0c0c0c] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewEvent(null)}
              className="absolute right-3 top-3 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="font-brand text-[10px] tracking-[0.2em] text-gold/75">VISTA RÁPIDA</p>
            <h2 className="mt-2 font-brand text-xl text-gold">{displayEventHeading(viewEvent.description).title}</h2>
            <p className="mt-1 font-body text-xs text-foreground/45">{viewEvent.eventTypeName}</p>
            <p className="mt-4 font-body text-sm leading-relaxed text-foreground/70">{viewEvent.description}</p>
            <p className="mt-3 font-body text-xs text-foreground/45">
              {viewEvent.items.length} ítem(s) · {formatShortDateEs(viewEvent.updatedAt ?? viewEvent.createdAt)} ·{" "}
              {viewEvent.isActive ? "Próximo" : "Completado"} · Cliente: sin asignar
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
