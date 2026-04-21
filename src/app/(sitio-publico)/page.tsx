import Hero from "@/components/public/Hero";
import ServiceCard from "@/components/public/ServiceCard";
import ExperienceCard from "@/components/public/ExperienceCard";
import GalleryGrid from "@/components/public/GalleryGrid";
import AboutSection from "@/components/public/AboutSection";
import ContactForm from "@/components/public/ContactForm";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <main className="bg-background min-h-screen">
      <Hero />
      <ServiceCard />
      <ExperienceCard />
      <GalleryGrid />
      <AboutSection />
      <ContactForm />
      <Footer />
    </main>
  );
}
