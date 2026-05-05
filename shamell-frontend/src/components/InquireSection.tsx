import Link from "next/link";
import PearlDivider from "./PearlDivider";

const InquireSection = () => {
  return (
    <section id="contacto" className="bg-background py-16 px-4">
      <p className="font-elegant italic text-foreground/80 text-lg md:text-xl mb-10 text-center max-w-xl mx-auto">
        Inquire for private and exclusive performances.
      </p>
      <div className="mx-auto max-w-md text-center">
        <Link
          href="/contacto?entry=inquire_section"
          className="inline-flex min-h-12 w-full items-center justify-center border border-gold/40 bg-black/30 px-6 py-3 font-brand text-xs tracking-[0.18em] text-gold uppercase transition-colors hover:border-gold hover:bg-gold/10 sm:w-auto sm:min-w-[14rem]"
        >
          Start booking inquiry
        </Link>
        <p className="mt-4 text-xs text-foreground/50 font-body">
          Step-by-step form on the contact page — same experience from any entry point.
        </p>
      </div>
      <PearlDivider className="mt-12" />
    </section>
  );
};

export default InquireSection;
