import { Landmark, Music, Gem, ClipboardList } from "lucide-react";
import ServicePageTemplate from "@/components/ServicePageTemplate";

const VipEvents = () => (
  <ServicePageTemplate
    title="VIP Events"
    tagline="Grace in motion"
    description="Bring sophistication and spectacle to your VIP event. Whether it's a corporate gala, product launch, charity fundraiser, or exclusive gathering, Shamell delivers world-class belly dance that commands attention and elevates the atmosphere."
    features={[
      {
        icon: Landmark,
        title: "Stage-Ready Performance",
        description: "High-energy sets designed for large audiences, stages, and formal event settings.",
      },
      {
        icon: Music,
        title: "Music & Sound Coordination",
        description: "Custom music selection and collaboration with your event's DJ or live musicians.",
      },
      {
        icon: Gem,
        title: "Multiple Show Formats",
        description: "Choose from solo performances, ensemble shows, or ambient entertainment.",
      },
      {
        icon: ClipboardList,
        title: "Event Consultation",
        description: "Pre-event planning to ensure the performance integrates seamlessly into your program.",
      },
    ]}
  />
);

export default VipEvents;
