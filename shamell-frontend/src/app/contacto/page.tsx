import Footer from "@/components/Footer";
import PearlDivider from "@/components/PearlDivider";
import SiteHeader from "@/components/SiteHeader";
import ContactInquiryForm from "@/components/ContactInquiryForm";

export default function ContactoPage() {
  return (
    <main className="bg-background min-h-screen pt-24 px-4 pb-16">
      <SiteHeader />
      <section className="max-w-4xl mx-auto py-12">
        <h1 className="font-brand text-gold text-3xl md:text-5xl tracking-[0.14em] mb-4 text-center">
          CONTACTO
        </h1>
        <p className="font-elegant text-foreground/80 text-lg text-center mb-10">
          Reach us for bookings, private galas, VIP events, and bespoke collaborations.
        </p>
        <ContactInquiryForm />
        <PearlDivider className="mt-12" />
      </section>
      <Footer />
    </main>
  );
}
