import AboutSection from "@/components/AboutSection";
import ExperiencesSection from "@/components/ExperiencesSection";
import Footer from "@/components/Footer";
import GallerySection from "@/components/GallerySection";
import HeroSection from "@/components/HeroSection";
import ShamellHomeAtmosphere from "@/components/ShamellHomeAtmosphere";
import SiteHeader from "@/components/SiteHeader";
import ServicesSection from "@/components/ServicesSection";

export default function Home() {
  return (
    <main className="shamell-home relative min-h-screen text-foreground">
      <ShamellHomeAtmosphere />
      <div className="relative z-10">
        <SiteHeader />
        <HeroSection />
        <ExperiencesSection />
        <ServicesSection />
        <GallerySection />
        <AboutSection />
        <Footer />
      </div>
    </main>
  );
}
