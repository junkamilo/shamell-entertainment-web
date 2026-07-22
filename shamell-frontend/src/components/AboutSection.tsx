"use client";

import Image from "next/image";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import portrait from "@/assets/gallery-2.jpg";
import OrnamentDivider from "./OrnamentDivider";
import RevealOnView from "@/components/shared/RevealOnView";
import type { AboutContentItem } from "@/lib/aboutContent";
import { useAboutContent } from "@/hooks/use-about-content";
import { inferAboutHeroIsVideo } from "@/lib/aboutHeroMedia";
import {
  aboutHeroImageCardClassName,
  aboutHeroMediaClassName,
  aboutHeroMediaFrameClassName,
  aboutHeroVideoCardClassName,
} from "@/lib/aboutHeroLayout";
import { prefetchAboutHeroVideo } from "@/lib/aboutMediaPreload";
import { splitAboutParagraphs } from "@/lib/aboutParagraphs";
import { cn } from "@/lib/utils";

const VIDEO_LOAD_TIMEOUT_MS = 10_000;
const ABOUT_NEAR_VIEW_ROOT_MARGIN = "320px 0px";

type AboutHeroVideoProps = {
  src: string;
  poster: string | null;
};

function AboutHeroPosterFallback() {
  return (
    <div className="absolute inset-0">
      <Image
        src={portrait}
        alt=""
        fill
        className={aboutHeroMediaClassName()}
        sizes="(max-width: 1024px) 100vw, 40vw"
        aria-hidden
      />
    </div>
  );
}

function AboutHeroVideo({ src, poster }: AboutHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isNearView, setIsNearView] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const showVideo = !prefersReducedMotion && isNearView;
  const posterSrc = poster && !posterFailed ? poster : null;
  const posterVisible = !showVideo || isBuffering || !posterSrc;

  useEffect(() => {
    setPosterFailed(false);
    setIsBuffering(false);
    setLoadTimedOut(false);
  }, [poster, src]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const section = document.getElementById("about");
    if (!section) return;

    const nearObserver = new IntersectionObserver(
      ([entry]) => setIsNearView(Boolean(entry?.isIntersecting)),
      { rootMargin: ABOUT_NEAR_VIEW_ROOT_MARGIN, threshold: 0 },
    );
    const playbackObserver = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.25 },
    );

    nearObserver.observe(section);
    playbackObserver.observe(section);
    return () => {
      nearObserver.disconnect();
      playbackObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isNearView || prefersReducedMotion) return;
    return prefetchAboutHeroVideo(src);
  }, [isNearView, prefersReducedMotion, src]);

  useEffect(() => {
    if (!showVideo) return;
    setIsBuffering(true);
  }, [showVideo, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion || !showVideo) return;

    if (isInView) {
      video.preload = "auto";
      void video.play().then(() => setNeedsTapToPlay(false)).catch(() => {
        setNeedsTapToPlay(true);
      });
    } else {
      video.pause();
      video.preload = "metadata";
    }
  }, [isInView, prefersReducedMotion, showVideo, src]);

  useEffect(() => {
    if (!showVideo || !isBuffering) {
      setLoadTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => {
      if (isBuffering) setLoadTimedOut(true);
    }, VIDEO_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isBuffering, showVideo, src]);

  const updateBufferProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      setBufferProgress(0);
      return;
    }
    const end = video.buffered.length
      ? video.buffered.end(video.buffered.length - 1)
      : 0;
    setBufferProgress(Math.min(100, Math.round((end / video.duration) * 100)));
  }, []);

  const onCanPlay = useCallback(() => {
    setIsBuffering(false);
    setLoadTimedOut(false);
    updateBufferProgress();
  }, [updateBufferProgress]);

  const onWaiting = useCallback(() => setIsBuffering(true), []);

  const retryLoad = () => {
    const video = videoRef.current;
    if (!video) return;
    setLoadTimedOut(false);
    setIsBuffering(true);
    setNeedsTapToPlay(false);
    video.load();
    void video.play().catch(() => setNeedsTapToPlay(true));
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    const video = videoRef.current;
    if (video?.paused) {
      void video.play().catch(() => setNeedsTapToPlay(true));
    }
  };

  const tapToPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    void video.play().then(() => setNeedsTapToPlay(false)).catch(() => undefined);
  };

  return (
    <div className="relative h-full w-full min-h-0">
      <div className={aboutHeroMediaFrameClassName("relative")}>
        {posterSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterSrc}
            alt=""
            fetchPriority="high"
            decoding="async"
            onError={() => setPosterFailed(true)}
            className={cn(
              aboutHeroMediaClassName(),
              "absolute z-0 transition-opacity duration-500",
              posterVisible ? "opacity-100" : "opacity-0",
            )}
            aria-hidden
          />
        ) : (
          <AboutHeroPosterFallback />
        )}

        {showVideo ? (
          <video
            ref={videoRef}
            src={src}
            poster={posterSrc ?? undefined}
            muted
            className={cn(
              aboutHeroMediaClassName("relative z-1 transition-opacity duration-500"),
              isBuffering ? "opacity-0" : "opacity-100",
            )}
            playsInline
            loop
            preload={isInView ? "auto" : "metadata"}
            onCanPlay={onCanPlay}
            onPlaying={onCanPlay}
            onWaiting={onWaiting}
            onProgress={updateBufferProgress}
            aria-label="Video about Shamell"
          />
        ) : null}
      </div>

      {showVideo && isBuffering ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 px-6">
          <Loader2 className="h-8 w-8 animate-spin text-gold/70" strokeWidth={1.5} aria-hidden />
          {bufferProgress > 0 ? (
            <div className="h-1 w-full max-w-[140px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gold/70 transition-[width] duration-300"
                style={{ width: `${bufferProgress}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {showVideo && loadTimedOut ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/50 px-4 text-center">
          <p className="font-body text-sm text-foreground/85">The video is still loading…</p>
          <button
            type="button"
            onClick={retryLoad}
            className="rounded-lg border border-gold/40 bg-black/60 px-4 py-2 font-brand text-xs tracking-[0.14em] text-gold uppercase transition hover:border-gold/60"
          >
            Retry
          </button>
        </div>
      ) : null}

      {showVideo && needsTapToPlay && !isBuffering ? (
        <button
          type="button"
          onClick={tapToPlay}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 font-brand text-xs tracking-[0.16em] text-gold uppercase backdrop-blur-[2px] transition hover:bg-black/45"
        >
          Tap to play
        </button>
      ) : null}

      {showVideo ? (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          aria-pressed={isMuted}
          className="absolute bottom-5 right-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-gold backdrop-blur-sm transition hover:border-gold/45 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 sm:bottom-6 sm:right-6"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          ) : (
            <Volume2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      ) : null}
    </div>
  );
}

type AboutSectionProps = {
  initialAbout?: AboutContentItem | null;
};

const AboutSection = ({ initialAbout }: AboutSectionProps) => {
  const { about, isLoading } = useAboutContent(initialAbout);
  const bodyParagraphs = splitAboutParagraphs(about.paragraph1);
  const heroIsVideo = inferAboutHeroIsVideo({
    heroMediaType: about.heroMediaType,
    imageUrl: about.imageUrl,
  });
  const heroVideoSrc = useMemo(
    () => about.videoDeliveryUrl ?? about.imageUrl,
    [about.videoDeliveryUrl, about.imageUrl],
  );
  const showHeroMedia = !isLoading || Boolean(initialAbout);
  const heroIsVideoReady = Boolean(heroVideoSrc && heroIsVideo && showHeroMedia);

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

        <div
          className={cn(
            "grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14",
            heroIsVideo ? "items-start" : "items-stretch",
          )}
        >
          <RevealOnView className="lg:col-span-5" delay={80} amount={0.18}>
            <div
              className={cn(
                heroIsVideo
                  ? aboutHeroVideoCardClassName({
                      className: cn(
                        heroIsVideoReady
                          ? "bg-transparent"
                          : "bg-[radial-gradient(ellipse_at_center,rgba(32,28,24,1)_0%,#060606_70%)]",
                        isLoading && !initialAbout && "animate-pulse",
                      ),
                    })
                  : aboutHeroImageCardClassName(
                      cn(
                        "bg-[radial-gradient(ellipse_at_center,rgba(32,28,24,1)_0%,#060606_70%)]",
                        isLoading && !initialAbout && "animate-pulse",
                      ),
                    ),
              )}
            >
              {showHeroMedia ? (
                <>
                  {heroIsVideoReady ? (
                    <AboutHeroVideo src={heroVideoSrc!} poster={about.videoPosterUrl} />
                  ) : heroIsVideo && about.videoPosterUrl ? (
                    <div className={aboutHeroMediaFrameClassName("relative")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={about.videoPosterUrl}
                        alt=""
                        fetchPriority="high"
                        className={aboutHeroMediaClassName()}
                        aria-hidden
                      />
                    </div>
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
                    isLoading && !initialAbout && "text-foreground/40",
                  )}
                >
                  {isLoading && !initialAbout ? " " : block}
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
