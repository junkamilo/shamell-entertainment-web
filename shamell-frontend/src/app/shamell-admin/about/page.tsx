"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  FileText,
  Heart,
  Image as ImageIcon,
  Pencil,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import { AdminMediaPickControl } from "@/components/admin/AdminMediaPickControl";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import { isAboutHeroVideoDisplay } from "@/lib/aboutHeroMedia";
import { toast } from "@/hooks/use-toast";

type AdminAboutRow = {
  id: string;
  title: string;
  paragraph1: string;
  coreValues: string[];
  imageUrl: string | null;
  heroMediaType?: "IMAGE" | "VIDEO";
  updatedAt?: string;
};

function excerptBody(text: string, max = 220): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const oneLine = firstLine.trim().replace(/\s+/g, " ");
  if (!oneLine) return "";
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

function formatRelativeEn(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

type AboutHeroPreviewCardProps = {
  src: string;
  isVideo: boolean;
  badge: string;
  onRemove: () => void;
  removeDisabled?: boolean;
  removeBusy?: boolean;
  removeAriaLabel: string;
  onExpand: () => void;
};

function AboutHeroPreviewCard({
  src,
  isVideo,
  badge,
  onRemove,
  removeDisabled,
  removeBusy,
  removeAriaLabel,
  onExpand,
}: AboutHeroPreviewCardProps) {
  return (
    <div className="relative flex w-38 shrink-0 flex-col gap-1 rounded-xl border border-gold/22 bg-black/25 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-gold/10">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        disabled={removeDisabled}
        className="absolute right-1 top-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-red-500/35 bg-black/70 text-red-200/95 shadow-md backdrop-blur-sm transition hover:border-red-400/55 hover:bg-red-950/45 hover:text-red-50 disabled:cursor-not-allowed disabled:opacity-45"
        aria-label={removeAriaLabel}
      >
        {removeBusy ? (
          <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-red-200/80" aria-hidden />
        ) : (
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
      </button>
      <p className="pr-9 font-brand text-[9px] uppercase leading-tight tracking-[0.14em] text-gold/65">{badge}</p>
      <button
        type="button"
        onClick={onExpand}
        className="group relative aspect-square w-full overflow-hidden rounded-lg bg-[#080a0e] ring-1 ring-gold/12"
        aria-label="View full size"
      >
        {isVideo ? (
          <video
            src={src}
            className="h-full w-full object-contain p-1 transition group-hover:opacity-95"
            muted
            playsInline
            loop
            autoPlay
            preload="metadata"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt=""
            className="h-full w-full object-contain p-1 transition group-hover:opacity-95"
          />
        )}
      </button>
    </div>
  );
}

export default function ShamellAdminAboutPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );
  const [record, setRecord] = useState<AdminAboutRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteHeroConfirmOpen, setIsDeleteHeroConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingHero, setIsDeletingHero] = useState(false);

  const [title, setTitle] = useState("ABOUT SHAMELL");
  const [paragraph1, setParagraph1] = useState("");
  const [coreValuesText, setCoreValuesText] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingHeroMediaType, setExistingHeroMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPreviewLightboxOpen, setIsPreviewLightboxOpen] = useState(false);
  const [lightboxDisplay, setLightboxDisplay] = useState<{ src: string; isVideo: boolean } | null>(null);
  const [lightboxPortalReady, setLightboxPortalReady] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    if (!imagePreviewUrl) return;
    return () => URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  useEffect(() => {
    setLightboxPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isPreviewLightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isPreviewLightboxOpen]);

  const closeHeroLightbox = useCallback((instant?: boolean) => {
    if (instant === true) {
      setIsPreviewLightboxOpen(false);
      setLightboxDisplay(null);
      return;
    }
    setIsPreviewLightboxOpen(false);
  }, []);

  const openHeroLightbox = useCallback((src: string, isVideo: boolean) => {
    setLightboxDisplay({ src, isVideo });
    setIsPreviewLightboxOpen(true);
  }, []);

  const parseErrorMessage = useCallback((data: unknown, fallback: string) => {
    if (typeof data !== "object" || data === null) return fallback;
    const payload = data as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message ?? fallback;
  }, []);

  const loadAboutContent = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/about/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not load About Shamell."),
        });
        return;
      }

      if (data && typeof data === "object" && "id" in data && typeof (data as AdminAboutRow).title === "string") {
        const row = data as AdminAboutRow;
        setRecord({
          ...row,
          heroMediaType: row.heroMediaType === "VIDEO" ? "VIDEO" : "IMAGE",
        });
      } else {
        setRecord(null);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, parseErrorMessage]);

  useEffect(() => {
    void loadAboutContent();
  }, [loadAboutContent]);

  const coreValuesList = record?.coreValues ?? [];
  const stats = useMemo(() => {
    if (!record) {
      return {
        state: "Not published",
        values: "—",
        media: "—",
        updated: "—",
      };
    }
    return {
      state: "Published",
      values: String(record.coreValues?.length ?? 0),
      media:
        record.imageUrl == null
          ? "No"
          : isAboutHeroVideoDisplay({
              heroMediaType: record.heroMediaType,
              imageUrl: record.imageUrl,
            })
            ? "Video"
            : "Photo",
      updated: formatRelativeEn(record.updatedAt),
    };
  }, [record]);

  const syncFormFromRecord = useCallback((row: AdminAboutRow | null) => {
    if (row) {
      setTitle(row.title ?? "ABOUT SHAMELL");
      setParagraph1(row.paragraph1 ?? "");
      setCoreValuesText(Array.isArray(row.coreValues) ? row.coreValues.join("\n") : "");
      setExistingImageUrl(row.imageUrl ?? null);
      setExistingHeroMediaType(row.heroMediaType === "VIDEO" ? "VIDEO" : "IMAGE");
    } else {
      setTitle("ABOUT SHAMELL");
      setParagraph1("");
      setCoreValuesText("");
      setExistingImageUrl(null);
      setExistingHeroMediaType("IMAGE");
    }
    setImageFile(null);
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
  }, []);

  const openAboutModal = () => {
    syncFormFromRecord(record);
    closeHeroLightbox(true);
    setIsModalOpen(true);
  };

  const closeAboutModal = () => {
    setIsModalOpen(false);
    setIsDeleteHeroConfirmOpen(false);
    closeHeroLightbox(true);
    setImageFile(null);
    setIsDeletingHero(false);
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
  };

  const deleteSavedHeroMedia = useCallback(async () => {
    if (!existingImageUrl && !record?.imageUrl) return;

    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    setIsDeletingHero(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/about/admin/media`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Could not remove media",
          description: parseErrorMessage(data, "Check Cloudinary configuration or try again."),
        });
        return;
      }

      setExistingImageUrl(null);
      setExistingHeroMediaType("IMAGE");
      closeHeroLightbox(true);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";

      toast({
        title: "Hero media removed",
        description: "You can upload a new image or video when you are ready.",
      });
      setIsDeleteHeroConfirmOpen(false);
      await loadAboutContent();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsDeletingHero(false);
    }
  }, [
    apiBaseUrl,
    closeHeroLightbox,
    existingImageUrl,
    loadAboutContent,
    parseErrorMessage,
    record?.imageUrl,
  ]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Sign-in required",
        description: "You must sign in as an admin.",
      });
      return;
    }

    const values = coreValuesText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!title.trim() || !paragraph1.trim() || values.length === 0) {
      toast({
        variant: "destructive",
        title: "Check the form",
        description: "Fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const body = new FormData();
      body.append("title", title.trim());
      body.append("paragraph1", paragraph1.replace(/^\s+|\s+$/g, ""));
      values.forEach((value) => body.append("coreValues", value));
      if (imageFile) body.append("media", imageFile);

      const response = await fetch(`${apiBaseUrl}/api/v1/about/admin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(data, "Could not save About Shamell."),
        });
        return;
      }

      toast({
        title: record ? "About updated" : "About created",
        description: "About Shamell content was saved successfully.",
      });
      closeAboutModal();
      await loadAboutContent();
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="About Shamell"
        actionLabel={record ? "Edit content" : "Create content"}
        onAction={openAboutModal}
        bordered={false}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-4">
        {(
          [
            ["ESTADO", stats.state],
            ["VALORES", stats.values],
            ["PHOTO / VIDEO", stats.media],
            ["LAST UPDATED", stats.updated],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="shamell-glass-surface rounded-xl px-4 py-3"
          >
            <p className="font-brand text-[10px] tracking-[0.18em] text-gold/75">{label}</p>
            <p className="mt-1 truncate font-brand text-lg tracking-wide text-gold md:text-xl">{value}</p>
          </div>
        ))}
      </div>

      <section className="shamell-glass-surface overflow-hidden rounded-2xl border border-gold/14">
        <div className="border-b border-gold/12 bg-linear-to-r from-gold/10 via-transparent to-transparent px-5 py-4 md:px-8 md:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold/80" strokeWidth={1.4} />
              <h2 className="font-brand text-sm tracking-[0.16em] text-gold">Editorial preview</h2>
            </div>
            {isLoading ? <p className="text-xs text-foreground/55">Loading…</p> : null}
          </div>
        </div>

        {!record && !isLoading ? (
          <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center md:py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
              <FileText className="h-8 w-8 text-gold/75" strokeWidth={1.2} />
            </div>
            <div className="max-w-md">
              <p className="font-brand text-lg tracking-[0.08em] text-gold">No About block yet</p>
              <p className="mt-2 font-body text-sm leading-relaxed text-foreground/55">
                Use “Create About Shamell” to publish the block on the home page.
              </p>
            </div>
            <button
              type="button"
              onClick={openAboutModal}
              className="rounded-xl border border-gold/40 bg-gold/15 px-8 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25"
            >
              Create About Shamell
            </button>
          </div>
        ) : null}

        {record ? (
          <div className="grid gap-0 lg:grid-cols-12">
            <div className="shamell-glass-surface relative flex min-h-[200px] items-center justify-center p-6 lg:col-span-5 lg:min-h-0">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(197,165,90,0.14),transparent_55%)]" />
              {record.imageUrl ? (
                <div className="relative z-10 flex w-full max-w-52 flex-col items-center gap-2">
                  <p className="font-brand text-[9px] uppercase tracking-[0.16em] text-gold/60">Hero preview</p>
                  {isAboutHeroVideoDisplay({
                    heroMediaType: record.heroMediaType,
                    imageUrl: record.imageUrl,
                  }) ? (
                    <>
                      <div className="w-full overflow-hidden rounded-xl border border-gold/25 bg-[#080a0e] shadow-lg ring-1 ring-gold/10">
                        <div className="relative aspect-video w-full min-h-30">
                          <video
                            src={record.imageUrl}
                            className="absolute inset-0 h-full w-full object-contain"
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
                          onClick={() =>
                            openHeroLightbox(
                              record.imageUrl!,
                              true,
                            )
                          }
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
                        onClick={() =>
                          openHeroLightbox(
                            record.imageUrl!,
                            false,
                          )
                        }
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
                  onClick={openAboutModal}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gold/35 bg-gold/12 px-5 py-2.5 font-brand text-xs tracking-[0.12em] text-gold transition hover:bg-gold/20"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  Edit block
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <AdminModal
        title={record ? "Edit About Shamell" : "Create About Shamell"}
        isOpen={isModalOpen}
        onClose={closeAboutModal}
      >
        <form id="about-shamell-form" onSubmit={onSubmit} className="space-y-5">
          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TITLE</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none focus:border-gold"
            />
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TEXTO PRINCIPAL</span>
            <textarea
              value={paragraph1}
              onChange={(event) => setParagraph1(event.target.value)}
              rows={8}
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            />
          </label>

          <label className="block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">VALUES (ONE PER LINE)</span>
            <textarea
              value={coreValuesText}
              onChange={(event) => setCoreValuesText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
              placeholder={"Profesionalismo\nExcelencia\nAutenticidad"}
            />
          </label>

          <label className="block">
            <span className="flex flex-wrap items-center gap-2 font-brand text-[11px] tracking-[0.2em] text-gold/95">
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} aria-hidden />
                <Video className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} aria-hidden />
              </span>
              ABOUT IMAGE OR VIDEO
            </span>
            <AdminMediaPickControl
              ref={imageFileInputRef}
              accept="image/*,video/*"
              onFileChange={(file) => setImageFile(file)}
              disabled={isSubmitting || isDeletingHero}
              selectedFileName={imageFile?.name ?? null}
            />
            {!record ? (
              <p className="mt-2 font-body text-[11px] text-foreground/45">
                First publish requires a hero file: any common image format, or video (e.g. MP4, WebM, MOV). Max
                100&nbsp;MB. The public About section will show it automatically as photo or video.
              </p>
            ) : (
              <p className="mt-2 font-body text-[11px] text-foreground/45">
                Optional: upload a new image or video to replace the current hero (same field as when you first
                published).
              </p>
            )}
          </label>

          {imagePreviewUrl || existingImageUrl ? (
            <div className="shamell-glass-surface rounded-xl border border-gold/15 p-4">
              <p className="mb-3 text-center font-brand text-[10px] tracking-[0.18em] text-gold/70 sm:text-left">
                HERO MEDIA
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
                {existingImageUrl && imagePreviewUrl ? (
                  <>
                    <AboutHeroPreviewCard
                      src={existingImageUrl}
                      isVideo={isAboutHeroVideoDisplay({
                        heroMediaType: existingHeroMediaType,
                        imageUrl: existingImageUrl,
                      })}
                      badge="Live on site"
                      onRemove={() => setIsDeleteHeroConfirmOpen(true)}
                      removeDisabled={isDeletingHero || isSubmitting}
                      removeBusy={isDeletingHero}
                      removeAriaLabel="Remove published hero from Cloudinary and database"
                      onExpand={() =>
                        openHeroLightbox(
                          existingImageUrl,
                          isAboutHeroVideoDisplay({
                            heroMediaType: existingHeroMediaType,
                            imageUrl: existingImageUrl,
                          }),
                        )
                      }
                    />
                    <AboutHeroPreviewCard
                      src={imagePreviewUrl}
                      isVideo={isAboutHeroVideoDisplay({ file: imageFile })}
                      badge="New file (not saved)"
                      onRemove={() => {
                        setImageFile(null);
                        if (imageFileInputRef.current) imageFileInputRef.current.value = "";
                        closeHeroLightbox();
                      }}
                      removeDisabled={isSubmitting || isDeletingHero}
                      removeAriaLabel="Discard selected file"
                      onExpand={() =>
                        openHeroLightbox(
                          imagePreviewUrl,
                          isAboutHeroVideoDisplay({ file: imageFile }),
                        )
                      }
                    />
                  </>
                ) : existingImageUrl ? (
                  <AboutHeroPreviewCard
                    src={existingImageUrl}
                    isVideo={isAboutHeroVideoDisplay({
                      heroMediaType: existingHeroMediaType,
                      imageUrl: existingImageUrl,
                    })}
                    badge="Live on site"
                    onRemove={() => setIsDeleteHeroConfirmOpen(true)}
                    removeDisabled={isDeletingHero || isSubmitting}
                    removeBusy={isDeletingHero}
                    removeAriaLabel="Remove published hero from Cloudinary and database"
                    onExpand={() =>
                      openHeroLightbox(
                        existingImageUrl,
                        isAboutHeroVideoDisplay({
                          heroMediaType: existingHeroMediaType,
                          imageUrl: existingImageUrl,
                        }),
                      )
                    }
                  />
                ) : imagePreviewUrl ? (
                  <AboutHeroPreviewCard
                    src={imagePreviewUrl}
                    isVideo={isAboutHeroVideoDisplay({ file: imageFile })}
                    badge="New file"
                    onRemove={() => {
                      setImageFile(null);
                      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
                      closeHeroLightbox();
                    }}
                    removeDisabled={isSubmitting || isDeletingHero}
                    removeAriaLabel="Discard selected file"
                    onExpand={() =>
                      openHeroLightbox(
                        imagePreviewUrl,
                        isAboutHeroVideoDisplay({ file: imageFile }),
                      )
                    }
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeAboutModal}
              className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDeletingHero}
              className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        title="Remove hero media?"
        isOpen={isDeleteHeroConfirmOpen}
        onClose={() => {
          if (!isDeletingHero) setIsDeleteHeroConfirmOpen(false);
        }}
      >
        <div className="space-y-5">
          <p className="font-body text-sm leading-relaxed text-foreground/75">
            Remove the current hero photo or video? It will be deleted from Cloudinary and from the site. You can
            upload a new file afterward.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isDeletingHero}
              onClick={() => setIsDeleteHeroConfirmOpen(false)}
              className="rounded-md border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 transition hover:border-gold/35 hover:text-gold disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="button"
              disabled={isDeletingHero}
              onClick={() => void deleteSavedHeroMedia()}
              className="rounded-md border border-red-400/45 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeletingHero ? "REMOVING…" : "REMOVE"}
            </button>
          </div>
        </div>
      </AdminModal>

      {lightboxPortalReady
        ? createPortal(
            <AnimatePresence onExitComplete={() => setLightboxDisplay(null)}>
              {isPreviewLightboxOpen && lightboxDisplay ? (
                <motion.div
                  key={`${lightboxDisplay.src}-${lightboxDisplay.isVideo ? "v" : "i"}`}
                  className="admin-theme fixed inset-0 z-190 flex items-center justify-center bg-black/88 px-4 py-8 backdrop-blur-sm"
                  role="presentation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => closeHeroLightbox()}
                >
                  <motion.div
                    className="relative w-full max-w-5xl rounded-2xl border border-gold/30 bg-[#0a0d12] p-3 shadow-2xl ring-1 ring-gold/10"
                    initial={{ opacity: 0, scale: 0.9, y: 28 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: { type: "spring", damping: 26, stiffness: 320, mass: 0.88 },
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.96,
                      y: 14,
                      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <motion.button
                      type="button"
                      onClick={() => closeHeroLightbox()}
                      className="shamell-glass-surface absolute right-3 top-3 z-10 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
                      aria-label="Close preview"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        transition: { delay: 0.08, type: "spring", stiffness: 400, damping: 22 },
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                    <motion.div
                      className="pt-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: 0.06, duration: 0.26, ease: [0.22, 1, 0.36, 1] },
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    >
                      {lightboxDisplay.isVideo ? (
                        <video
                          src={lightboxDisplay.src}
                          className="max-h-[82vh] w-full rounded-xl object-contain"
                          controls
                          playsInline
                          preload="metadata"
                          aria-label="Expanded About view"
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={lightboxDisplay.src}
                          alt="Expanded About view"
                          className="max-h-[82vh] w-full rounded-xl object-contain"
                        />
                      )}
                    </motion.div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
