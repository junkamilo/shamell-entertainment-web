import AboutSection from "@/components/AboutSection";
import OnComingEventsPromoSection from "@/components/OnComingEventsPromoSection";
import ExperiencesSection from "@/components/ExperiencesSection";
import Footer from "@/components/Footer";
import GallerySection from "@/components/GallerySection";
import HeroSection from "@/components/HeroSection";
import SiteHeader from "@/components/SiteHeader";
import ServicesSection from "@/components/ServicesSection";
import { fetchPublicAbout } from "@/lib/fetchPublicAbout";
import { fetchPublicHeaderMedia } from "@/lib/fetchPublicHeaderMedia";
import { aboutHeroPreloadUrls } from "@/lib/aboutMediaPreload";
import { preload } from "react-dom";

/** Home: `#services` / `#experiences` blocks; then `#about` before `#gallery` (matches header nav). */
export default async function Home() {
  const [about, headerPhotos] = await Promise.all([
    fetchPublicAbout(),
    fetchPublicHeaderMedia(),
  ]);
  const { poster } = aboutHeroPreloadUrls(about);
  if (poster) {
    preload(poster, { as: "image", fetchPriority: "low" });
  }

  return (
    <main className="relative z-10 min-h-screen text-foreground">
      <SiteHeader />
      <HeroSection initialPhotos={headerPhotos} />
      <ExperiencesSection />
      <ServicesSection />
      <AboutSection initialAbout={about} />
      <OnComingEventsPromoSection />
      <GallerySection />
      <Footer />
    </main>
  );
}
