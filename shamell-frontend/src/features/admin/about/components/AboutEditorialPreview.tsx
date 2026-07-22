"use client";

import Image from "next/image";
import { FileText, Heart, Image as ImageIcon, Pencil } from "lucide-react";
import { isAboutHeroVideoDisplay } from "@/lib/aboutHeroMedia";
import {
  aboutHeroMediaClassName,
  aboutHeroMediaFrameClassName,
  aboutHeroVideoCardClassName,
} from "@/lib/aboutHeroLayout";
import { excerptBody, formatRelativeEn } from "../lib/aboutAdminUtils";
import type { AdminAboutRow } from "../types/aboutAdmin.types";

type AboutEditorialPreviewProps = {
  record: AdminAboutRow;
  coreValuesList: string[];
  onEdit: () => void;
  onOpenLightbox: (src: string, isVideo: boolean) => void;
};

export function AboutEditorialPreview({
  record,
  coreValuesList,
  onEdit,
  onOpenLightbox,
}: AboutEditorialPreviewProps) {
  const heroIsVideo = isAboutHeroVideoDisplay({
    heroMediaType: record.heroMediaType,
    imageUrl: record.imageUrl,
  });

  return (
    <div className="grid gap-0 lg:grid-cols-12">
      <div className="shamell-glass-surface relative flex min-h-[200px] items-center justify-center p-6 lg:col-span-5 lg:min-h-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(197,165,90,0.14),transparent_55%)]" />
        {record.imageUrl ? (
          <div className="relative z-10 flex w-full max-w-52 flex-col items-center gap-2">
            <p className="font-brand text-[9px] uppercase tracking-[0.16em] text-gold/60">Hero preview</p>
            {heroIsVideo ? (
              <>
                <div
                  className={aboutHeroVideoCardClassName({
                    variant: "preview",
                    className:
                      "border-gold/25 bg-[#080a0e] shadow-lg ring-1 ring-gold/10 hover:border-gold/25 hover:shadow-lg",
                  })}
                >
                  <div className={aboutHeroMediaFrameClassName("relative bg-[#080a0e]")}>
                    <video
                      src={record.imageUrl}
                      className={aboutHeroMediaClassName()}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="font-body text-[10px] text-gold/55">Video — use controls to play</span>
                  <button
                    type="button"
                    onClick={() => onOpenLightbox(record.imageUrl!, true)}
                    className="font-brand text-[10px] tracking-[0.12em] text-gold/80 underline decoration-gold/35 underline-offset-2 transition hover:text-gold"
                  >
                    Open full view
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenLightbox(record.imageUrl!, false)}
                  className="group relative w-full max-w-52 shrink-0 overflow-hidden rounded-xl border border-gold/25 bg-[#080a0e] shadow-lg ring-1 ring-gold/10 transition hover:border-gold/40"
                  aria-label="View enlarged photo"
                >
                  <div className="relative aspect-square w-full">
                    <Image
                      src={record.imageUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-contain p-1 transition duration-500 group-hover:opacity-95"
                      sizes="208px"
                    />
                  </div>
                </button>
                <span className="font-body text-[10px] text-gold/55">Image · Tap to enlarge</span>
              </>
            )}
          </div>
        ) : (
          <div className="shamell-glass-surface relative z-10 flex w-full max-w-52 flex-col items-center justify-center rounded-xl border border-dashed border-gold/25 px-6 py-12 text-center">
            <ImageIcon className="h-8 w-8 text-gold/30" strokeWidth={1.2} />
            <p className="mt-2 font-body text-xs text-foreground/45">No photo or video</p>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center border-t border-gold/10 p-6 md:p-8 lg:col-span-7 lg:border-l lg:border-t-0 lg:border-gold/10">
        <p className="font-brand text-[10px] tracking-[0.28em] text-gold/70">ON-SITE TITLE</p>
        <h3 className="mt-2 font-brand text-2xl tracking-[0.06em] text-gold md:text-3xl">{record.title}</h3>

        <div className="shamell-glass-surface mt-6 flex items-start gap-3 rounded-xl p-4">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gold/50" strokeWidth={1.4} />
          <p className="font-body text-sm leading-relaxed text-foreground/70">
            {excerptBody(record.paragraph1, 420) || "—"}
          </p>
        </div>

        {coreValuesList.length > 0 ? (
          <div className="mt-6">
            <p className="mb-2 flex items-center gap-2 font-brand text-[10px] tracking-[0.2em] text-gold/70">
              <Heart className="h-3.5 w-3.5" strokeWidth={1.5} />
              VALORES
            </p>
            <div className="flex flex-wrap gap-2">
              {coreValuesList.map((v, index) => (
                <span
                  key={`${index}-${v}`}
                  className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 font-body text-xs text-gold/90"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gold/10 pt-6">
          <p className="font-body text-xs text-foreground/45">
            Last edited: {formatRelativeEn(record.updatedAt)}
          </p>
          <button
            type="button"
            onClick={onEdit}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gold/35 bg-gold/12 px-5 py-2.5 font-brand text-xs tracking-[0.12em] text-gold transition hover:bg-gold/20"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
            Edit block
          </button>
        </div>
      </div>
    </div>
  );
}
