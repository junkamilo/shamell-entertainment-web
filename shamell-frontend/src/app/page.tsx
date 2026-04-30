import AboutSection from "@/components/AboutSection";
import ExperiencesSection from "@/components/ExperiencesSection";
import Footer from "@/components/Footer";
import GallerySection from "@/components/GallerySection";
import HeroSection from "@/components/HeroSection";
import SiteHeader from "@/components/SiteHeader";
import ServicesSection from "@/components/ServicesSection";

export default function Home() {
  return (
    <main className="bg-background min-h-screen">
      <SiteHeader />
      <HeroSection />
      <ExperiencesSection />
      <ServicesSection />
      <GallerySection />
      <AboutSection />
      <Footer />
    </main>
  );
}
