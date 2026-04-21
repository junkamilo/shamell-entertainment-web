import FlameIcon from "@/components/public/FlameIcon";
import PearlDivider from "@/components/public/PearlDivider";
import OrnamentDivider from "@/components/public/OrnamentDivider";
import NavBar from "@/components/public/NavBar";
import Footer from "@/components/public/Footer";

export const metadata = {
  title: "Contact — Shamell Entertainment",
  description: "Inquire for private and exclusive performances by Shamell.",
};

export default function ContactoPage() {
  return (
    <div className="bg-background min-h-screen">
      <NavBar />

      {/* Hero */}
      <section className="relative h-[35vh] flex flex-col items-center justify-center pt-14">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="relative z-10 flex flex-col items-center text-center px-4 fade-in-up">
          <FlameIcon className="w-10 h-14 mb-4" />
          <h1 className="font-brand text-gold text-3xl md:text-5xl tracking-[0.15em] mb-3">
            INQUIRE
          </h1>
          <p className="font-elegant italic text-gold-light text-lg md:text-xl">
            Let's create something extraordinary together.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <PearlDivider />
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 max-w-2xl mx-auto text-center">
        <OrnamentDivider />
        <p className="font-elegant italic text-foreground/80 text-lg md:text-xl my-8">
          For bookings, collaborations, and private inquiries, reach out directly.
        </p>
        <a
          href="mailto:info@shamellentertainment.com"
          className="btn-outline-gold font-brand text-xs"
        >
          info@shamellentertainment.com
        </a>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="border border-gold/20 p-6">
            <h3 className="font-brand text-gold text-xs tracking-[0.2em] mb-3">
              RESPONSE TIME
            </h3>
            <p className="text-foreground/60 text-xs font-body leading-relaxed">
              All inquiries are responded to within 48 hours. For urgent requests, please
              indicate in your message.
            </p>
          </div>
          <div className="border border-gold/20 p-6">
            <h3 className="font-brand text-gold text-xs tracking-[0.2em] mb-3">
              BOOKING NOTICE
            </h3>
            <p className="text-foreground/60 text-xs font-body leading-relaxed">
              Shamell books exclusively for private, VIP, and select public events.
              A minimum 2-week notice is required for most bookings.
            </p>
          </div>
        </div>

        <PearlDivider className="mt-16" />
      </section>

      <Footer />
    </div>
  );
}
