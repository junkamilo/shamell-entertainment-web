"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Heart,
  Image as ImageIcon,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminModal from "@/components/admin/AdminModal";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
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

function isAboutHeroVideo(
  heroMediaType: string | null | undefined,
  url: string | null | undefined,
  file: File | null,
): boolean {
  if (file?.type.startsWith("video/")) return true;
  if (heroMediaType === "VIDEO") return true;
  const u = url ?? "";
  return u.includes("/video/upload/");
}

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

export default function ShamellAdminAboutPage() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );
  const [record, setRecord] = useState<AdminAboutRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("ABOUT SHAMELL");
  const [paragraph1, setParagraph1] = useState("");
  const [coreValuesText, setCoreValuesText] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingHeroMediaType, setExistingHeroMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPreviewLightboxOpen, setIsPreviewLightboxOpen] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    if (!imagePreviewUrl) return;
    return () => URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

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
          : record.heroMediaType === "VIDEO" || isAboutHeroVideo(record.heroMediaType, record.imageUrl, null)
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
    setIsPreviewLightboxOpen(false);
    setIsModalOpen(true);
  };

  const closeAboutModal = () => {
    setIsModalOpen(false);
    setIsPreviewLightboxOpen(false);
    setImageFile(null);
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
  };

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
      if (imageFile) body.append("image", imageFile);

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

  const lightboxSrc = imagePreviewUrl ?? existingImageUrl ?? record?.imageUrl ?? "";
  const lightboxHeroType = imageFile
    ? undefined
    : existingImageUrl
      ? existingHeroMediaType
      : record?.heroMediaType;
  const lightboxIsVideo = isAboutHeroVideo(lightboxHeroType, lightboxSrc, imageFile);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminModuleHero
        title="About Shamell"
        actionLabel={record ? "Edit content" : "Create content"}
        onAction={openAboutModal}
        bordered={false}
      />

      <div className="mb-6 flex flex-wrap justify-end gap-3">
        <Link
          href="/#about"
          className="shamell-glass-surface inline-flex items-center gap-2 rounded-full border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold/90 transition hover:border-gold/45 hover:bg-gold/10"
        >
          View on site
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Link>
      </div>

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
            <div className="shamell-glass-surface relative flex min-h-[280px] items-stretch justify-center p-6 lg:col-span-5 lg:min-h-[420px]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(197,165,90,0.14),transparent_55%)]" />
              {record.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setIsPreviewLightboxOpen(true)}
                  className="group relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-gold/25 shadow-2xl"
                  aria-label="View enlarged photo or video"
                >
                  <div className="relative aspect-4/5 w-full">
                    {isAboutHeroVideo(record.heroMediaType, record.imageUrl, null) ? (
                      <video
                        src={record.imageUrl}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        muted
                        playsInline
                        loop
                        autoPlay
                        preload="metadata"
                        aria-hidden
                      />
                    ) : (
                      <Image
                        src={record.imageUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 40vw"
                      />
                    )}
                  </div>
                  <span className="shamell-glass-surface absolute bottom-3 left-3 rounded-full border border-gold/30 px-3 py-1 font-body text-[10px] text-gold/90">
                    {isAboutHeroVideo(record.heroMediaType, record.imageUrl, null) ? "About video" : "About image"}
                  </span>
                </button>
              ) : (
                <div className="shamell-glass-surface relative z-10 flex w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-dashed border-gold/25 px-8 py-16 text-center">
                  <ImageIcon className="h-10 w-10 text-gold/30" strokeWidth={1.2} />
                  <p className="mt-3 font-body text-sm text-foreground/45">No photo or video in this block</p>
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
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">ABOUT PHOTO OR VIDEO</span>
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-foreground outline-none file:mr-3 file:border-0 file:bg-gold/20 file:px-3 file:py-1 file:text-gold"
            />
            {!record ? (
              <p className="mt-2 font-body text-[11px] text-foreground/45">
                The first publish requires an image or video (MP4, WebM, or MOV recommended; max 100&nbsp;MB).
              </p>
            ) : (
              <p className="mt-2 font-body text-[11px] text-foreground/45">
                Optional: replace the current About block photo or video.
              </p>
            )}
          </label>

          {imagePreviewUrl || existingImageUrl ? (
            <div className="shamell-glass-surface rounded-xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-gold/85">
                  {imagePreviewUrl
                    ? isAboutHeroVideo(undefined, null, imageFile)
                      ? "Preview of selected video"
                      : "Preview of selected image"
                    : isAboutHeroVideo(existingHeroMediaType, existingImageUrl, null)
                      ? "Current About video"
                      : "Current About image"}
                </p>
                {imagePreviewUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setIsPreviewLightboxOpen(false);
                      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
                    }}
                    className="rounded-full border border-gold/30 p-1 text-gold/85 transition hover:bg-gold/10 hover:text-gold"
                    aria-label="Remove selected file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <div className="shamell-glass-surface overflow-hidden rounded-lg p-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewLightboxOpen(true)}
                  className="block w-full"
                  aria-label="Open enlarged preview"
                >
                  {isAboutHeroVideo(
                    imageFile ? undefined : existingHeroMediaType,
                    imagePreviewUrl ?? existingImageUrl,
                    imageFile,
                  ) ? (
                    <video
                      src={imagePreviewUrl ?? existingImageUrl ?? ""}
                      className="h-44 w-full rounded-md object-cover transition hover:opacity-90"
                      muted
                      playsInline
                      loop
                      autoPlay
                      preload="metadata"
                      aria-label="About preview"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imagePreviewUrl ?? existingImageUrl ?? ""}
                      alt="About preview"
                      className="h-44 w-full rounded-md object-cover transition hover:opacity-90"
                    />
                  )}
                </button>
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
              disabled={isSubmitting}
              className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </AdminModal>

      {isPreviewLightboxOpen && lightboxSrc ? (
        <div
          className="fixed inset-0 z-95 flex items-center justify-center bg-black/85 px-4 py-8"
          onClick={() => setIsPreviewLightboxOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl border border-gold/30 bg-[#0a0d12] p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPreviewLightboxOpen(false)}
              className="shamell-glass-surface absolute right-3 top-3 z-10 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            {lightboxIsVideo ? (
              <video
                src={lightboxSrc}
                className="max-h-[82vh] w-full rounded-xl object-contain"
                controls
                playsInline
                preload="metadata"
                aria-label="Expanded About view"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={lightboxSrc}
                alt="Expanded About view"
                className="max-h-[82vh] w-full rounded-xl object-contain"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
