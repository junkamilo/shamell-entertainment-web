import PearlDivider from "./PearlDivider";
import ContactInquiryForm from "./ContactInquiryForm";

const InquireSection = () => {
  return (
    <section id="contacto" className="bg-background py-16 px-4">
      <p className="font-elegant italic text-foreground/80 text-lg md:text-xl mb-10 text-center max-w-xl mx-auto">
        Inquire for private and exclusive performances.
      </p>
      <ContactInquiryForm />
      <PearlDivider className="mt-12" />
    </section>
  );
};

export default InquireSection;
