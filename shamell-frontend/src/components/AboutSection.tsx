"use client";

import Image from "next/image";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import portrait from "@/assets/gallery-2.jpg";
import OrnamentDivider from "./OrnamentDivider";
import RevealOnView from "@/components/shared/RevealOnView";
import { useAboutContent } from "@/hooks/use-about-content";
import { inferAboutHeroIsVideo } from "@/lib/aboutHeroMedia";
import { splitAboutParagraphs } from "@/lib/aboutParagraphs";
import { cn } from "@/lib/utils";

function aboutPrefetchRootMarginPx(): string {
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 900;
  return `${Math.round(viewportHeight * 1.2)}px 0px 0px 0px`;
}

type AboutHeroVideoProps = {
  src: string;
  poster: string | null;
};

function AboutHeroVideo({ src, poster }: AboutHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const section = document.getElementById("about");
    if (!section) return;

    const prefetchObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setShouldLoad(true);
      },
      { rootMargin: aboutPrefetchRootMarginPx(), threshold: 0 },
    );

    const playbackObserver = new IntersectionObserver(
      ([entry]) => {
        setIsInView(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.25 },
    );

    prefetchObserver.observe(section);
    playbackObserver.observe(section);

    return () => {
      prefetchObserver.disconnect();
      playbackObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;
    video.preload = "auto";
    video.load();
  }, [shouldLoad, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    if (isInView) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isInView, shouldLoad]);

  const onCanPlay = useCallback(() => setIsBuffering(false), []);
  const onWaiting = useCallback(() => setIsBuffering(true), []);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    const video = videoRef.current;
    if (video?.paused) void video.play().catch(() => undefined);
  };

  return (
    <div className="absolute inset-0">
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          className={cn(
            "object-contain object-center p-3 transition-opacity duration-500 sm:p-4",
            shouldLoad && !isBuffering ? "opacity-0" : "opacity-100",
          )}
          sizes="(max-width: 1024px) 100vw, 40vw"
          aria-hidden
          unoptimized
        />
      ) : null}

      {shouldLoad ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster ?? undefined}
          className={cn(
            "absolute inset-0 h-full w-full object-contain object-center p-3 transition-opacity duration-500 sm:p-4",
            isBuffering ? "opacity-0" : "opacity-100",
          )}
          playsInline
          loop
          preload="auto"
          onCanPlay={onCanPlay}
          onPlaying={onCanPlay}
          onWaiting={onWaiting}
          aria-label="Video about Shamell"
        />
      ) : null}

      {shouldLoad && isBuffering ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold/70" strokeWidth={1.5} aria-hidden />
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute video" : "Mute video"}
        aria-pressed={isMuted}
        className="absolute bottom-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-gold backdrop-blur-sm transition hover:border-gold/45 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 sm:bottom-6 sm:right-6"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        ) : (
          <Volume2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        )}
      </button>
    </div>
  );
}

const AboutSection = () => {
  const { about, isLoading } = useAboutContent();
  const bodyParagraphs = splitAboutParagraphs(about.paragraph1);
  const heroIsVideo = inferAboutHeroIsVideo({
    heroMediaType: about.heroMediaType,
    imageUrl: about.imageUrl,
  });
  const heroVideoSrc = useMemo(
    () => about.videoDeliveryUrl ?? about.imageUrl,
    [about.videoDeliveryUrl, about.imageUrl],
  );

  return (
    <section id="about" className="bg-transparent px-4 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <RevealOnView className="relative mb-12 text-center md:mb-16" delay={40}>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-36 w-[min(28rem,94vw)] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(197,165,90,0.08),transparent_72%)] blur-3xl opacity-80" />
          </div>
          <div className="relative">
            <h2 className="font-brand text-2xl font-semibold tracking-[0.14em] text-gold md:text-4xl md:tracking-[0.16em]">
              {about.title}
            </h2>
            <div
              className="mx-auto mt-5 h-px w-20 max-w-48 bg-linear-to-r from-transparent via-white/25 to-transparent"
              aria-hidden
            />
          </div>
        </RevealOnView>

        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-14">
          <RevealOnView className="lg:col-span-5" delay={80} amount={0.18}>
            <div
              className={cn(
                "group/portrait relative aspect-3/4 w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_center,rgba(32,28,24,1)_0%,#060606_70%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_48px_rgba(0,0,0,0.45)] transition-[border-color,box-shadow] duration-500",
                "hover:border-white/16 hover:shadow-[0_22px_56px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]",
                isLoading && "animate-pulse",
              )}
            >
              {!isLoading ? (
                <>
                  {heroVideoSrc && heroIsVideo ? (
                    <AboutHeroVideo src={heroVideoSrc} poster={about.videoPosterUrl} />
                  ) : (
                    <Image
                      src={about.imageUrl ?? portrait}
                      alt="Professional portrait of Shamell"
                      fill
                      className="object-contain object-center p-3 transition-transform duration-700 ease-out group-hover/portrait:scale-[1.02] sm:p-4"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      priority={false}
                    />
                  )}
                  <span
                    className="pointer-events-none absolute left-3 top-3 h-6 w-6 border-l border-t border-white/18 opacity-70"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 border-r border-b border-white/14 opacity-60"
                    aria-hidden
                  />
                </>
              ) : (
                <div className="absolute inset-0 bg-white/4" aria-hidden />
              )}
            </div>
          </RevealOnView>

          <RevealOnView className="flex flex-col justify-center lg:col-span-7" delay={180} amount={0.18}>
            <div className="mb-10 space-y-6">
              {bodyParagraphs.map((block, index) => (
                <p
                  key={`${index}-${block.slice(0, 24)}`}
                  className={cn(
                    "font-body leading-relaxed transition-colors duration-300",
                    index === 0
                      ? "text-base font-semibold text-foreground/90 md:text-lg md:leading-[1.75]"
                      : "text-base font-semibold leading-relaxed text-foreground/85 md:text-lg md:leading-relaxed md:text-foreground/88",
                  )}
                >
                  {block}
                </p>
              ))}
            </div>

            <div>
              <h3 className="mb-2 font-brand text-sm font-semibold tracking-[0.2em] text-gold md:text-base md:tracking-[0.22em]">
                CORE VALUES
              </h3>
              <div
                className="mb-6 h-px w-14 bg-linear-to-r from-white/40 to-transparent md:w-16"
                aria-hidden
              />
              <div className="flex flex-wrap gap-2.5 md:gap-3">
                {about.coreValues.map((value, index) => (
                  <span
                    key={`${value}-${index}`}
                    className={cn(
                      "group/chip relative overflow-hidden rounded-xl border border-white/12 bg-black/35 px-3.5 py-2 font-brand text-xs font-semibold tracking-[0.14em] text-gold uppercase backdrop-blur-[2px] transition-all duration-300 md:px-4 md:text-sm md:tracking-[0.16em]",
                      "before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(105deg,transparent,rgba(255,255,255,0.08),transparent)] before:transition-transform before:duration-500",
                      "hover:-translate-y-0.5 hover:border-white/22 hover:text-gold-light motion-reduce:hover:translate-y-0",
                      "hover:before:translate-x-full",
                    )}
                  >
                    <span className="relative z-10">{value}</span>
                  </span>
                ))}
              </div>
            </div>
          </RevealOnView>
        </div>

        <OrnamentDivider className="mt-14 md:mt-16" />
      </div>
    </section>
  );
};

export default AboutSection;
