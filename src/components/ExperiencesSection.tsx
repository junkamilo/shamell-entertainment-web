import experienceFire from "@/assets/experience-fire.jpg";
import experienceVeil from "@/assets/experience-veil.jpg";
import experienceSword from "@/assets/experience-sword.jpg";
import OrnamentDivider from "./OrnamentDivider";

const experiences = [
  {
    image: experienceFire,
    title: "Fire Performance",
    description: "A bold, high-impact experience that commands attention.",
  },
  {
    image: experienceVeil,
    title: "Veil & Fan Dance",
    description: "Graceful movement layered with visual poetry.",
  },
  {
    image: experienceSword,
    title: "Sword & Candelabra",
    description: "Timeless ceremonial artistry with refined precision.",
  },
];

const ExperiencesSection = () => {
  return (
    <section className="bg-background py-16 px-4">
      <OrnamentDivider />

      <h2 className="font-brand text-gold text-center text-sm md:text-base tracking-[0.3em] mb-12">
        SIGNATURE EXPERIENCES
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {experiences.map((exp) => (
          <div key={exp.title} className="group">
            <div className="overflow-hidden mb-4">
              <img
                src={exp.image}
                alt={exp.title}
                loading="lazy"
                width={640}
                height={800}
                className="w-full h-64 md:h-72 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <h3 className="font-brand text-gold text-sm tracking-wider text-center mb-2">
              {exp.title}
            </h3>
            <p className="text-foreground/60 text-xs text-center font-body leading-relaxed max-w-xs mx-auto">
              {exp.description}
            </p>
          </div>
        ))}
      </div>

      <OrnamentDivider className="mt-12" />
    </section>
  );
};

export default ExperiencesSection;
