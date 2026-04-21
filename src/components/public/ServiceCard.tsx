import { Flame, MonitorPlay, Compass } from "lucide-react";
import Link from "next/link";

const services = [
  {
    icon: Flame,
    title: "Private Galas",
    subtitle: "Bold and unforgettable",
    path: "/servicios/private-galas",
  },
  {
    icon: MonitorPlay,
    title: "VIP Events",
    subtitle: "Grace in motion",
    path: "/servicios/vip-events",
  },
  {
    icon: Compass,
    title: "Bespoke Collaborations",
    subtitle: "Timeless ceremonial artistry",
    path: "/servicios/bespoke-collaborations",
  },
];

const ServiceCard = () => {
  return (
    <section className="bg-background py-20 px-4">
      {/* Quote */}
      <p className="font-script text-gold text-3xl md:text-4xl lg:text-5xl text-center mb-16">
        Dance is the hidden language of the soul.
        <span className="inline-block w-2 h-2 rounded-full bg-gold-light ml-2 align-middle" />
      </p>

      {/* Service Cards */}
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-0 max-w-4xl mx-auto">
        {services.map((service, i) => (
          <div key={service.title} className="flex items-stretch">
            <Link
              href={service.path}
              className="flex flex-col items-center text-center px-8 md:px-10 py-8 border border-gold/30 flex-1 min-w-[200px] cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:gold-glow group"
            >
              <service.icon className="w-8 h-8 text-gold mb-4 stroke-[1.2] transition-colors group-hover:text-gold-light" />
              <h3 className="font-brand text-gold text-sm tracking-[0.15em] mb-2">
                {service.title}
              </h3>
              <p className="text-foreground/70 text-xs font-body tracking-wide">
                {service.subtitle}
              </p>
            </Link>
            {i < services.length - 1 && (
              <div className="hidden md:flex flex-col items-center justify-center gap-1 px-0">
                {Array.from({ length: 8 }, (_, j) => (
                  <div key={j} className="w-1 h-1 rounded-full bg-gold/40" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServiceCard;
