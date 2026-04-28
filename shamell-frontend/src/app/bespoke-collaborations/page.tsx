import { Handshake, Palette, Globe, Clapperboard } from "lucide-react";
import ServicePageTemplate from "@/components/ServicePageTemplate";

const BespokeCollaborations = () => (
  <ServicePageTemplate
    title="Bespoke Collaborations"
    tagline="Timeless ceremonial artistry"
    description="For those seeking something truly one-of-a-kind. Shamell collaborates with artists, brands, event designers, and creative directors to craft bespoke performances that push boundaries and tell a story through movement."
    features={[
      {
        icon: Handshake,
        title: "Creative Partnerships",
        description: "Collaborative work with photographers, filmmakers, designers, and luxury brands.",
      },
      {
        icon: Palette,
        title: "Concept Development",
        description: "From initial vision to final execution — co-create a performance piece that aligns with your artistic goals.",
      },
      {
        icon: Globe,
        title: "Destination Performances",
        description: "Available for national and international bookings, destination weddings, and cultural events.",
      },
      {
        icon: Clapperboard,
        title: "Film & Media",
        description: "Performances for commercials, music videos, editorial shoots, and branded content.",
      },
    ]}
  />
);

export default BespokeCollaborations;
