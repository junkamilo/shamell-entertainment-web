import Image from "next/image";
import type { Experience } from "@/lib/experiencesData";

type ExperienceCardProps = {
  experience: Experience;
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <article className="group flex flex-col border border-gold/35 bg-black/20 overflow-hidden hover:border-gold/55 transition-colors duration-300">
      <div className="relative aspect-4/5 w-full overflow-hidden">
        {typeof experience.image === "string" ? (
          <img
            src={experience.image}
            alt={`${experience.title} - special experience`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <Image
            src={experience.image}
            alt={`${experience.title} - special experience`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            priority={experience.slug === "fire"}
          />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <h3 className="font-brand text-gold text-base md:text-lg tracking-[0.18em] drop-shadow-md">
            {experience.title.toUpperCase()}
          </h3>
          <a
            href="/contacto"
            className="shrink-0 border border-gold bg-background/80 px-3 py-1.5 text-xs font-brand text-gold tracking-[0.14em] hover:bg-gold/10 transition-colors"
          >
            INQUIRE
          </a>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <p className="text-foreground/80 text-base font-body leading-relaxed">{experience.description}</p>

        <div>
          <h4 className="font-brand text-gold text-xs tracking-[0.2em] mb-2">ITEMS</h4>
          <ul className="space-y-1.5 border-l border-gold/25 pl-3">
            {experience.items.map((item) => (
              <li key={item} className="text-foreground/65 text-sm font-body flex gap-2 leading-snug">
                <span className="text-gold shrink-0 mt-0.5">✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
