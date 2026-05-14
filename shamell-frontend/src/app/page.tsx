import AboutSection from "@/components/AboutSection";
import ExperiencesSection from "@/components/ExperiencesSection";
import Footer from "@/components/Footer";
import GallerySection from "@/components/GallerySection";
import HeroSection from "@/components/HeroSection";
import SiteHeader from "@/components/SiteHeader";
import ServicesSection from "@/components/ServicesSection";

/** Home: `#services` / `#experiences` blocks; then `#about` before `#gallery` (matches header nav). */
export default function Home() {
  return (
    <main className="relative z-10 min-h-screen text-foreground">
      <SiteHeader />
      <HeroSection />
      <ExperiencesSection />
      <ServicesSection />
      <AboutSection />
      <GallerySection />
      <Footer />
    </main>
  );
}
