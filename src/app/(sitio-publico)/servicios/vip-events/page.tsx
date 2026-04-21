import ServicePageTemplate from "@/components/public/ServicePageTemplate";

export const metadata = {
  title: "VIP Events — Shamell Entertainment",
  description:
    "Bring sophistication and spectacle to your VIP event with world-class belly dance.",
};

export default function VipEventsPage() {
  return (
    <ServicePageTemplate
      title="VIP Events"
      tagline="Grace in motion"
      description="Bring sophistication and spectacle to your VIP event. Whether it's a corporate gala, product launch, charity fundraiser, or exclusive gathering, Shamell delivers world-class belly dance that commands attention and elevates the atmosphere."
      features={[
        {
          iconName: "Landmark",
          title: "Stage-Ready Performance",
          description:
            "High-energy sets designed for large audiences, stages, and formal event settings.",
        },
        {
          iconName: "Music",
          title: "Music & Sound Coordination",
          description:
            "Custom music selection and collaboration with your event's DJ or live musicians.",
        },
        {
          iconName: "Gem",
          title: "Multiple Show Formats",
          description:
            "Choose from solo performances, ensemble shows, or ambient entertainment.",
        },
        {
          iconName: "ClipboardList",
          title: "Event Consultation",
          description:
            "Pre-event planning to ensure the performance integrates seamlessly into your program.",
        },
      ]}
    />
  );
}
