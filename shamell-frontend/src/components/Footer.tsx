import Link from "next/link";
import { Mail, Video } from "lucide-react";
import FlameIcon from "@/components/FlameIcon";
import PearlDivider from "@/components/PearlDivider";
import { cn } from "@/lib/utils";

const exploreLinks = [
  { label: "Home", href: "/#hero" },
  { label: "Services", href: "/#services" },
  { label: "Experiences", href: "/#experiences" },
  { label: "About", href: "/#about" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contacto" },
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

export default function Footer({
  className,
  fullWidth = false,
  topPearls = false,
}: {
  className?: string;
  fullWidth?: boolean;
  topPearls?: boolean;
}) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative mt-8 border-t border-gold/20 bg-linear-to-b from-[#15091f] via-[#0d0714] to-[#09050d] pb-10 pt-12 text-foreground",
        className,
      )}
    >
      {topPearls ? (
        <PearlDivider
          className="pointer-events-none absolute inset-x-0 top-0 z-20 translate-y-[-46%]"
          fullWidth
        />
      ) : null}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent"
        aria-hidden
      />

      <div className={cn(fullWidth ? "w-full px-0" : "mx-auto max-w-6xl px-4 sm:px-6")}>
        <div className={cn(fullWidth ? "px-4 sm:px-6" : "px-0")}>
          <div className="grid gap-10 md:grid-cols-2 md:gap-9 lg:grid-cols-12 lg:gap-8">
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
              <p className="mt-5 max-w-sm font-body text-base font-semibold leading-relaxed text-foreground/88 md:text-lg md:leading-relaxed md:text-foreground/90">
                Stage art and oriental dance for private events, productions, and bespoke experiences.
              </p>
            </div>

            <nav className="lg:col-span-4" aria-label="Footer links">
              <h2 className="mb-5 font-brand text-xs font-semibold tracking-[0.24em] text-gold/95 uppercase md:text-sm md:tracking-[0.26em]">
                Explore
              </h2>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:max-w-md">
                {exploreLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="font-body text-base font-semibold leading-relaxed text-foreground/88 transition-colors hover:text-gold md:text-lg md:leading-relaxed md:text-foreground/90"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-4">
              <div>
                <h2 className="mb-5 font-brand text-xs font-semibold tracking-[0.24em] text-gold/95 uppercase md:text-sm md:tracking-[0.26em]">
                  Inquiries
                </h2>
                <p className="mb-4 max-w-xs font-body text-base font-semibold leading-relaxed text-foreground/88 md:text-lg md:leading-relaxed md:text-foreground/90">
                  Availability, technical rider, and proposals for your event.
                </p>
                <Link
                  href="/contacto"
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center border border-gold/55 px-6 py-2.5 font-brand text-xs font-semibold tracking-[0.2em] text-gold uppercase transition-all duration-300 md:tracking-[0.22em]",
                    "hover:border-gold hover:bg-gold/8 hover:text-gold-light hover:shadow-[0_0_24px_rgba(197,165,90,0.15)]",
                  )}
                >
                  Inquire
                </Link>
              </div>

              <div>
                <h2 className="mb-3 font-brand text-xs font-semibold tracking-[0.24em] text-gold/95 uppercase md:text-sm md:tracking-[0.26em]">
                  Social
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
                    aria-label="Send inquiry by email"
                  >
                    <Mail className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </a>
                  <span
                    className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-white/8 text-foreground/35"
                    aria-label="Video channel — coming soon"
                    title="Coming soon"
                  >
                    <Video className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="my-8 h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent"
            aria-hidden
          />

          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="font-body text-sm font-medium tracking-wide text-foreground/75 md:text-base md:text-foreground/82">
              © {year} Shamell. All rights reserved.
            </p>
            <p className="font-brand text-xs font-semibold tracking-[0.28em] text-foreground/70 uppercase md:text-sm md:tracking-[0.32em] md:text-foreground/78">
              Performance · Art · Events
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
