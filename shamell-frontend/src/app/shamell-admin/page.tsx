"use client";

import Link from "next/link";
import { Mail, Package, Sparkles, ImageIcon, Home, Shapes, CalendarRange, Tags, PanelsTopLeft } from "lucide-react";
import { useAdminContactInquiries } from "@/hooks/use-admin-contact-inquiries";
import AdminModuleHero from "@/components/admin/AdminModuleHero";

export default function ShamellAdminDashboardPage() {
  const { requests, isLoading, error } = useAdminContactInquiries();

  const unread = requests.filter((r) => !r.isRead).length;
  const total = requests.length;

  return (
    <div className="mx-auto max-w-6xl">
      <AdminModuleHero title="Panel De Control" actionLabel="Servicios" actionHref="/shamell-admin/services" />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gold/25 bg-black/25 p-4 shadow-sm">
          <p className="font-brand text-[10px] tracking-[0.14em] text-foreground/55">CONSULTAS</p>
          <p className="mt-2 font-brand text-2xl text-gold">{isLoading ? "…" : total}</p>
        </div>
        <div className="rounded-lg border border-gold/25 bg-black/25 p-4 shadow-sm">
          <p className="font-brand text-[10px] tracking-[0.14em] text-foreground/55">SIN LEER</p>
          <p className="mt-2 font-brand text-2xl text-gold">{isLoading ? "…" : unread}</p>
        </div>
        <div className="rounded-lg border border-gold/25 bg-black/25 p-4 shadow-sm sm:col-span-2 lg:col-span-2">
          <p className="font-brand text-[10px] tracking-[0.14em] text-foreground/55">ESTADO API</p>
          <p className="mt-2 text-sm text-foreground/70">
            {error ? (
              <span className="text-red-300">{error}</span>
            ) : (
              "Consultas sincronizadas con el backend."
            )}
          </p>
        </div>
      </div>

      <h2 className="mb-4 font-brand text-xs tracking-[0.2em] text-gold">ACCESO RÁPIDO</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/shamell-admin/inquiries"
          className="group rounded-lg border border-gold/25 bg-black/20 p-6 transition-colors hover:border-gold/45 hover:bg-gold/5"
        >
          <Mail className="mb-3 h-8 w-8 text-gold opacity-90" strokeWidth={1.2} />
          <h3 className="font-brand text-sm tracking-[0.12em] text-gold">Consultas</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            Mensajes del formulario de contacto y solicitudes de booking.
          </p>
        </Link>
        <Link
          href="/shamell-admin/service-types"
          className="group rounded-lg border border-gold/25 bg-black/20 p-6 transition-colors hover:border-gold/45 hover:bg-gold/5"
        >
          <Shapes className="mb-3 h-8 w-8 text-gold opacity-90" strokeWidth={1.2} />
          <h3 className="font-brand text-sm tracking-[0.12em] text-gold">Tipos de servicio</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            Define Fire, Veil & Fan y Sword & Candelabra para usar en Servicios.
          </p>
        </Link>
        <Link
          href="/shamell-admin/services"
          className="group rounded-lg border border-gold/25 bg-black/20 p-6 transition-colors hover:border-gold/45 hover:bg-gold/5"
        >
          <Package className="mb-3 h-8 w-8 text-gold opacity-90" strokeWidth={1.2} />
          <h3 className="font-brand text-sm tracking-[0.12em] text-gold">Servicios</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            Catálogo que se muestra en la web (private galas, VIP, bespoke).
          </p>
        </Link>
        <Link
          href="/shamell-admin/event-types"
          className="group rounded-lg border border-gold/25 bg-black/20 p-6 transition-colors hover:border-gold/45 hover:bg-gold/5"
        >
          <Tags className="mb-3 h-8 w-8 text-gold opacity-90" strokeWidth={1.2} />
          <h3 className="font-brand text-sm tracking-[0.12em] text-gold">Tipos de evento</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            Define tipos de evento para el catálogo de eventos y experiencia.
          </p>
        </Link>
        <Link
          href="/shamell-admin/events"
          className="group rounded-lg border border-gold/25 bg-black/20 p-6 transition-colors hover:border-gold/45 hover:bg-gold/5"
        >
          <CalendarRange className="mb-3 h-8 w-8 text-gold opacity-90" strokeWidth={1.2} />
          <h3 className="font-brand text-sm tracking-[0.12em] text-gold">Eventos</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            Crea y administra el listado de eventos para mostrar en el sitio.
          </p>
        </Link>
        <Link
          href="/shamell-admin/gallery-categories"
          className="group rounded-lg border border-gold/25 bg-black/20 p-6 transition-colors hover:border-gold/45 hover:bg-gold/5"
        >
          <PanelsTopLeft className="mb-3 h-8 w-8 text-gold opacity-90" strokeWidth={1.2} />
          <h3 className="font-brand text-sm tracking-[0.12em] text-gold">Categorias de galeria</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            Administra tabs y categorias usadas para filtrar las fotos públicas.
          </p>
        </Link>
        <Link
          href="/shamell-admin/gallery"
          className="group rounded-lg border border-gold/25 bg-black/20 p-6 transition-colors hover:border-gold/45 hover:bg-gold/5"
        >
          <ImageIcon className="mb-3 h-8 w-8 text-gold opacity-90" strokeWidth={1.2} />
          <h3 className="font-brand text-sm tracking-[0.12em] text-gold">Galería</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            Imágenes públicas y filtros por categoría.
          </p>
        </Link>
        <Link
          href="/shamell-admin/experiences"
          className="group rounded-lg border border-gold/25 bg-black/20 p-6 transition-colors hover:border-gold/45 hover:bg-gold/5 md:col-span-2"
        >
          <Sparkles className="mb-3 h-8 w-8 text-gold opacity-90" strokeWidth={1.2} />
          <h3 className="font-brand text-sm tracking-[0.12em] text-gold">Experiencias</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            Fire, veil, sword & candelabra y contenido especial del home.
          </p>
        </Link>
        <Link
          href="/shamell-admin/home-content"
          className="group rounded-lg border border-gold/25 bg-black/20 p-6 transition-colors hover:border-gold/45 hover:bg-gold/5"
        >
          <Home className="mb-3 h-8 w-8 text-gold opacity-90" strokeWidth={1.2} />
          <h3 className="font-brand text-sm tracking-[0.12em] text-gold">Inicio / Hero</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            Banner principal, textos destacados y assets del hero.
          </p>
        </Link>
      </div>
    </div>
  );
}
