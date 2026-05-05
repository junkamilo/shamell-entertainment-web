"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
  Trash2,
} from "lucide-react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import {
  InquiryDetailsReadable,
  buildInquiryDetailRows,
  formatAdminServiceType,
} from "@/components/admin/InquiryDetailsReadable";
import { useAdminContactRequests, type ContactRequest } from "@/hooks/use-admin-contact-requests";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CONTACT_MESSAGE_SEPARATOR = "\n\n---\n\n";

/** Si ya hay detalle del formulario legible, oculta el bloque resumen que el backend anteponía al mensaje. */
function contactMessageForAdmin(full: string, hasStructuredDetails: boolean): string {
  const i = full.indexOf(CONTACT_MESSAGE_SEPARATOR);
  if (i === -1) return full;
  if (!hasStructuredDetails) return full.trim();
  const tail = full.slice(i + CONTACT_MESSAGE_SEPARATOR.length).trim();
  return tail.length ? tail : "Sin comentario adicional.";
}

function formatRequestDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function RequestCard({
  row,
  expanded,
  onToggle,
  onMarkRead,
  onRemove,
  busyId,
}: {
  row: ContactRequest;
  expanded: boolean;
  onToggle: () => void;
  onMarkRead: () => void;
  onRemove: () => void;
  busyId: string | null;
}) {
  const busy = busyId === row.id;
  const inquiryRows = useMemo(() => buildInquiryDetailRows(row.inquiryDetails), [row.inquiryDetails]);
  const hasStructuredDetails = inquiryRows.length > 0;

  return (
    <article
      className={cn(
        "rounded-xl border px-4 py-3 transition-colors",
        row.isRead ? "border-gold/10 bg-black/15" : "border-gold/25 bg-gold/6",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 text-left"
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10">
          <Mail className="h-4 w-4 text-gold" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-brand text-sm tracking-wide text-gold">{row.fullName}</span>
            {!row.isRead ? (
              <span className="rounded border border-gold/40 px-1.5 py-0.5 font-brand text-[9px] tracking-widest text-gold">
                NUEVO
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-foreground/55">{row.email}</p>
          <p className="mt-1 line-clamp-2 font-body text-xs text-foreground/65">{row.subject}</p>
          <p className="mt-1 font-brand text-[10px] tracking-widest text-foreground/40">
            {formatRequestDate(row.createdAt)}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-gold/70" strokeWidth={1.5} />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gold/70" strokeWidth={1.5} />
        )}
      </button>

      {expanded ? (
        <div className="mt-4 space-y-3 border-t border-gold/10 pt-4 pl-0 md:pl-12">
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            {row.phone ? (
              <>
                <dt className="font-brand text-[10px] tracking-widest text-gold/60">TELÉFONO</dt>
                <dd className="text-foreground/80">{row.phone}</dd>
              </>
            ) : null}
            {row.eventDate ? (
              <>
                <dt className="font-brand text-[10px] tracking-widest text-gold/60">FECHA EVENTO</dt>
                <dd className="text-foreground/80">{formatRequestDate(row.eventDate)}</dd>
              </>
            ) : null}
            {row.location ? (
              <>
                <dt className="font-brand text-[10px] tracking-widest text-gold/60">UBICACIÓN</dt>
                <dd className="text-foreground/80">{row.location}</dd>
              </>
            ) : null}
            {row.serviceType ? (
              <>
                <dt className="font-brand text-[10px] tracking-widest text-gold/60">LÍNEA DE SERVICIO</dt>
                <dd className="text-foreground/80">{formatAdminServiceType(row.serviceType)}</dd>
              </>
            ) : null}
          </dl>
          <InquiryDetailsReadable rows={inquiryRows} />
          <div>
            <p className="mb-1 font-brand text-[10px] tracking-widest text-gold/60">
              {hasStructuredDetails ? "COMENTARIO DEL CLIENTE" : "MENSAJE"}
            </p>
            <p className="whitespace-pre-wrap rounded-lg border border-gold/15 bg-black/25 p-3 font-body text-sm leading-relaxed text-foreground/80">
              {contactMessageForAdmin(row.message, hasStructuredDetails)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!row.isRead ? (
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
                className="rounded-md border border-gold/35 px-3 py-2 font-brand text-[10px] tracking-widest text-gold transition hover:bg-gold/10 disabled:opacity-50"
              >
                Marcar como leída
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-400/35 px-3 py-2 font-brand text-[10px] tracking-widest text-red-200/90 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Eliminar
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function ShamellAdminDashboardPage() {
  const { requests, isLoading, error, reload, markAsRead, remove } = useAdminContactRequests();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const unread = useMemo(() => requests.filter((r) => !r.isRead).length, [requests]);

  const onMarkRead = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await markAsRead(id);
        toast({ title: "Marcada como leída" });
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [markAsRead],
  );

  const onRemove = useCallback(
    async (id: string) => {
      if (!window.confirm("¿Eliminar esta solicitud de forma permanente?")) return;
      setBusyId(id);
      try {
        await remove(id);
        setExpandedId((cur) => (cur === id ? null : cur));
        toast({ title: "Solicitud eliminada" });
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [remove],
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="Bandeja de entrada"
        subtitle="Mensajes enviados desde el formulario de contacto del sitio público."
        actionLabel="Sitio público"
        actionHref="/"
        bordered={false}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-foreground/55">
          <span>
            Total: <strong className="text-gold/90">{isLoading ? "…" : requests.length}</strong>
          </span>
          <span className="text-gold/30">|</span>
          <span>
            Sin leer: <strong className="text-gold/90">{isLoading ? "…" : unread}</strong>
          </span>
          {error ? (
            <>
              <span className="text-gold/30">|</span>
              <span className="text-red-300/90">{error}</span>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => reload()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />}
            ACTUALIZAR
          </button>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold/90 transition hover:border-gold/45 hover:bg-gold/10"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
            ABRIR SITIO
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-gold/12 bg-black/15 p-5 md:p-7">
        <p className="max-w-2xl font-body text-xs text-foreground/50">
          Cada envío del formulario aparece aquí. Usa el menú lateral para editar catálogo, galería y demás módulos.
        </p>

        <div className="mt-6 space-y-3">
          {isLoading && requests.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-foreground/50">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              Cargando…
            </div>
          ) : null}

          {!isLoading && requests.length === 0 && !error ? (
            <p className="rounded-xl border border-gold/12 bg-black/20 py-12 text-center font-body text-sm text-foreground/50">
              Aún no hay mensajes del formulario.
            </p>
          ) : null}

          {requests.map((row) => (
            <RequestCard
              key={row.id}
              row={row}
              expanded={expandedId === row.id}
              onToggle={() => setExpandedId((id) => (id === row.id ? null : row.id))}
              onMarkRead={() => onMarkRead(row.id)}
              onRemove={() => onRemove(row.id)}
              busyId={busyId}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
