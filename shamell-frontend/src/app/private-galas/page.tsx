import { Flame, Sparkles, Theater, Crown } from "lucide-react";
import ServicePageTemplate from "@/components/ServicePageTemplate";

const PrivateGalas = () => (
  <ServicePageTemplate
    title="Private Galas"
    tagline="Bold and unforgettable"
    description="Elevate your private celebration with a mesmerizing performance designed exclusively for your event. From intimate dinner parties to grand estate gatherings, Shamell brings artistry, elegance, and a commanding presence that transforms any occasion into an extraordinary experience."
    features={[
      {
        icon: Flame,
        title: "Custom Choreography",
        description: "Each performance is tailor-made to match the theme, mood, and atmosphere of your event.",
      },
      {
        icon: Sparkles,
        title: "Premium Production",
        description: "Professional costuming, props, lighting coordination, and sound consultation included.",
      },
      {
        icon: Theater,
        title: "Immersive Entertainment",
        description: "Interactive moments that captivate your guests and create lasting memories.",
      },
      {
        icon: Crown,
        title: "White-Glove Service",
        description: "Seamless coordination from booking to performance — every detail handled with care.",
      },
    ]}
  />
);

export default PrivateGalas;
