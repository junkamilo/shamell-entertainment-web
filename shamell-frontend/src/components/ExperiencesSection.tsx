"use client";

import ExperienceCard from "@/components/experiences/ExperienceCard";
import RevealOnView from "@/components/shared/RevealOnView";
import CatalogCardCarousel from "@/components/shared/CatalogCardCarousel";
import { useExperiences } from "@/hooks/use-experiences";
import { useInViewLoad } from "@/hooks/use-in-view-load";

const ExperiencesSection = () => {
  const { ref, inView } = useInViewLoad<HTMLElement>();
  const { experiences, isLoading } = useExperiences(inView);

  return (
    <section
      ref={ref}
      id="services"
      className="overflow-x-hidden bg-transparent py-20 px-4"
    >
      <div className="relative mx-auto mb-12 max-w-6xl text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-28 w-[min(22rem,90vw)] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(197,165,90,0.14),transparent_72%)] blur-3xl opacity-70" />
        </div>
        <RevealOnView className="relative" delay={40}>
          <h2 className="mb-4 font-brand text-2xl font-semibold tracking-[0.14em] text-gold md:mb-5 md:text-4xl md:tracking-[0.16em]">
            SERVICE CATALOG
          </h2>
          <p className="mx-auto max-w-3xl text-center font-body text-lg font-medium leading-relaxed text-foreground/88 sm:text-xl sm:leading-relaxed md:text-2xl md:leading-[1.65] md:text-foreground/90">
            Signature experiences crafted to elevate the atmosphere with visual impact, refined
            staging, and expressive artistry.
          </p>
        </RevealOnView>
      </div>

      <div className="mx-auto max-w-6xl">

        {isLoading ? (
          <p className="text-center font-body text-base font-medium text-foreground/85 md:text-lg md:text-foreground/88">
            Loading service catalog...
          </p>
        ) : (
          <CatalogCardCarousel ariaLabel="Service catalog">
            {experiences.map((experience, index) => (
              <ExperienceCard key={experience.id} experience={experience} index={index} />
            ))}
          </CatalogCardCarousel>
        )}
      </div>

    </section>
  );
};

export default ExperiencesSection;
