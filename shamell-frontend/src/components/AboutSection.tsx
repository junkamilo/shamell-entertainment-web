"use client";

import Image from "next/image";
import portrait from "@/assets/gallery-2.jpg";
import OrnamentDivider from "./OrnamentDivider";
import { useAboutContent } from "@/hooks/use-about-content";
import { splitAboutParagraphs } from "@/lib/aboutParagraphs";
import { cn } from "@/lib/utils";

const AboutSection = () => {
  const { about, isLoading } = useAboutContent();
  const bodyParagraphs = splitAboutParagraphs(about.paragraph1);

  return (
    <section id="about" className="bg-transparent px-4 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <header className="relative mb-12 text-center md:mb-16">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-36 w-[min(28rem,94vw)] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(197,165,90,0.08),transparent_72%)] blur-3xl opacity-80" />
          </div>
          <div className="relative">
            <h2 className="font-brand text-2xl tracking-[0.14em] text-gold md:text-4xl md:tracking-[0.16em]">
              {about.title}
            </h2>
            <div
              className="mx-auto mt-5 h-px w-20 max-w-48 bg-linear-to-r from-transparent via-white/25 to-transparent"
              aria-hidden
            />
          </div>
        </header>

        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="animate-shamell-exp-card-in lg:col-span-5" style={{ animationDelay: "0ms" }}>
            <div
              className={cn(
                "group/portrait relative aspect-3/4 w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_center,rgba(32,28,24,1)_0%,#060606_70%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_48px_rgba(0,0,0,0.45)] transition-[border-color,box-shadow] duration-500",
                "hover:border-white/16 hover:shadow-[0_22px_56px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]",
                isLoading && "animate-pulse",
              )}
            >
              {!isLoading ? (
                <>
                  <Image
                    src={about.imageUrl ?? portrait}
                    alt="Professional portrait of Shamell"
                    fill
                    className="object-contain object-center p-3 transition-transform duration-700 ease-out group-hover/portrait:scale-[1.02] sm:p-4"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority={false}
                  />
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
          </div>

          <div
            className="flex animate-shamell-exp-card-in flex-col justify-center lg:col-span-7"
            style={{ animationDelay: "140ms" }}
          >
            <div className="mb-10 space-y-6">
              {bodyParagraphs.map((block, index) => (
                <p
                  key={`${index}-${block.slice(0, 24)}`}
                  className={cn(
                    "font-body leading-relaxed transition-colors duration-300",
                    index === 0
                      ? "text-base text-foreground/88 md:text-lg md:leading-[1.75]"
                      : "text-sm text-foreground/72 md:text-base md:leading-relaxed",
                  )}
                >
                  {block}
                </p>
              ))}
            </div>

            <div>
              <h3 className="mb-2 font-brand text-xs tracking-[0.22em] text-gold">CORE VALUES</h3>
              <div
                className="mb-6 h-px w-14 bg-linear-to-r from-white/40 to-transparent md:w-16"
                aria-hidden
              />
              <div className="flex flex-wrap gap-2.5 md:gap-3">
                {about.coreValues.map((value) => (
                  <span
                    key={value}
                    className={cn(
                      "group/chip relative overflow-hidden rounded-xl border border-white/12 bg-black/35 px-3.5 py-2 font-brand text-[10px] tracking-[0.14em] text-gold uppercase backdrop-blur-[2px] transition-all duration-300 md:px-4 md:text-[11px] md:tracking-[0.16em]",
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
          </div>
        </div>

        <OrnamentDivider className="mt-14 md:mt-16" />
      </div>
    </section>
  );
};

export default AboutSection;
