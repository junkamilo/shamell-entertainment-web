import Image from "next/image";
import heroBg from "@/assets/hero-bg.jpg";
import FlameIcon from "./FlameIcon";
import PearlDivider from "./PearlDivider";


const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background image with Ken Burns */}
      <div className="absolute inset-0">
        <Image
          src={heroBg}
          alt="Shamell - Exclusive belly dance performer at sunset"
          className="w-full h-full object-cover hero-zoom"
          width={1920}
          height={1280}
          priority
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-linear-to-b from-background/80 via-transparent to-background" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-20">
        <FlameIcon className="w-10 h-14 mb-4" />
        <h1 className="font-brand text-gold text-4xl md:text-6xl lg:text-7xl tracking-[0.25em] mb-3">
          SHAMELL
        </h1>
        <p className="font-elegant italic text-gold-light text-lg md:text-xl tracking-wide mb-10">
          Exclusive Performance Artistry
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="/contacto" className="btn-outline-gold font-brand text-xs">
            Inquire
          </a>
        </div>
      </div>

      <div className="absolute bottom-32 left-1/2 z-10 w-full max-w-[320px] -translate-x-1/2 px-4 text-center">
        <p className="font-script text-gold text-3xl leading-tight">
          Dance is the hidden language of the soul.
          <span className="inline-block w-2 h-2 rounded-full bg-gold-light ml-2 align-middle" />
        </p>
      </div>

      {/* Pearl divider at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <PearlDivider />
      </div>
    </section>
  );
};

export default HeroSection;
