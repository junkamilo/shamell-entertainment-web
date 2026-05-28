import AboutSection from "@/components/AboutSection";
import OnComingEventsPromoSection from "@/components/OnComingEventsPromoSection";
import ExperiencesSection from "@/components/ExperiencesSection";
import Footer from "@/components/Footer";
import GallerySection from "@/components/GallerySection";
import HeroSection from "@/components/HeroSection";
import SiteHeader from "@/components/SiteHeader";
import ServicesSection from "@/components/ServicesSection";
import UpcomingEventsSection from "@/components/UpcomingEventsSection";

/** Home: `#services` / `#experiences` blocks; then `#about` before `#gallery` (matches header nav). */
export default function Home() {
  return (
    <main className="relative z-10 min-h-screen text-foreground">
      <SiteHeader />
      <HeroSection />
      <ExperiencesSection />
      <ServicesSection />
      <UpcomingEventsSection />
      <AboutSection />
      <OnComingEventsPromoSection />
      <GallerySection />
      <Footer />
    </main>
  );
}
