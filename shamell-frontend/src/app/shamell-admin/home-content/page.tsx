"use client";

import AdminModuleHero from "@/components/admin/AdminModuleHero";

export default function ShamellAdminHomeContentPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <AdminModuleHero title="Inicio / Hero" actionLabel="Editar Hero" actionHref="/shamell-admin/home-content#hero-cms" />
      <p className="mb-6 text-sm leading-relaxed text-foreground/70">
        Control del hero principal: imagen de fondo, titular, subtítulo, CTA y cita decorativa.
        Ideal para cambios de temporada sin tocar código.
      </p>
      <div id="hero-cms" className="rounded-lg border border-gold/20 border-dashed bg-black/15 p-8 text-center">
        <p className="font-brand text-xs tracking-[0.16em] text-gold/80">PRÓXIMAMENTE</p>
        <p className="mt-2 text-sm text-foreground/55">CMS del hero + preview</p>
      </div>
    </div>
  );
}
