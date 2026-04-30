"use client";

import OrnamentDivider from "./OrnamentDivider";
import ExperienceCard from "@/components/experiences/ExperienceCard";
import { useExperiences } from "@/hooks/use-experiences";

const ExperiencesSection = () => {
  const { experiences, isLoading } = useExperiences();

  return (
    <section id="experiences" className="bg-background py-20 px-4">
      <OrnamentDivider />

      <div className="max-w-6xl mx-auto">
        <h2 className="font-brand text-gold text-center text-sm md:text-base tracking-[0.3em] mb-3">
          SPECIAL EXPERIENCES
        </h2>
        <p className="text-center text-foreground/60 text-sm font-body max-w-3xl mx-auto mb-12">
          Signature experiences crafted to elevate the atmosphere with visual impact, refined
          staging, and expressive artistry.
        </p>

        {isLoading ? (
          <p className="text-center text-foreground/60 text-sm font-body">Loading special experiences...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {experiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        )}
      </div>

      <OrnamentDivider className="mt-14" />
    </section>
  );
};

export default ExperiencesSection;
