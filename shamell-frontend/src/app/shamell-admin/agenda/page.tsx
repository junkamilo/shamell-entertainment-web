"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CalendarDays, Inbox, LayoutDashboard } from "lucide-react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { readPeticionesLastSeenAt } from "@/lib/peticionesNotifications";

const cards = [
  {
    href: "/shamell-admin/agenda/agendar",
    title: "Agendar",
    subtitle: "Nueva reserva por teléfono o presencial: servicio, tipo de evento, fecha y cliente.",
    icon: CalendarDays,
    fire: false,
  },
  {
    href: "/shamell-admin/agenda/disponibilidad",
    title: "Disponibilidad",
    subtitle: "Horario semanal y días cerrados (fechas puntuales o cada semana, por ejemplo domingos).",
    icon: CalendarClock,
    fire: false,
  },
  {
    href: "/shamell-admin/agenda/peticiones",
    title: "Peticiones",
    subtitle: "Mensajes enviados desde el formulario público; revisar datos y marcar como leídas.",
    icon: Inbox,
    fire: true,
  },
  {
    href: "/shamell-admin/agenda/mi-agenda",
    title: "Mi Agenda",
    subtitle: "Calendario semanal con reservas confirmadas, horarios y eventos programados.",
    icon: LayoutDashboard,
    fire: false,
  },
];

export default function AgendaHubPage() {
  const [peticionesBadge, setPeticionesBadge] = useState(0);
  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) : null;
    if (!token) {
      setPeticionesBadge(0);
      return;
    }
    let cancelled = false;

    const loadBadge = async () => {
      try {
        const lastSeen = readPeticionesLastSeenAt();
        const [contactRes, bookingsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/v1/contact`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiBaseUrl}/api/v1/bookings/admin`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const contactJson = await contactRes.json().catch(() => []);
        const bookingsJson = await bookingsRes.json().catch(() => []);
        if (cancelled) return;
        const contactRows = Array.isArray(contactJson)
          ? contactJson
          : Array.isArray((contactJson as { items?: unknown }).items)
            ? ((contactJson as { items: unknown[] }).items ?? [])
            : [];
        const bookingRows = Array.isArray(bookingsJson)
          ? bookingsJson
          : Array.isArray((bookingsJson as { items?: unknown }).items)
            ? ((bookingsJson as { items: unknown[] }).items ?? [])
            : [];
        const contactCount = contactRows.filter((r) => {
          const created = Date.parse(String((r as { createdAt?: string }).createdAt ?? ""));
          return Number.isFinite(created) && created > lastSeen;
        }).length;
        const bookingCount = bookingRows.filter((r) => {
          const created = Date.parse(String((r as { createdAt?: string }).createdAt ?? ""));
          return Number.isFinite(created) && created > lastSeen;
        }).length;
        setPeticionesBadge(contactCount + bookingCount);
      } catch {
        if (!cancelled) setPeticionesBadge(0);
      }
    };

    void loadBadge();
    const interval = window.setInterval(loadBadge, 45000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [apiBaseUrl]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <AdminModuleHero
        title="Agenda"
        subtitle="Centraliza reservas manuales, horarios de trabajo y solicitudes de contacto."
        actionLabel="Ver peticiones"
        actionHref="/shamell-admin/agenda/peticiones"
        bordered={false}
      />

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map(({ href, title, subtitle, icon: Icon, fire }) => (
          <Link
            key={href}
            href={href}
            className={`group shamell-glass-card relative ${fire ? "shamell-glass-card--fire" : ""}`}
          >
            {title === "Peticiones" && peticionesBadge > 0 ? (
              <span className="absolute right-3 top-3 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full border border-gold/45 bg-gold/20 px-1.5 font-brand text-[10px] tracking-widest text-gold">
                {peticionesBadge > 99 ? "99+" : peticionesBadge}
              </span>
            ) : null}
            <div className="shamell-icon-box">
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <p className="mt-5 font-brand text-xs tracking-[0.18em] text-gold">{title.toUpperCase()}</p>
            <p className="mt-2 font-body text-sm leading-relaxed text-foreground/65">{subtitle}</p>
            <span className="mt-4 font-brand text-[10px] tracking-[0.14em] text-gold/70 group-hover:text-gold">
              ABRIR →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
