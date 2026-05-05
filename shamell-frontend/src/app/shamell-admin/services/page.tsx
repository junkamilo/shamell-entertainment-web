"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AdminServiceType = {
  id: string;
  name: string;
  isActive: boolean;
};

type AdminService = {
  id: string;
  serviceTypeId: string;
  serviceTypeName: string;
  description: string;
  items: string[];
  imageUrl: string | null;
  isActive: boolean;
};

const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 5000;
const ITEM_MAX_LENGTH = 180;

const PAGE_SIZE = 6;

const TYPE_PILL_STYLES = [
  "border-rose-400/45 bg-rose-500/12 text-rose-100",
  "border-amber-400/40 bg-amber-500/12 text-amber-100",
  "border-teal-400/40 bg-teal-500/12 text-teal-100",
  "border-violet-400/35 bg-violet-500/12 text-violet-100",
];

function pillClassForTypeName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return TYPE_PILL_STYLES[Math.abs(h) % TYPE_PILL_STYLES.length];
}

function displayServiceHeading(description: string): { title: string; subtitle: string } {
  const t = description.trim();
  if (!t) return { title: "Sin descripción", subtitle: "" };
  const firstBlock = t.split(/\n/)[0]?.trim() ?? t;
  const title =
    firstBlock.length > 64 ? `${firstBlock.slice(0, 62).trim()}…` : firstBlock;
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

type FilterTab = "all" | "active" | "inactive";

export default function ShamellAdminServicesPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const [serviceTypeId, setServiceTypeId] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [typeFilterId, setTypeFilterId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [viewService, setViewService] = useState<AdminService | null>(null);

  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [originalSnapshot, setOriginalSnapshot] = useState<{
    serviceTypeId: string;
    description: string;
    itemsText: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState<AdminService[]>([]);
  const [serviceTypes, setServiceTypes] = useState<AdminServiceType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isPreviewLightboxOpen, setIsPreviewLightboxOpen] = useState(false);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const resetForm = useCallback(() => {
    setServiceTypeId((current) => current || serviceTypes.find((item) => item.isActive)?.id || "");
    setDescription("");
    setItemsText("");
    setImage(null);
    setExistingImageUrl(null);
    setEditingId(null);
    setOriginalSnapshot(null);
  }, [serviceTypes]);

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsTypeDropdownOpen(false);
    setIsPreviewLightboxOpen(false);
    resetForm();
  };

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const loadAllData = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setServices([]);
      setServiceTypes([]);
      toast({
        variant: "destructive",
        title: "Sesion requerida",
        description: "Debes iniciar sesion como admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [typesResponse, servicesResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/services/types/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/v1/services/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const typesData = await typesResponse.json().catch(() => []);
      if (!typesResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(typesData, "No se pudo cargar la lista de tipos de servicio."),
        });
        return;
      }

      const normalizedTypes = Array.isArray(typesData) ? (typesData as AdminServiceType[]) : [];
      setServiceTypes(normalizedTypes);
      if (normalizedTypes.length > 0 && !serviceTypeId) {
        const firstActive = normalizedTypes.find((item) => item.isActive);
        setServiceTypeId(firstActive?.id ?? normalizedTypes[0].id);
      }

      const servicesData = await servicesResponse.json().catch(() => []);
      if (!servicesResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(servicesData, "No se pudo cargar la lista de servicios."),
        });
        return;
      }
      setServices(Array.isArray(servicesData) ? (servicesData as AdminService[]) : []);
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexion",
        description: "No se pudo conectar con el backend.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, parseErrorMessage, serviceTypeId]);

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
  const hasValidType = Boolean(serviceTypeId);
  const hasImageIfNeeded = editingId ? true : Boolean(image);

  const hasChanges = editingId
    ? Boolean(
        originalSnapshot &&
          (serviceTypeId !== originalSnapshot.serviceTypeId ||
            trimmedDescription !== originalSnapshot.description ||
            normalizedItems.join("\n") !== originalSnapshot.itemsText ||
            Boolean(image)),
      )
    : Boolean(serviceTypeId || trimmedDescription || normalizedItems.length || image);

  const canSubmit =
    !isSubmitting && hasValidType && hasValidDescriptionLength && hasValidItems && hasImageIfNeeded && hasChanges;

  const getValidationError = () => {
    if (!hasValidType) return "Debes seleccionar un tipo de servicio.";
    if (!hasValidDescriptionLength) {
      return `La descripcion debe tener entre ${DESCRIPTION_MIN_LENGTH} y ${DESCRIPTION_MAX_LENGTH} caracteres.`;
    }
    if (!hasValidItems) return "Debes agregar al menos 1 item. Cada item maximo 180 caracteres.";
    if (!hasImageIfNeeded) return "Debes seleccionar una imagen.";
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
        description: "Debes iniciar sesion como admin para gestionar servicios.",
      });
      return;
    }

    const validationError = getValidationError();
    if (validationError) {
      toast({
        variant: "destructive",
        title: "Revisa el formulario",
        description: validationError,
      });
      return;
    }

    const formData = new FormData();
    formData.append("serviceTypeId", serviceTypeId);
    formData.append("description", trimmedDescription);
    normalizedItems.forEach((item) => formData.append("items", item));
    if (image) {
      formData.append("image", image);
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingId
        ? `${apiBaseUrl}/api/v1/services/admin/${editingId}`
        : `${apiBaseUrl}/api/v1/services/admin`;
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudo guardar el servicio."),
        });
        return;
      }

      const wasEditing = Boolean(editingId);
      resetForm();
      setIsModalOpen(false);
      toast({
        title: wasEditing ? "Servicio actualizado" : "Servicio creado",
        description: wasEditing
          ? "Los cambios del servicio se guardaron correctamente."
          : "El nuevo servicio se creo correctamente.",
      });
      await loadAllData();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexion",
        description: "No se pudo conectar con el backend.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (service: AdminService) => {
    setEditingId(service.id);
    setServiceTypeId(service.serviceTypeId);
    setDescription(service.description);
    const itemsJoined = service.items.join("\n");
    setItemsText(itemsJoined);
    setExistingImageUrl(service.imageUrl);
    setOriginalSnapshot({
      serviceTypeId: service.serviceTypeId,
      description: service.description.trim(),
      itemsText: itemsJoined,
    });
    setImage(null);
    setIsModalOpen(true);
  };

  const onToggleActive = async (service: AdminService) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sesion requerida",
        description: "Debes iniciar sesion como admin.",
      });
      return;
    }

    setTogglingId(service.id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/services/admin/${service.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: (() => {
          const form = new FormData();
          form.append("isActive", String(!service.isActive));
          return form;
        })(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudo actualizar el estado del servicio."),
        });
        return;
      }

      if (editingId === service.id) {
        resetForm();
      }
      toast({
        title: service.isActive ? "Servicio desactivado" : "Servicio activado",
        description: service.isActive
          ? "El servicio fue desactivado correctamente."
          : "El servicio fue activado correctamente.",
      });
      await loadAllData();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexion",
        description: "No se pudo conectar con el backend.",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const onDisable = async (serviceId: string) => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sesion requerida",
        description: "Debes iniciar sesion como admin.",
      });
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/services/admin/${serviceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "No se pudo desactivar el servicio."),
        });
        return;
      }

      if (editingId === serviceId) resetForm();
      toast({
        title: "Servicio desactivado",
        description: "El servicio fue desactivado correctamente.",
      });
      await loadAllData();
    } catch {
      toast({
        variant: "destructive",
        title: "Sin conexion",
        description: "No se pudo conectar con el backend.",
      });
    }
  };

  const onHeroAction = () => openCreateModal();

  const searchedServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter((service) => {
      const searchable = [
        service.serviceTypeName,
        service.description,
        ...service.items,
        service.isActive ? "activo" : "inactivo",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [services, searchQuery]);

  const tabCounts = useMemo(() => {
    const all = searchedServices.length;
    const active = searchedServices.filter((s) => s.isActive).length;
    return { all, active, inactive: all - active };
  }, [searchedServices]);

  const filteredServices = useMemo(() => {
    let list = searchedServices;
    if (filterTab === "active") list = list.filter((s) => s.isActive);
    if (filterTab === "inactive") list = list.filter((s) => !s.isActive);
    if (typeFilterId) list = list.filter((s) => s.serviceTypeId === typeFilterId);
    return list;
  }, [searchedServices, filterTab, typeFilterId]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTab, typeFilterId]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageOffset = (safePage - 1) * PAGE_SIZE;
  const paginatedServices = filteredServices.slice(pageOffset, pageOffset + PAGE_SIZE);

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.isActive).length;
    const itemsTotal = services.reduce((acc, s) => acc + s.items.length, 0);
    return { total, active, inactive: total - active, itemsTotal };
  }, [services]);

  const typeMostUsedLabel = useMemo(() => {
    if (services.length === 0) return "—";
    const counts: Record<string, number> = {};
    for (const s of services) {
      const id = s.serviceTypeId;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    let bestId = "";
    let bestCount = 0;
    for (const [id, c] of Object.entries(counts)) {
      if (c > bestCount || (c === bestCount && (bestId === "" || id < bestId))) {
        bestCount = c;
        bestId = id;
      }
    }
    const name = serviceTypes.find((t) => t.id === bestId)?.name ?? bestId;
    const raw = name.trim() || "—";
    return raw.length > 22 ? `${raw.slice(0, 20)}…` : raw;
  }, [services, serviceTypes]);

  const activeServiceTypes = serviceTypes.filter((item) => item.isActive);
  const selectedTypeName = activeServiceTypes.find((item) => item.id === serviceTypeId)?.name;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Servicios"
        subtitle="Catálogo completo de tu oferta artística."
        actionLabel="Nuevo servicio"
        onAction={onHeroAction}
        bordered={false}
      />

      {serviceTypes.filter((item) => item.isActive).length === 0 ? (
        <div className="mb-8 rounded-xl border border-gold/25 bg-black/22 px-5 py-4 text-sm text-foreground/75">
          No hay tipos de servicio activos.{" "}
          <Link href="/shamell-admin/service-types" className="text-gold underline underline-offset-2">
            Ir a Tipos de servicio
          </Link>
          .
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["TOTAL SERVICIOS", String(stats.total)],
            ["ACTIVOS", String(stats.active)],
            ["ITEMS TOTALES", String(stats.itemsTotal)],
            ["TIPO MÁS USADO", typeMostUsedLabel],
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
          placeholder="Buscar servicio..."
          className="mx-0 min-h-[3rem] max-w-none flex-1 rounded-xl border-gold/18 bg-black/22"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
          <div className="flex rounded-xl border border-gold/18 bg-black/22 p-1">
            {(
              [
                ["all", "Todos", tabCounts.all],
                ["active", "Activos", tabCounts.active],
                ["inactive", "Inactivos", tabCounts.inactive],
              ] as const
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilterTab(id)}
                className={cn(
                  "flex-1 whitespace-nowrap rounded-lg px-3 py-2.5 font-brand text-[10px] tracking-[0.12em] transition sm:flex-none sm:px-4",
                  filterTab === id
                    ? "bg-gold/12 text-gold shadow-inner"
                    : "text-foreground/50 hover:text-foreground/80",
                )}
              >
                {label} <span className="text-gold/50">•</span> {count}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className={cn(
              "inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 font-brand text-[10px] tracking-[0.14em] transition",
              filtersOpen
                ? "border-gold/50 bg-gold/10 text-gold"
                : "border-gold/18 bg-black/22 text-foreground/60 hover:border-gold/35 hover:text-gold",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
            Filtros
          </button>
        </div>
      </div>

      {filtersOpen ? (
        <div className="mb-6 rounded-xl border border-gold/15 bg-black/22 px-4 py-4 md:px-5">
          <p className="font-brand text-[10px] tracking-[0.2em] text-gold/80">TIPO DE SERVICIO</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTypeFilterId(null)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-body text-xs transition",
                typeFilterId === null
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-gold/15 text-foreground/55 hover:border-gold/30",
              )}
            >
              Todos los tipos
            </button>
            {serviceTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilterId((prev) => (prev === t.id ? null : t.id))}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-body text-xs transition",
                  typeFilterId === t.id
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-gold/15 text-foreground/55 hover:border-gold/30",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <section className="rounded-xl border border-gold/12 bg-black/15 p-4 md:p-5">
        <div className="overflow-x-auto rounded-xl border border-gold/14">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gold/12 bg-black/40">
                <th className="w-14 px-2 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/70" />
                <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">SERVICIO</th>
                <th className="px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">TIPO</th>
                <th className="w-20 px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">ITEMS</th>
                <th className="min-w-[9rem] px-3 py-3 font-brand text-[10px] tracking-[0.14em] text-gold/80">
                  ESTADO
                </th>
                <th className="w-36 px-3 py-3 text-right font-brand text-[10px] tracking-[0.14em] text-gold/80">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedServices.map((service) => {
                const { title } = displayServiceHeading(service.description);
                return (
                  <tr key={service.id} className="border-b border-gold/8 bg-black/15 transition hover:bg-gold/5">
                    <td className="px-2 py-3 align-middle">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-gold/20 bg-black/40">
                        {service.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={service.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-foreground/35">—</span>
                        )}
                      </div>
                    </td>
                    <td className="max-w-[14rem] px-3 py-3 align-middle md:max-w-[18rem]">
                      <p className="font-brand text-sm tracking-[0.04em] text-gold">{title}</p>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 font-body text-[11px]",
                          pillClassForTypeName(service.serviceTypeName),
                        )}
                      >
                        {service.serviceTypeName}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle font-body text-sm text-foreground/75">
                      {service.items.length}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void onToggleActive(service)}
                          disabled={togglingId === service.id}
                          className={cn(
                            "relative h-7 w-12 shrink-0 rounded-full border transition",
                            service.isActive
                              ? "border-emerald-400/45 bg-emerald-500/22"
                              : "border-foreground/22 bg-black/45",
                            togglingId === service.id && "cursor-not-allowed opacity-60",
                          )}
                          aria-label={`${service.isActive ? "Desactivar" : "Activar"} servicio`}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                              service.isActive ? "left-6" : "left-1",
                            )}
                          />
                        </button>
                        <span className="font-body text-xs text-foreground/55">
                          {service.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewService(service)}
                          className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
                          aria-label="Ver servicio"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(service)}
                          className="rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
                          aria-label="Editar servicio"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDisable(service.id)}
                          className="rounded-lg border border-red-400/25 p-2 text-foreground/55 transition hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300"
                          aria-label="Desactivar servicio"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-foreground/60">
                    No hay servicios para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gold/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-xs text-foreground/50">
            {filteredServices.length === 0
              ? "Mostrando 0 de 0"
              : `Mostrando ${pageOffset + 1}-${pageOffset + paginatedServices.length} de ${filteredServices.length}`}
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
                  "min-w-[2.25rem] rounded-lg border px-2.5 py-1.5 font-brand text-xs tracking-wide transition",
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

        {isLoading ? <p className="mt-3 text-sm text-foreground/65">Cargando...</p> : null}
      </section>

      <AdminModal
        title={editingId ? "Editar Servicio" : "Nuevo Servicio"}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form id="service-form" noValidate onSubmit={onSubmit} className="space-y-6">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TIPO DE SERVICIO</span>
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => {
                  if (activeServiceTypes.length === 0) return;
                  setIsTypeDropdownOpen((prev) => !prev);
                }}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-gold/30 bg-black/35 px-4 text-sm text-foreground transition hover:border-gold/55"
              >
                <span className={selectedTypeName ? "text-foreground" : "text-foreground/55"}>
                  {selectedTypeName ?? "Primero crea un tipo de servicio"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gold/80 transition ${isTypeDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isTypeDropdownOpen && activeServiceTypes.length > 0 ? (
                <div className="shamell-scrollbar absolute left-0 top-14 z-40 max-h-56 w-full overflow-y-auto rounded-xl border border-gold/35 bg-[#0b0f14] p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
                  {activeServiceTypes.map((item) => {
                    const isSelected = serviceTypeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setServiceTypeId(item.id);
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
              placeholder="Describe el servicio..."
            />
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">ITEMS (UNO POR LINEA)</span>
            <p className="mt-1 text-xs text-foreground/55 font-body">
              Lista de ejemplos en el sitio (bodas, yates…). Una línea = un bullet bajo la experiencia pública.
            </p>
            <textarea
              value={itemsText}
              onChange={(event) => setItemsText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gold/30 bg-black/35 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder={"Item 1\nItem 2\nItem 3"}
            />
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">IMAGEN</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-xl border border-gold/30 bg-black/35 px-4 py-3 text-sm text-foreground outline-none file:mr-3 file:border-0 file:bg-gold/20 file:px-3 file:py-1 file:text-gold"
            />
          </label>

          {imagePreviewUrl || existingImageUrl ? (
            <div className="rounded-xl border border-gold/25 bg-black/25 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-gold/85">
                  {imagePreviewUrl ? "Vista previa de imagen seleccionada" : "Imagen actual del servicio"}
                </p>
                {imagePreviewUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setIsPreviewLightboxOpen(false);
                    }}
                    className="rounded-full border border-gold/30 p-1 text-gold/85 transition hover:bg-gold/10 hover:text-gold"
                    aria-label="Quitar imagen seleccionada"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <div className="overflow-hidden rounded-lg border border-gold/20 bg-black/30 p-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewLightboxOpen(true)}
                  className="block w-full"
                  aria-label="Abrir vista ampliada de imagen"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreviewUrl ?? existingImageUrl ?? ""}
                    alt="Vista previa"
                    className="h-44 w-full rounded-md object-cover transition hover:opacity-90"
                  />
                </button>
              </div>
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
              {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear servicio"}
            </button>
          </div>
        </form>
      </AdminModal>

      {isPreviewLightboxOpen && (imagePreviewUrl || existingImageUrl) ? (
        <div
          className="fixed inset-0 z-95 flex items-center justify-center bg-black/85 px-4 py-8"
          onClick={() => setIsPreviewLightboxOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl border border-gold/30 bg-[#0a0d12] p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPreviewLightboxOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full border border-gold/30 bg-black/60 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Cerrar vista previa"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreviewUrl ?? existingImageUrl ?? ""}
              alt="Vista ampliada"
              className="max-h-[82vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      ) : null}

      {viewService ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 px-4 py-8"
          onClick={() => setViewService(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/25 bg-[#0c0c0c] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewService(null)}
              className="absolute right-3 top-3 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="font-brand text-[10px] tracking-[0.2em] text-gold/75">VISTA RÁPIDA</p>
            <h2 className="mt-2 font-brand text-xl text-gold">
              {displayServiceHeading(viewService.description).title}
            </h2>
            <p className="mt-1 font-body text-xs text-foreground/45">{viewService.serviceTypeName}</p>
            {viewService.imageUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-gold/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={viewService.imageUrl} alt="" className="max-h-56 w-full object-cover" />
              </div>
            ) : null}
            <p className="mt-4 font-body text-sm leading-relaxed text-foreground/70">{viewService.description}</p>
            <p className="mt-3 font-body text-xs text-foreground/45">
              {viewService.items.length} ítem(s) · {viewService.isActive ? "Activo" : "Inactivo"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
