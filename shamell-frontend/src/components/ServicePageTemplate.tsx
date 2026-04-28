import Link from "next/link";
import FlameIcon from "./FlameIcon";
import PearlDivider from "./PearlDivider";
import OrnamentDivider from "./OrnamentDivider";
import Footer from "./Footer";
import type { LucideIcon } from "lucide-react";

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ServicePageProps {
  title: string;
  tagline: string;
  description: string;
  features: FeatureCard[];
}

const ServiceNavBar = ({ currentTitle }: { currentTitle: string }) => {
  const navLinks = [
    { label: "Private Galas", path: "/private-galas" },
    { label: "VIP Events", path: "/vip-events" },
    { label: "Bespoke Collaborations", path: "/bespoke-collaborations" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-gold/10">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 group">
          <FlameIcon className="w-5 h-7" />
          <span className="font-brand text-gold text-xs tracking-[0.2em] hidden sm:inline">SHAMELL</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`font-brand text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] transition-colors px-1 sm:px-2 py-1 ${
                link.label === currentTitle
                  ? "text-gold"
                  : "text-foreground/50 hover:text-gold"
              }`}
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

const ServicePageTemplate = ({ title, tagline, description, features }: ServicePageProps) => {
  return (
    <div className="bg-background min-h-screen">
      <ServiceNavBar currentTitle={title} />

      {/* Hero Banner */}
      <section className="relative h-[40vh] flex flex-col items-center justify-center pt-14">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="relative z-10 flex flex-col items-center text-center px-4 fade-in-up">
          <FlameIcon className="w-10 h-14 mb-4" />
          <h1 className="font-brand text-gold text-3xl md:text-5xl tracking-[0.15em] mb-3">
            {title.toUpperCase()}
          </h1>
          <p className="font-script text-gold-light text-xl md:text-2xl">
            {tagline}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <PearlDivider />
        </div>
      </section>

      {/* Description */}
      <section className="py-16 px-4">
        <div className="max-w-[750px] mx-auto text-center fade-in-up">
          <p className="text-foreground/80 font-body text-sm md:text-base leading-relaxed tracking-wide">
            {description}
          </p>
        </div>
        <OrnamentDivider className="mt-10" />
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <h2 className="font-brand text-gold text-sm md:text-base tracking-[0.2em] text-center mb-12 fade-in-up">
          WHAT TO EXPECT
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center px-6 py-8 border border-gold/30 transition-all duration-300 hover:gold-glow hover:scale-[1.03] fade-in-up"
            >
              <feature.icon className="w-7 h-7 text-gold mb-4 stroke-[1.2]" />
              <h3 className="font-brand text-gold text-xs tracking-[0.15em] mb-2">
                {feature.title}
              </h3>
              <p className="text-foreground/70 text-xs font-body tracking-wide leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center fade-in-up">
        <p className="font-script text-gold text-2xl md:text-3xl mb-8">
          Ready to create an unforgettable experience?
        </p>
        <a href="mailto:info@shamellentertainment.com" className="btn-outline-gold font-brand">
          Inquire Now
        </a>
        <PearlDivider className="mt-16" />
      </section>

      <Footer />
    </div>
  );
};

export default ServicePageTemplate;
