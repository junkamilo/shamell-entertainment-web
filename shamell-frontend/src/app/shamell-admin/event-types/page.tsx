"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";

type EventTypeItem = {
  id: string;
  name: string;
  isActive: boolean;
};

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const NAME_REGEX = /^[A-Za-zÀ-ÿ\s&-]+$/;

export default function ShamellAdminEventTypesPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [types, setTypes] = useState<EventTypeItem[]>([]);
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
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/events/types/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudieron cargar los tipos de evento."),
        });
        return;
      }
      setTypes(Array.isArray(data) ? (data as EventTypeItem[]) : []);
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
    void loadTypes();
  }, [loadTypes]);

  const trimmedName = name.trim();
  const hasValidChars = NAME_REGEX.test(trimmedName);
  const hasValidLength = trimmedName.length >= NAME_MIN_LENGTH && trimmedName.length <= NAME_MAX_LENGTH;
  const isNameValid = hasValidChars && hasValidLength;
  const originalName = editingId ? (types.find((item) => item.id === editingId)?.name.trim() ?? "") : "";
  const hasChanges = editingId ? trimmedName !== originalName : trimmedName.length > 0;
  const canSubmit = !isSubmitting && isNameValid && hasChanges;

  const getValidationError = () => {
    if (!trimmedName) return "Debes ingresar un nombre para el tipo de evento.";
    if (!hasValidLength) return `El nombre debe tener entre ${NAME_MIN_LENGTH} y ${NAME_MAX_LENGTH} caracteres.`;
    if (!hasValidChars) return "Solo se permiten letras, espacios, guiones y '&'.";
    if (!hasChanges) return "No hay cambios para guardar.";
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({ variant: "destructive", title: "Sesion requerida", description: "Debes iniciar sesion como admin." });
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
        ? `${apiBaseUrl}/api/v1/events/types/admin/${editingId}`
        : `${apiBaseUrl}/api/v1/events/types/admin`;
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
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
          ? "Los cambios del tipo de evento se guardaron correctamente."
          : "El nuevo tipo de evento se creo correctamente.",
      });
      closeModal();
      await loadTypes();
    } catch {
      toast({ variant: "destructive", title: "Sin conexion", description: "No se pudo conectar con el backend." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: EventTypeItem) => {
    setEditingId(item.id);
    setName(item.name);
    setIsModalOpen(true);
  };

  const onToggleActive = async (item: EventTypeItem) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({ variant: "destructive", title: "Sesion requerida", description: "Debes iniciar sesion como admin." });
      return;
    }

    setTogglingId(item.id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/events/types/admin/${item.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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

      toast({
        title: item.isActive ? "Tipo desactivado" : "Tipo activado",
        description: item.isActive
          ? "El tipo de evento fue desactivado correctamente."
          : "El tipo de evento fue activado correctamente.",
      });
      await loadTypes();
    } catch {
      toast({ variant: "destructive", title: "Sin conexion", description: "No se pudo conectar con el backend." });
    } finally {
      setTogglingId(null);
    }
  };

  const filteredTypes = types.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero title="Tipos De Evento" actionLabel="Nuevo Tipo" onAction={openCreateModal} bordered={false} />

      <AdminSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar tipo de evento..."
        className="mb-8"
      />

      <section className="mt-8 rounded-md bg-black/20 p-6 md:p-7">
        {isLoading ? <p className="mt-4 text-sm text-foreground/70">Cargando...</p> : null}
        {!isLoading && filteredTypes.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/70">Aun no hay tipos de evento.</p>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredTypes.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-gold/20 bg-black/25">
              <div className="flex items-center justify-between bg-[#173233] px-4 py-3">
                <p className="font-brand text-[11px] tracking-[0.16em] text-gold/90">{item.name.toUpperCase()}</p>
                <span className="rounded-full border border-gold/20 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#0f2a2a]">
                  {item.isActive ? "ACTIVA" : "INACTIVA"}
                </span>
              </div>
              <div className="p-4">
                <p className="font-brand text-3xl leading-none text-gold/90">{item.name.charAt(0).toUpperCase()}</p>
                <p className="mt-2 text-sm text-foreground/75">{item.name}</p>
                <div className="mt-5 flex items-center gap-2 border-t border-gold/15 pt-3">
                  <span className="rounded-full border border-gold/15 bg-gold/10 px-2 py-0.5 text-[10px] text-gold/90">
                    Tipo de evento
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-full border border-gold/25 p-1.5 text-foreground/70 transition hover:bg-gold/10 hover:text-gold"
                      aria-label={`Editar ${item.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleActive(item)}
                      disabled={togglingId === item.id}
                      className={`relative h-7 w-12 rounded-full border transition ${
                        item.isActive
                          ? "border-emerald-400/50 bg-emerald-500/25"
                          : "border-foreground/25 bg-black/40"
                      } ${togglingId === item.id ? "cursor-not-allowed opacity-60" : ""}`}
                      aria-label={`${item.isActive ? "Desactivar" : "Activar"} ${item.name}`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                          item.isActive ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <AdminModal
        title={editingId ? "Editar Tipo de Evento" : "Nuevo Tipo de Evento"}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form noValidate onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">NOMBRE DEL TIPO</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-gold/30 bg-black/35 px-4 text-base text-foreground outline-none focus:border-gold"
              placeholder="Ej. Bodas privadas"
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
