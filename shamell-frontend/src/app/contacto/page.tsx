import { Suspense } from "react";
import Footer from "@/components/Footer";
import PearlDivider from "@/components/PearlDivider";
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
    <main className="bg-background min-h-screen pt-24 px-4 pb-16">
      <SiteHeader />
      <section className="max-w-4xl mx-auto py-12">
        <Suspense fallback={<ContactFormFallback />}>
          <ContactInquiryGate />
        </Suspense>
        <PearlDivider className="mt-12" />
      </section>
      <Footer />
    </main>
  );
}
