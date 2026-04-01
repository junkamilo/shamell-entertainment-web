import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import ExperiencesSection from "@/components/ExperiencesSection";
import GallerySection from "@/components/GallerySection";
import AboutSection from "@/components/AboutSection";
import InquireSection from "@/components/InquireSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="bg-background min-h-screen">
      <HeroSection />
      <ServicesSection />
      <ExperiencesSection />
      <GallerySection />
      <AboutSection />
      <InquireSection />
      <Footer />
    </main>
  );
};

export default Index;
