import Image from "next/image";
import portrait from "@/assets/gallery-2.jpg";
import OrnamentDivider from "./OrnamentDivider";

const AboutSection = () => {
  const values = [
    "Professionalism",
    "Excellence",
    "Authenticity",
    "Emotional Connection",
    "Luxury",
  ];

  return (
    <section id="about" className="bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-brand text-gold text-center text-2xl md:text-4xl tracking-[0.16em] mb-3">
          ABOUT SHAMELL
        </h2>
        <p className="font-script text-gold-light text-center text-2xl mb-12">
          Artistry rooted in elegance and intention
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 border border-gold/30 overflow-hidden">
            <Image
              src={portrait}
              alt="Professional portrait of Shamell"
              className="w-full h-full object-cover min-h-[420px]"
              priority={false}
            />
          </div>

          <div className="lg:col-span-3">
            <p className="text-foreground/85 text-base md:text-lg font-body leading-relaxed mb-5">
              Shamell is a professional Oriental dance artist specializing in luxury performances
              for private galas, elite social events, and bespoke collaborations. Her work blends
              cultural depth, technical precision, and visual sophistication to create memorable
              experiences for discerning audiences.
            </p>
            <p className="text-foreground/75 text-sm md:text-base font-body leading-relaxed mb-8">
              With a refined creative process and client-first approach, every performance is
              adapted to the atmosphere, audience, and purpose of the occasion. From intimate
              celebrations to large productions, Shamell delivers presence, artistry, and impact.
            </p>

            <h3 className="font-brand text-gold text-xs tracking-[0.18em] mb-3">CORE VALUES</h3>
            <div className="flex flex-wrap gap-2 mb-8">
              {values.map((value) => (
                <span
                  key={value}
                  className="border border-gold/40 px-3 py-1 text-xs font-brand tracking-[0.12em] text-gold"
                >
                  {value.toUpperCase()}
                </span>
              ))}
            </div>

          </div>
        </div>

        <OrnamentDivider className="mt-10" />
      </div>
    </section>
  );
};

export default AboutSection;
