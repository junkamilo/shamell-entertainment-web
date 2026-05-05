import Link from "next/link";
import { Mail, Video } from "lucide-react";
import FlameIcon from "@/components/FlameIcon";
import { cn } from "@/lib/utils";

const exploreLinks = [
  { label: "Inicio", href: "/#hero" },
  { label: "Servicios", href: "/#services" },
  { label: "Experiencias", href: "/#experiences" },
  { label: "Acerca de", href: "/#about" },
  { label: "Galería", href: "/#gallery" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contacto" },
] as const;

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4.5 w-4.5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const socialLinkClass = cn(
  "flex h-10 w-10 items-center justify-center rounded-lg border border-gold/25 text-gold/80 transition-all duration-300",
  "hover:border-gold/50 hover:bg-gold/7 hover:text-gold hover:shadow-[0_0_20px_rgba(197,165,90,0.12)]",
);

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-gold/15 bg-linear-to-b from-[oklch(0.1_0.02_45)] to-black pb-10 pt-14 text-foreground">
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link
              href="/#hero"
              className="group inline-flex flex-col gap-3 transition-colors hover:text-gold-light"
            >
              <span className="flex items-center gap-3">
                <FlameIcon className="h-8 w-5 shrink-0 text-gold opacity-90 transition-opacity group-hover:opacity-100" />
                <span className="font-brand text-lg tracking-[0.28em] text-gold sm:text-xl">
                  SHAMELL
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm font-body text-sm leading-relaxed text-foreground/55">
              Arte escénico y danza oriental para eventos privados, producciones y experiencias a
              medida.
            </p>
          </div>

          <nav className="lg:col-span-4" aria-label="Enlaces del pie">
            <h2 className="mb-5 font-brand text-[10px] tracking-[0.28em] text-gold/90 uppercase">
              Explorar
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:max-w-md">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="font-brand text-[11px] tracking-[0.14em] text-foreground/60 uppercase transition-colors hover:text-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-4">
            <div>
              <h2 className="mb-5 font-brand text-[10px] tracking-[0.28em] text-gold/90 uppercase">
                Consultas
              </h2>
              <p className="mb-4 max-w-xs font-body text-sm text-foreground/50">
                Disponibilidad, rider técnico y propuestas para tu evento.
              </p>
              <Link
                href="/contacto"
                className={cn(
                  "inline-flex min-h-11 items-center justify-center border border-gold/55 px-6 py-2.5 font-brand text-[10px] tracking-[0.22em] text-gold uppercase transition-all duration-300",
                  "hover:border-gold hover:bg-gold/8 hover:text-gold-light hover:shadow-[0_0_24px_rgba(197,165,90,0.15)]",
                )}
              >
                Inquire
              </Link>
            </div>

            <div>
              <h2 className="mb-3 font-brand text-[10px] tracking-[0.28em] text-gold/90 uppercase">
                Redes
              </h2>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="https://instagram.com/Shamellentertainment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialLinkClass}
                  aria-label="Instagram — Shamell Entertainment"
                >
                  <InstagramGlyph />
                </a>
                <a
                  href="/contacto"
                  className={socialLinkClass}
                  aria-label="Enviar consulta por correo"
                >
                  <Mail className="h-4.5 w-4.5" strokeWidth={1.75} />
                </a>
                <span
                  className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-white/8 text-foreground/35"
                  aria-label="Canal de video — próximamente"
                  title="Próximamente"
                >
                  <Video className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="my-10 h-px w-full bg-linear-to-r from-transparent via-white/8 to-transparent"
          aria-hidden
        />

        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="font-body text-xs tracking-wide text-foreground/45">
            © {year} Shamell. Todos los derechos reservados.
          </p>
          <p className="font-brand text-[10px] tracking-[0.35em] text-foreground/35 uppercase">
            Performance · Arte · Eventos
          </p>
        </div>
      </div>
    </footer>
  );
}
