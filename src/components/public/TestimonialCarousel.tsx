'use client';

import { useState } from "react";
import OrnamentDivider from "./OrnamentDivider";

interface Testimonial {
  id: string;
  author: string;
  event: string;
  quote: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

const TestimonialCarousel = ({ testimonials }: TestimonialCarouselProps) => {
  const [current, setCurrent] = useState(0);

  if (!testimonials || testimonials.length === 0) return null;

  const prev = () =>
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);

  const t = testimonials[current];

  return (
    <section className="bg-background py-16 px-4">
      <OrnamentDivider />
      <h2 className="font-brand text-gold text-center text-sm md:text-base tracking-[0.3em] mb-12">
        TESTIMONIALS
      </h2>

      <div className="max-w-2xl mx-auto text-center">
        <p className="font-script text-gold text-2xl md:text-3xl mb-6">"{t.quote}"</p>
        <p className="font-brand text-foreground/70 text-xs tracking-widest mb-1">
          {t.author.toUpperCase()}
        </p>
        <p className="text-foreground/40 text-xs font-body">{t.event}</p>

        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={prev}
              className="text-gold/60 hover:text-gold transition-colors font-brand text-xs tracking-widest"
              aria-label="Previous testimonial"
            >
              ← PREV
            </button>
            <span className="text-foreground/30 text-xs">
              {current + 1} / {testimonials.length}
            </span>
            <button
              onClick={next}
              className="text-gold/60 hover:text-gold transition-colors font-brand text-xs tracking-widest"
              aria-label="Next testimonial"
            >
              NEXT →
            </button>
          </div>
        )}
      </div>
      <OrnamentDivider className="mt-12" />
    </section>
  );
};

export default TestimonialCarousel;
