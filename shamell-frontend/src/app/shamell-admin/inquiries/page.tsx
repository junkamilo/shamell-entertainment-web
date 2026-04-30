"use client";

import { useAdminContactInquiries } from "@/hooks/use-admin-contact-inquiries";
import AdminModuleHero from "@/components/admin/AdminModuleHero";

export default function ShamellAdminInquiriesPage() {
  const { requests, isLoading, error, reload } = useAdminContactInquiries();

  return (
    <div className="mx-auto max-w-5xl">
      <AdminModuleHero title="Consultas" actionLabel="Actualizar Consultas" onAction={reload} />
      <p className="mb-8 text-sm text-foreground/65">
        Solicitudes enviadas desde el formulario de contacto del sitio público.
      </p>

      {isLoading ? <p className="text-foreground/70 text-sm">Cargando...</p> : null}
      {error ? <p className="text-red-300 text-sm">{error}</p> : null}

      {!isLoading && !error ? (
        requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-lg border border-gold/25 bg-black/20 p-4 md:p-5"
              >
                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="font-brand text-sm tracking-[0.12em] text-gold">
                      {request.fullName}
                    </h2>
                    <p className="text-foreground/70 text-sm">{request.email}</p>
                    {request.phone ? (
                      <p className="text-foreground/60 text-xs">{request.phone}</p>
                    ) : null}
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-foreground/60 text-xs">
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-gold/80">
                      {request.serviceType ?? "GENERAL"}
                    </p>
                    <p className="mt-1 text-xs">{request.isRead ? "Leído" : "Sin leer"}</p>
                  </div>
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed">{request.message}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-foreground/70 text-sm">No hay consultas todavía.</p>
        )
      ) : null}
    </div>
  );
}
