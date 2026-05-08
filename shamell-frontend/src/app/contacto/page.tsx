import { Suspense } from "react";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";
import ContactInquiryGate from "@/components/ContactInquiryGate";

function ContactFormFallback() {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center text-foreground/60 text-sm font-body">
      Loading form…
    </div>
  );
}

export default function ContactoPage() {
  return (
    <main className="relative z-10 min-h-screen text-foreground">
      <SiteHeader />
      <section className="mx-auto min-h-[calc(100svh-5.5rem)] w-full max-w-4xl px-4 pt-24 pb-12">
        <Suspense fallback={<ContactFormFallback />}>
          <ContactInquiryGate />
        </Suspense>
      </section>
      <Footer />
    </main>
  );
}
