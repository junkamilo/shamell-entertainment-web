import Image from "next/image";
import Link from "next/link";
import type { AgendaHubCardProps } from "../types/agendaHub.types";

export default function AgendaHubCard({ card, badgeCount = 0 }: AgendaHubCardProps) {
  const { href, title, subtitle, iconSrc, fire } = card;

  return (
    <Link
      href={href}
      className={`group shamell-glass-card relative ${fire ? "shamell-glass-card--fire" : ""}`}
    >
      {badgeCount > 0 ? (
        <span className="absolute right-3 top-3 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full border border-gold/45 bg-gold/20 px-1.5 font-brand text-[10px] tracking-widest text-gold">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
      <Image
        src={iconSrc}
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 object-contain"
        aria-hidden
      />
      <p className="mt-5 font-brand text-xs tracking-[0.18em] text-gold sm:text-sm">
        {title.toUpperCase()}
      </p>
      <p className="mt-3 font-elegant text-xl leading-[1.65] text-foreground/92 sm:font-body sm:text-base sm:leading-relaxed sm:text-foreground/82 md:text-[1.0625rem]">
        {subtitle}
      </p>
      <span className="mt-4 font-brand text-xs tracking-[0.14em] text-gold/75 group-hover:text-gold sm:text-[11px]">
        OPEN →
      </span>
    </Link>
  );
}
