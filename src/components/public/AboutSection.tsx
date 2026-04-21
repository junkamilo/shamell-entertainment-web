'use client';

import { useState } from "react";

const AboutSection = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <section id="about" className="bg-background py-16 px-4">
      <h2 className="font-brand text-gold text-center text-2xl md:text-3xl tracking-wider mb-8">
        About Shamell
      </h2>

      <div className="max-w-2xl mx-auto text-center">
        <p className="text-foreground/80 text-sm md:text-base font-body leading-relaxed mb-6">
          Shamell is a luxury Oriental dance performer known for creating immersive, unforgettable
          experiences at high-end events, private celebrations, and elite gatherings.
        </p>
        {expanded && (
          <p className="text-foreground/80 text-sm md:text-base font-body leading-relaxed mb-6 fade-in-up">
            Blending classical Oriental dance with modern elegance, her performances are
            thoughtfully curated to complement the atmosphere of each occasion, delivering artistry,
            presence, and refinement in every movement.
          </p>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn-outline-gold font-brand text-xs"
        >
          {expanded ? "Show Less" : "Read More"}
        </button>
      </div>
    </section>
  );
};

export default AboutSection;
