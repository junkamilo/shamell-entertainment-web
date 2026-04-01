import PearlDivider from "./PearlDivider";

const InquireSection = () => {
  return (
    <section id="inquire" className="bg-background py-16 px-4 text-center">
      <p className="font-elegant italic text-foreground/80 text-lg md:text-xl mb-8">
        Inquire for private and exclusive performances.
      </p>
      <a
        href="mailto:info@shamellentertainment.com"
        className="btn-outline-gold font-brand text-xs"
      >
        Inquire
      </a>
      <PearlDivider className="mt-12" />
    </section>
  );
};

export default InquireSection;
