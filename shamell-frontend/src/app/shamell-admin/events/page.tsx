"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";

type AdminEventType = { id: string; name: string; isActive: boolean };
type AdminEvent = {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  description: string;
  items: string[];
  isActive: boolean;
};

const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 5000;
const ITEM_MAX_LENGTH = 180;

export default function ShamellAdminEventsPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001", []);

  const [eventTypeId, setEventTypeId] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

      const normalizedTypes = Array.isArray(typesData) ? (typesData as AdminEventType[]) : [];
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
      setEvents(Array.isArray(eventsData) ? (eventsData as AdminEvent[]) : []);
    } catch {
      toast({ variant: "destructive", title: "Sin conexion", description: "No se pudo conectar con el backend." });
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, eventTypeId, parseErrorMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      return `La descripcion debe tener entre ${DESCRIPTION_MIN_LENGTH} y ${DESCRIPTION_MAX_LENGTH} caracteres.`;
    }
    if (!hasValidItems) return "Debes agregar al menos 1 item. Cada item maximo 180 caracteres.";
    if (!hasChanges) return "No hay cambios para guardar.";
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sesion requerida",
        description: "Debes iniciar sesion como admin para gestionar eventos.",
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
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ variant: "destructive", title: "Error", description: parseErrorMessage(data, "No se pudo guardar el evento.") });
        return;
      }

      const wasEditing = Boolean(editingId);
      closeModal();
      toast({
        title: wasEditing ? "Evento actualizado" : "Evento creado",
        description: wasEditing
          ? "Los cambios del evento se guardaron correctamente."
          : "El nuevo evento se creo correctamente.",
      });
      await loadAllData();
    } catch {
      toast({ variant: "destructive", title: "Sin conexion", description: "No se pudo conectar con el backend." });
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

  const onToggleActive = async (item: AdminEvent) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({ variant: "destructive", title: "Sesion requerida", description: "Debes iniciar sesion como admin." });
      return;
    }

    setTogglingId(item.id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/events/admin/${item.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudo actualizar el estado del evento."),
        });
        return;
      }

      toast({
        title: item.isActive ? "Evento desactivado" : "Evento activado",
        description: item.isActive
          ? "El evento fue desactivado correctamente."
          : "El evento fue activado correctamente.",
      });
      await loadAllData();
    } catch {
      toast({ variant: "destructive", title: "Sin conexion", description: "No se pudo conectar con el backend." });
    } finally {
      setTogglingId(null);
    }
  };

  const onDisable = async (eventId: string) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({ variant: "destructive", title: "Sesion requerida", description: "Debes iniciar sesion como admin." });
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/events/admin/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ variant: "destructive", title: "Error", description: parseErrorMessage(data, "No se pudo desactivar el evento.") });
        return;
      }
      toast({ title: "Evento desactivado", description: "El evento fue desactivado correctamente." });
      await loadAllData();
    } catch {
      toast({ variant: "destructive", title: "Sin conexion", description: "No se pudo conectar con el backend." });
    }
  };

  const filteredEvents = events.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const searchable = [
      item.eventTypeName,
      item.description,
      ...item.items,
      item.isActive ? "activo" : "inactivo",
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(q);
  });

  const activeEventTypes = eventTypes.filter((item) => item.isActive);
  const selectedTypeName = activeEventTypes.find((item) => item.id === eventTypeId)?.name;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero title="Eventos" actionLabel="Nuevo Evento" onAction={openCreateModal} bordered={false} />

      {eventTypes.filter((item) => item.isActive).length === 0 ? (
        <div className="mb-8 rounded-md border border-gold/30 bg-black/20 px-5 py-4 text-sm text-foreground/75">
          No hay tipos de evento activos.{" "}
          <Link href="/shamell-admin/event-types" className="text-gold underline underline-offset-2">
            Ir a Tipos de evento
          </Link>
          .
        </div>
      ) : null}

      <AdminSearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar evento..." className="mb-6" />

      <section className="rounded-md bg-black/20 p-3 md:p-4">
        <div className="max-h-[58vh] overflow-y-auto rounded-xl border border-gold/20">
          <table className="w-full min-w-[840px] border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0d1117]">
              <tr className="border-b border-gold/15 text-left">
                <th className="px-4 py-3 font-brand text-[11px] tracking-[0.12em] text-gold/80">EVENTO</th>
                <th className="px-4 py-3 font-brand text-[11px] tracking-[0.12em] text-gold/80">TIPO</th>
                <th className="px-4 py-3 font-brand text-[11px] tracking-[0.12em] text-gold/80">ITEMS</th>
                <th className="px-4 py-3 font-brand text-[11px] tracking-[0.12em] text-gold/80">ESTADO</th>
                <th className="px-4 py-3 font-brand text-[11px] tracking-[0.12em] text-gold/80">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((item) => (
                <tr key={item.id} className="border-b border-gold/10 bg-black/20">
                  <td className="px-4 py-3 text-sm text-foreground">{item.description.slice(0, 84)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-xs text-gold/90">
                      {item.eventTypeName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground/80">{item.items.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          item.isActive
                            ? "border border-emerald-300/40 bg-emerald-400/15 text-emerald-300"
                            : "border border-red-300/40 bg-red-400/15 text-red-300"
                        }`}
                      >
                        {item.isActive ? "Activo" : "Inactivo"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleActive(item)}
                        disabled={togglingId === item.id}
                        className={`relative h-7 w-12 rounded-full border transition ${
                          item.isActive
                            ? "border-emerald-400/50 bg-emerald-500/25"
                            : "border-foreground/25 bg-black/40"
                        } ${togglingId === item.id ? "cursor-not-allowed opacity-60" : ""}`}
                        aria-label={`${item.isActive ? "Desactivar" : "Activar"} evento`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                            item.isActive ? "left-6" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-full border border-gold/25 p-1.5 text-foreground/70 transition hover:bg-gold/10 hover:text-gold"
                        aria-label="Editar evento"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDisable(item.id)}
                        className="rounded-full border border-red-300/30 p-1.5 text-foreground/70 transition hover:bg-red-300/10 hover:text-red-300"
                        aria-label="Desactivar evento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-foreground/65">
                    No hay eventos para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <AdminModal title={editingId ? "Editar Evento" : "Nuevo Evento"} isOpen={isModalOpen} onClose={closeModal}>
        <form noValidate onSubmit={onSubmit} className="space-y-6">
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
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">DESCRIPCION</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-gold/30 bg-black/35 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder="Describe el evento..."
            />
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">ITEMS (UNO POR LINEA)</span>
            <textarea
              value={itemsText}
              onChange={(event) => setItemsText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gold/30 bg-black/35 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder={"Item 1\nItem 2\nItem 3"}
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
    </div>
  );
}
