"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Pencil, Trash2, X } from "lucide-react";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { toast } from "@/hooks/use-toast";

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

export default function ShamellAdminServicesPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const [serviceTypeId, setServiceTypeId] = useState("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredServices = services.filter((service) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
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

  const activeServiceTypes = serviceTypes.filter((item) => item.isActive);
  const selectedTypeName = activeServiceTypes.find((item) => item.id === serviceTypeId)?.name;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero title="Servicios" actionLabel="Nuevo Servicio" onAction={onHeroAction} bordered={false} />

      {serviceTypes.filter((item) => item.isActive).length === 0 ? (
        <div className="mb-8 rounded-md border border-gold/30 bg-black/20 px-5 py-4 text-sm text-foreground/75">
          No hay tipos de servicio activos.{" "}
          <Link href="/shamell-admin/service-types" className="text-gold underline underline-offset-2">
            Ir a Tipos de servicio
          </Link>
          .
        </div>
      ) : null}

      <AdminSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar servicio..."
        className="mb-6"
      />

      <section className="rounded-md bg-black/20 p-3 md:p-4">
        <div className="max-h-[58vh] overflow-y-auto rounded-xl border border-gold/20">
          <table className="w-full min-w-[880px] border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0d1117]">
              <tr className="border-b border-gold/15 text-left">
                <th className="px-4 py-3 font-brand text-[11px] tracking-[0.12em] text-gold/80">SERVICIO</th>
                <th className="px-4 py-3 font-brand text-[11px] tracking-[0.12em] text-gold/80">TIPO</th>
                <th className="px-4 py-3 font-brand text-[11px] tracking-[0.12em] text-gold/80">ITEMS</th>
                <th className="px-4 py-3 font-brand text-[11px] tracking-[0.12em] text-gold/80">ESTADO</th>
                <th className="px-4 py-3 font-brand text-[11px] tracking-[0.12em] text-gold/80">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id} className="border-b border-gold/10 bg-black/20">
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground">{service.description.slice(0, 72)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-xs text-gold/90">
                      {service.serviceTypeName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground/80">{service.items.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          service.isActive
                            ? "border border-emerald-300/40 bg-emerald-400/15 text-emerald-300"
                            : "border border-red-300/40 bg-red-400/15 text-red-300"
                        }`}
                      >
                        {service.isActive ? "Activo" : "Inactivo"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleActive(service)}
                        disabled={togglingId === service.id}
                        className={`relative h-7 w-12 rounded-full border transition ${
                          service.isActive
                            ? "border-emerald-400/50 bg-emerald-500/25"
                            : "border-foreground/25 bg-black/40"
                        } ${togglingId === service.id ? "cursor-not-allowed opacity-60" : ""}`}
                        aria-label={`${service.isActive ? "Desactivar" : "Activar"} servicio`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                            service.isActive ? "left-6" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(service)}
                        className="rounded-full border border-gold/25 p-1.5 text-foreground/70 transition hover:bg-gold/10 hover:text-gold"
                        aria-label="Editar servicio"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDisable(service.id)}
                        className="rounded-full border border-red-300/30 p-1.5 text-foreground/70 transition hover:bg-red-300/10 hover:text-red-300"
                        aria-label="Desactivar servicio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-foreground/65">
                    No hay servicios para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {isLoading ? <p className="mt-4 text-sm text-foreground/70">Cargando...</p> : null}
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
            <img
              src={imagePreviewUrl ?? existingImageUrl ?? ""}
              alt="Vista ampliada"
              className="max-h-[82vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
