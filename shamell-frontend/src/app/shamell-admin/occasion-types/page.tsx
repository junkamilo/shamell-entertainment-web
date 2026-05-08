"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import AdminCatalogEmptyState from "@/components/admin/AdminCatalogEmptyState";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type OccasionRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 120;
const NAME_REGEX = /^[A-Za-zÀ-ÿ0-9\s&,.()'¿?¡!/-]+$/;

type FilterTab = "all" | "active" | "inactive";

export default function ShamellAdminOccasionTypesPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001", []);

  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [rows, setRows] = useState<OccasionRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const loadRows = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setRows([]);
      toast({
        variant: "destructive",
        title: "Sesión requerida",
        description: "Debes iniciar sesión como admin.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/events/occasions/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudieron cargar los tipos de ocasión."),
        });
        return;
      }
      setRows(Array.isArray(data) ? (data as OccasionRow[]) : []);
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
    void loadRows();
  }, [loadRows]);

  const trimmedName = name.trim();
  const isNameValid =
    trimmedName.length >= NAME_MIN_LENGTH &&
    trimmedName.length <= NAME_MAX_LENGTH &&
    NAME_REGEX.test(trimmedName);
  const editingRow = editingId ? rows.find((r) => r.id === editingId) : undefined;
  const nameChanged = !editingId || trimmedName !== (editingRow?.name.trim() ?? "");
  const hasChanges = editingId ? nameChanged : trimmedName.length > 0;
  const canSubmit = !isSubmitting && isNameValid && hasChanges;

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
    if (!canSubmit) {
      toast({ variant: "destructive", title: "Revisa el formulario", description: "Nombre inválido o sin cambios." });
      return;
    }
    setIsSubmitting(true);
    try {
      const endpoint = editingId
        ? `${apiBaseUrl}/api/v1/events/occasions/admin/${editingId}`
        : `${apiBaseUrl}/api/v1/events/occasions/admin`;
      const method = editingId ? "PATCH" : "POST";
      const body = JSON.stringify({ name: trimmedName });
      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudo guardar."),
        });
        return;
      }
      toast({
        title: editingId ? "Actualizado" : "Creado",
        description: editingId ? "El tipo de ocasión se actualizó." : "Se creó el tipo de ocasión.",
      });
      setIsModalOpen(false);
      resetForm();
      await loadRows();
    } catch {
      toast({ variant: "destructive", title: "Sin conexión", description: "No se pudo conectar con el backend." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: OccasionRow) => {
    setEditingId(item.id);
    setName(item.name);
    setIsModalOpen(true);
  };

  const onToggleActive = async (item: OccasionRow) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) return;
    setTogglingId(item.id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/events/occasions/admin/${item.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudo actualizar."),
        });
        return;
      }
      toast({ title: item.isActive ? "Desactivado" : "Activado" });
      await loadRows();
    } catch {
      toast({ variant: "destructive", title: "Sin conexión" });
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = rows.filter((item) => item.name.toLowerCase().includes(q));
    if (filterTab === "active") list = list.filter((t) => t.isActive);
    if (filterTab === "inactive") list = list.filter((t) => !t.isActive);
    list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    return list;
  }, [rows, searchQuery, filterTab]);

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
        title="Tipos de ocasión"
        actionLabel="Nuevo tipo"
        onAction={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        bordered={false}
      />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar ocasión..."
          className="shamell-glass-surface mx-0 min-h-12 max-w-none flex-1 rounded-xl"
        />
        <div className="flex flex-wrap gap-2 lg:shrink-0">
          {filterPill("all", "Todos")}
          {filterPill("active", "Activos")}
          {filterPill("inactive", "Inactivos")}
        </div>
      </div>

      <section className="shamell-glass-surface rounded-xl p-5 md:p-7">
        {isLoading ? (
          <p className="py-16 text-center font-body text-sm text-foreground/65">Cargando...</p>
        ) : filtered.length === 0 ? (
          rows.length === 0 ? (
            <AdminCatalogEmptyState
              title="Aún no hay tipos de ocasión"
              description="Son las opciones que verán tus clientes según cada tipo de evento."
              tone="primary"
              action={{
                label: "Crear tipo de ocasión",
                onClick: () => {
                  resetForm();
                  setIsModalOpen(true);
                },
              }}
            />
          ) : (
            <AdminCatalogEmptyState
              title="Nada coincide con tu búsqueda"
              description="Prueba otras palabras en el buscador o cambia el filtro entre Todos, Activos e Inactivos."
              tone="muted"
            />
          )
        ) : (
          <div className="grid gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="shamell-glass-surface flex items-center gap-3 rounded-xl border border-gold/14 px-4 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
                  <Sparkles className="h-4 w-4 text-gold/90" strokeWidth={1.4} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-brand text-sm tracking-wide text-gold">{item.name}</p>
                  <p className="font-body text-[11px] text-foreground/45">
                    {item.isActive ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
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
              </div>
            ))}
          </div>
        )}
      </section>

      <AdminModal
        title={editingId ? "Editar tipo de ocasión" : "Nuevo tipo de ocasión"}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
      >
        <form noValidate onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">NOMBRE</span>
            <input
              type="text"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-base text-foreground outline-none focus:border-gold"
              placeholder="Ej. Cumpleaños de lujo"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : editingId ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
