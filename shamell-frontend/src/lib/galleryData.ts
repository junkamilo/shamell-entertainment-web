import type { StaticImageData } from "next/image";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import gallery7 from "@/assets/gallery-7.jpg";
import gallery8 from "@/assets/gallery-8.jpg";
import experienceFire from "@/assets/experience-fire.jpg";
import experienceVeil from "@/assets/experience-veil.jpg";
import experienceSword from "@/assets/experience-sword.jpg";

export type GalleryCategory = "fire" | "sword-candelabra" | "veil" | "clients";

export type GalleryFilter = GalleryCategory | "all";

export type GalleryItem = {
  id: string;
  src: StaticImageData;
  alt: string;
  category: GalleryCategory;
};

export const galleryTabs: { id: GalleryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fire", label: "Fire Performance" },
  { id: "sword-candelabra", label: "Sword y Candelabra" },
  { id: "veil", label: "Veil" },
  { id: "clients", label: "Clients" },
];

export const galleryItems: GalleryItem[] = [
  { id: "fire-1", src: experienceFire, alt: "Fire performance - Shamell", category: "fire" },
  { id: "fire-2", src: gallery5, alt: "Fire stage sequence", category: "fire" },
  { id: "fire-3", src: gallery3, alt: "Fire choreography close-up", category: "fire" },
  { id: "fire-4", src: gallery7, alt: "Flame performance moment", category: "fire" },
  { id: "fire-5", src: gallery8, alt: "Fire showcase frame", category: "fire" },
  { id: "fire-6", src: gallery1, alt: "Fire act at event", category: "fire" },
  { id: "fire-7", src: gallery4, alt: "Fire set in gala venue", category: "fire" },
  { id: "fire-8", src: gallery6, alt: "Fire prop movement", category: "fire" },

  { id: "sword-1", src: experienceSword, alt: "Sword and candelabra ritual", category: "sword-candelabra" },
  { id: "sword-2", src: gallery3, alt: "Sword balance posture", category: "sword-candelabra" },
  { id: "sword-3", src: gallery7, alt: "Candelabra sequence", category: "sword-candelabra" },
  { id: "sword-4", src: gallery2, alt: "Ceremonial precision act", category: "sword-candelabra" },
  { id: "sword-5", src: gallery6, alt: "Sword line and balance", category: "sword-candelabra" },
  { id: "sword-6", src: gallery8, alt: "Candelabra stage image", category: "sword-candelabra" },
  { id: "sword-7", src: gallery5, alt: "Sword and candle showcase", category: "sword-candelabra" },
  { id: "sword-8", src: gallery1, alt: "Ritual performance frame", category: "sword-candelabra" },

  { id: "veil-1", src: experienceVeil, alt: "Veil and fan dance", category: "veil" },
  { id: "veil-2", src: gallery2, alt: "Veil movement", category: "veil" },
  { id: "veil-3", src: gallery6, alt: "Fan choreography", category: "veil" },
  { id: "veil-4", src: gallery4, alt: "Silk veil silhouette", category: "veil" },
  { id: "veil-5", src: gallery1, alt: "Veil transition moment", category: "veil" },
  { id: "veil-6", src: gallery5, alt: "Fan detail shot", category: "veil" },
  { id: "veil-7", src: gallery8, alt: "Veil stage capture", category: "veil" },
  { id: "veil-8", src: gallery3, alt: "Veil choreography frame", category: "veil" },

  { id: "clients-1", src: gallery1, alt: "Client event portrait", category: "clients" },
  { id: "clients-2", src: gallery4, alt: "Private client gala", category: "clients" },
  { id: "clients-3", src: gallery8, alt: "Client celebration shot", category: "clients" },
  { id: "clients-4", src: gallery2, alt: "Audience and atmosphere", category: "clients" },
  { id: "clients-5", src: gallery5, alt: "Luxury event setting", category: "clients" },
  { id: "clients-6", src: gallery7, alt: "Client production frame", category: "clients" },
  { id: "clients-7", src: gallery6, alt: "Event audience moment", category: "clients" },
  { id: "clients-8", src: gallery3, alt: "Client gala stage", category: "clients" },
];
