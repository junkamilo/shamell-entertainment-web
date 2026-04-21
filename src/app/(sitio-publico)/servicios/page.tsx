import Link from "next/link";
import { Flame, MonitorPlay, Compass } from "lucide-react";
import FlameIcon from "@/components/public/FlameIcon";
import PearlDivider from "@/components/public/PearlDivider";
import OrnamentDivider from "@/components/public/OrnamentDivider";
import Footer from "@/components/public/Footer";
import NavBar from "@/components/public/NavBar";

const services = [
  {
    icon: Flame,
    title: "Private Galas",
    subtitle: "Bold and unforgettable",
    description:
      "Elevate your private celebration with a mesmerizing performance designed exclusively for your event.",
    path: "/servicios/private-galas",
  },
  {
    icon: MonitorPlay,
    title: "VIP Events",
    subtitle: "Grace in motion",
    description:
      "Bring sophistication and spectacle to your VIP event with world-class belly dance.",
    path: "/servicios/vip-events",
  },
  {
    icon: Compass,
    title: "Bespoke Collaborations",
    subtitle: "Timeless ceremonial artistry",
    description:
      "For those seeking something truly one-of-a-kind. Collaborative performances that push boundaries.",
    path: "/servicios/bespoke-collaborations",
  },
];

export default function ServiciosPage() {
  return (
    <div className="bg-background min-h-screen">
      <NavBar />

      {/* Hero */}
      <section className="relative h-[35vh] flex flex-col items-center justify-center pt-14">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="relative z-10 flex flex-col items-center text-center px-4 fade-in-up">
          <FlameIcon className="w-10 h-14 mb-4" />
          <h1 className="font-brand text-gold text-3xl md:text-5xl tracking-[0.15em] mb-3">
            SERVICES
          </h1>
          <p className="font-elegant italic text-gold-light text-lg md:text-xl">
            Tailored performance artistry for every occasion
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <PearlDivider />
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4">
        <OrnamentDivider />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-5xl mx-auto mt-12">
          {services.map((service, i) => (
            <div key={service.title} className="flex">
              <Link
                href={service.path}
                className="flex flex-col items-center text-center px-8 py-10 border border-gold/30 flex-1 transition-all duration-300 hover:scale-[1.02] hover:gold-glow group"
              >
                <service.icon className="w-8 h-8 text-gold mb-4 stroke-[1.2] group-hover:text-gold-light transition-colors" />
                <h3 className="font-brand text-gold text-sm tracking-[0.15em] mb-2">
                  {service.title}
                </h3>
                <p className="font-script text-gold-light text-lg mb-4">{service.subtitle}</p>
                <p className="text-foreground/60 text-xs font-body leading-relaxed">
                  {service.description}
                </p>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <p className="font-elegant italic text-foreground/80 text-lg md:text-xl mb-8">
          Ready to elevate your event?
        </p>
        <a
          href="mailto:info@shamellentertainment.com"
          className="btn-outline-gold font-brand text-xs"
        >
          Inquire Now
        </a>
        <PearlDivider className="mt-12" />
      </section>

      <Footer />
    </div>
  );
}
