import ServicePageTemplate from "@/components/public/ServicePageTemplate";

export const metadata = {
  title: "Private Galas — Shamell Entertainment",
  description:
    "Elevate your private celebration with a mesmerizing belly dance performance designed exclusively for your event.",
};

export default function PrivateGalasPage() {
  return (
    <ServicePageTemplate
      title="Private Galas"
      tagline="Bold and unforgettable"
      description="Elevate your private celebration with a mesmerizing performance designed exclusively for your event. From intimate dinner parties to grand estate gatherings, Shamell brings artistry, elegance, and a commanding presence that transforms any occasion into an extraordinary experience."
      features={[
        {
          iconName: "Flame",
          title: "Custom Choreography",
          description:
            "Each performance is tailor-made to match the theme, mood, and atmosphere of your event.",
        },
        {
          iconName: "Sparkles",
          title: "Premium Production",
          description:
            "Professional costuming, props, lighting coordination, and sound consultation included.",
        },
        {
          iconName: "Theater",
          title: "Immersive Entertainment",
          description:
            "Interactive moments that captivate your guests and create lasting memories.",
        },
        {
          iconName: "Crown",
          title: "White-Glove Service",
          description:
            "Seamless coordination from booking to performance — every detail handled with care.",
        },
      ]}
    />
  );
}
