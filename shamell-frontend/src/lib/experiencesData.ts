import type { StaticImageData } from "next/image";
import experienceFire from "@/assets/experience-fire.jpg";
import experienceVeil from "@/assets/experience-veil.jpg";
import experienceSword from "@/assets/experience-sword.jpg";

export type Experience = {
  id: string;
  slug: string;
  title: string;
  description: string;
  items: string[];
  image: StaticImageData | string;
};

export const experiencesFallbackData: Experience[] = [
  {
    id: "exp-fire",
    slug: "fire",
    title: "Fire",
    image: experienceFire,
    description:
      "High-impact fire performance designed for venues that allow open flame. Combines controlled props, choreography, and audience-safe sightlines for a dramatic centerpiece moment.",
    items: [
      "Venue approval and fire marshal / safety officer sign-off required",
      "Non-flammable performance surface; minimum clear radius around stage",
      "Fire extinguisher and blanket on standby; no low ceilings or drapery in splash zone",
      "Outdoor or well-ventilated indoor space; no sprinklers directly above act",
      "Dress rehearsal window recommended for lighting and evacuation paths",
    ],
  },
  {
    id: "exp-veil-fan",
    slug: "veil-fan",
    title: "Veil & Fan",
    image: experienceVeil,
    description:
      "Elegant extended props that add volume, color, and cinematic motion. Ideal for entrances, transitions, or ambient luxury sets without pyrotechnics.",
    items: [
      "Stage depth for veil sweeps (minimum ~12 ft / 3.5 m preferred)",
      "Smooth, snag-free floor; no sharp edges near wing space",
      "Fan-friendly lighting: side wash or backlight for silk translucency",
      "Music cue sheet with 15–30 s buffer for veil changes if live band",
      "No strong HVAC downblast directly on performer during fan work",
    ],
  },
  {
    id: "exp-sword-candelabra",
    slug: "sword-candelabra",
    title: "Sword & Candelabra",
    image: experienceSword,
    description:
      "Ceremonial precision acts: classical sword balancing and separate candle rituals. Each uses different props, muscle groups, and safety rules—booked together or a la carte by arrangement.",
    items: [
      "Stable, level platform; no slippery finishes underfoot",
      "Dimmed house lights for flame visibility; follow-spot optional",
      "Minimum vertical clearance for sword lifts and candelabra extensions",
      "Staff briefing: no flash photography during balance holds",
      "Separate setup time if both rituals appear in one program segment",
    ],
  },
];
