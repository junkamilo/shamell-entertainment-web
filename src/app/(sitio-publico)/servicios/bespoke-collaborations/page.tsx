import ServicePageTemplate from "@/components/public/ServicePageTemplate";

export const metadata = {
  title: "Bespoke Collaborations — Shamell Entertainment",
  description:
    "Collaborate with Shamell to craft bespoke performances that tell a story through movement.",
};

export default function BespokeCollaborationsPage() {
  return (
    <ServicePageTemplate
      title="Bespoke Collaborations"
      tagline="Timeless ceremonial artistry"
      description="For those seeking something truly one-of-a-kind. Shamell collaborates with artists, brands, event designers, and creative directors to craft bespoke performances that push boundaries and tell a story through movement."
      features={[
        {
          iconName: "Handshake",
          title: "Creative Partnerships",
          description:
            "Collaborative work with photographers, filmmakers, designers, and luxury brands.",
        },
        {
          iconName: "Palette",
          title: "Concept Development",
          description:
            "From initial vision to final execution — co-create a performance piece that aligns with your artistic goals.",
        },
        {
          iconName: "Globe",
          title: "Destination Performances",
          description:
            "Available for national and international bookings, destination weddings, and cultural events.",
        },
        {
          iconName: "Clapperboard",
          title: "Film & Media",
          description:
            "Performances for commercials, music videos, editorial shoots, and branded content.",
        },
      ]}
    />
  );
}
