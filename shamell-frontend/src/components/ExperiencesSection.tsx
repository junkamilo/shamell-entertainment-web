"use client";

import ExperienceCard from "@/components/experiences/ExperienceCard";
import RevealOnView from "@/components/shared/RevealOnView";
import { useExperiences } from "@/hooks/use-experiences";

const ExperiencesSection = () => {
  const { experiences, isLoading } = useExperiences();

  return (
    <section id="experiences" className="bg-transparent py-20 px-4">
      <div className="relative mx-auto mb-12 max-w-6xl text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-28 w-[min(22rem,90vw)] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(197,165,90,0.14),transparent_72%)] blur-3xl opacity-70" />
        </div>
        <RevealOnView className="relative" delay={40}>
          <h2 className="mb-3 font-brand text-base font-semibold tracking-[0.26em] text-gold md:text-lg md:tracking-[0.28em]">
            SERVICE CATALOG
          </h2>
          <p className="mx-auto max-w-3xl text-center font-body text-base font-medium leading-relaxed text-foreground/88 md:text-lg md:leading-relaxed md:text-foreground/90">
            Signature experiences crafted to elevate the atmosphere with visual impact, refined
            staging, and expressive artistry.
          </p>
        </RevealOnView>
      </div>

      <div className="mx-auto max-w-6xl">

        {isLoading ? (
          <p className="text-center font-body text-base font-medium text-foreground/85 md:text-lg md:text-foreground/88">
            Loading special experiences...
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {experiences.map((experience, index) => (
              <RevealOnView key={experience.id} className="h-full" delay={index * 80} amount={0.18}>
                <ExperienceCard experience={experience} index={index} />
              </RevealOnView>
            ))}
          </div>
        )}
      </div>

    </section>
  );
};

export default ExperiencesSection;
