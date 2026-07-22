import { Suspense } from "react";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";
import ContactInquiryGate from "./ContactInquiryGate";
import ContactFormFallback from "./ContactFormFallback";

export default function ContactoPage() {
  return (
    <main className="relative z-10 min-h-screen text-foreground">
      <SiteHeader />
      <section className="mx-auto min-h-[calc(100svh-5.5rem)] w-full max-w-6xl px-4 pt-24 pb-12 sm:px-6 md:max-w-7xl lg:px-8 xl:max-w-360 2xl:max-w-400">
        <Suspense fallback={<ContactFormFallback />}>
          <ContactInquiryGate />
        </Suspense>
      </section>
      <Footer />
    </main>
  );
}
