import Image from "next/image";
import experienceFire from "@/assets/experience-fire.jpg";
import experienceVeil from "@/assets/experience-veil.jpg";
import experienceSword from "@/assets/experience-sword.jpg";
import OrnamentDivider from "./OrnamentDivider";
import type { StaticImageData } from "next/image";

type Experience = {
  slug: string;
  image: StaticImageData;
  title: string;
  addOn: string;
  addOnLabel: string;
  description: string;
  technicalRequirements: string[];
  /** Only for sword/candelabra card */
  ritualDistinction?: {
    shamadan: { title: string; body: string };
    candleTray: { title: string; body: string };
  };
};

const experiences: Experience[] = [
  {
    slug: "fire",
    image: experienceFire,
    title: "Fire",
    addOn: "+$200",
    addOnLabel: "Add-on to base package",
    description:
      "High-impact fire performance designed for venues that allow open flame. Combines controlled props, choreography, and audience-safe sightlines for a dramatic centerpiece moment.",
    technicalRequirements: [
      "Venue approval and fire marshal / safety officer sign-off required",
      "Non-flammable performance surface; minimum clear radius around stage",
      "Fire extinguisher and blanket on standby; no low ceilings or drapery in splash zone",
      "Outdoor or well-ventilated indoor space; no sprinklers directly above act",
      "Dress rehearsal window recommended for lighting and evacuation paths",
    ],
  },
  {
    slug: "veil-fan",
    image: experienceVeil,
    title: "Veil & Fan",
    addOn: "+$100",
    addOnLabel: "Add-on to base package",
    description:
      "Elegant extended props that add volume, color, and cinematic motion. Ideal for entrances, transitions, or ambient luxury sets without pyrotechnics.",
    technicalRequirements: [
      "Stage depth for veil sweeps (minimum ~12 ft / 3.5 m preferred)",
      "Smooth, snag-free floor; no sharp edges near wing space",
      "Fan-friendly lighting: side wash or backlight for silk translucency",
      "Music cue sheet with 15–30 s buffer for veil changes if live band",
      "No strong HVAC downblast directly on performer during fan work",
    ],
  },
  {
    slug: "sword-candelabra",
    image: experienceSword,
    title: "Sword & Candelabra",
    addOn: "+$150",
    addOnLabel: "Add-on to base package",
    description:
      "Ceremonial precision acts: classical sword balancing and separate candle rituals. Each uses different props, muscle groups, and safety rules—booked together or à la carte by arrangement.",
    technicalRequirements: [
      "Stable, level platform; no slippery finishes underfoot",
      "Dimmed house lights for flame visibility; follow-spot optional",
      "Minimum vertical clearance for sword lifts and candelabra extensions",
      "Staff briefing: no flash photography during balance holds",
      "Separate setup time if both rituals appear in one program segment",
    ],
    ritualDistinction: {
      shamadan: {
        title: "Shamadan (head candelabra)",
        body:
          "The ornate candelabra is balanced on the head while the dancer moves through slow, controlled phrasing. Focus is vertical balance, flame height, and regal posture—distinct from handheld tray work.",
      },
      candleTray: {
        title: "Candle tray (bandeja de velas)",
        body:
          "A handheld tray of lit candles, carried and danced with different port de bras and floor patterns. Emphasis is on arm stability, tray plane, and choreography around the prop—not the same mechanics or staging profile as shamadan.",
      },
    },
  },
];

const ExperienceCard = ({ exp }: { exp: Experience }) => (
  <article className="group flex flex-col border border-gold/35 bg-black/20 overflow-hidden hover:border-gold/55 transition-colors duration-300">
    <div className="relative aspect-4/5 w-full overflow-hidden">
      <Image
        src={exp.image}
        alt={`${exp.title} — special experience`}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        priority={exp.slug === "fire"}
      />
      <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
        <h3 className="font-brand text-gold text-sm md:text-base tracking-[0.18em] drop-shadow-md">
          {exp.title.toUpperCase()}
        </h3>
        <span className="shrink-0 border border-gold bg-background/90 px-2 py-1 text-xs font-brand text-gold tracking-wide">
          {exp.addOn}
        </span>
      </div>
    </div>

    <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
      <p className="text-[10px] font-brand tracking-[0.2em] text-gold/70">{exp.addOnLabel}</p>
      <p className="text-foreground/80 text-sm font-body leading-relaxed">{exp.description}</p>

      <div>
        <h4 className="font-brand text-gold text-[10px] tracking-[0.2em] mb-2">TECHNICAL REQUIREMENTS</h4>
        <ul className="space-y-1.5 border-l border-gold/25 pl-3">
          {exp.technicalRequirements.map((req) => (
            <li key={req} className="text-foreground/65 text-xs font-body leading-snug">
              {req}
            </li>
          ))}
        </ul>
      </div>

      {exp.ritualDistinction ? (
        <div className="grid gap-3 sm:grid-cols-2 border-t border-gold/20 pt-4">
          <div className="border border-gold/30 bg-gold/4 p-3">
            <h5 className="font-brand text-gold text-[10px] tracking-[0.14em] mb-1.5">
              {exp.ritualDistinction.shamadan.title.toUpperCase()}
            </h5>
            <p className="text-foreground/70 text-[11px] font-body leading-relaxed">
              {exp.ritualDistinction.shamadan.body}
            </p>
          </div>
          <div className="border border-gold/30 bg-gold/4 p-3">
            <h5 className="font-brand text-gold text-[10px] tracking-[0.14em] mb-1.5">
              {exp.ritualDistinction.candleTray.title.toUpperCase()}
            </h5>
            <p className="text-foreground/70 text-[11px] font-body leading-relaxed">
              {exp.ritualDistinction.candleTray.body}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  </article>
);

const ExperiencesSection = () => {
  return (
    <section id="experiences" className="bg-background py-20 px-4">
      <OrnamentDivider />

      <div className="max-w-6xl mx-auto">
        <h2 className="font-brand text-gold text-center text-sm md:text-base tracking-[0.3em] mb-3">
          SPECIAL EXPERIENCES
        </h2>
        <p className="text-center text-foreground/60 text-sm font-body max-w-3xl mx-auto mb-12">
          Three signature add-ons—each with its own look, logistics, and supplement. High-resolution
          imagery; video showreels can be provided on request for production teams.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {experiences.map((exp) => (
            <ExperienceCard key={exp.slug} exp={exp} />
          ))}
        </div>

        <p className="mt-10 text-center text-foreground/50 text-xs font-body max-w-2xl mx-auto">
          Supplements are indicative add-ons to a contracted performance package. Final quotes
          depend on venue, duration, insurance, and travel.
        </p>
      </div>

      <OrnamentDivider className="mt-14" />
    </section>
  );
};

export default ExperiencesSection;
