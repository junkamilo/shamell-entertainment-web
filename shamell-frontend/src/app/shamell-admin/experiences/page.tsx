"use client";

import AdminModuleHero from "@/components/admin/AdminModuleHero";

export default function ShamellAdminExperiencesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <AdminModuleHero
        title="Experiencias"
        actionLabel="Nueva Experiencia"
        actionHref="/shamell-admin/experiences#experience-editor"
      />
      <p className="mb-6 text-sm leading-relaxed text-foreground/70">
        Gestión de las tarjetas “Special Experiences” (fire, veil & fan, sword & candelabra): textos,
        listas de ítems e imágenes. El hook del sitio ya está preparado para consumir{" "}
        <code className="text-gold/80">GET /api/v1/experiences</code> cuando exista.
      </p>
      <div
        id="experience-editor"
        className="rounded-lg border border-gold/20 border-dashed bg-black/15 p-8 text-center"
      >
        <p className="font-brand text-xs tracking-[0.16em] text-gold/80">PRÓXIMAMENTE</p>
        <p className="mt-2 text-sm text-foreground/55">Editor + upload de imágenes</p>
      </div>
    </div>
  );
}
