import AboutSection from "@/components/AboutSection";
import OnComingEventsPromoSection from "@/components/OnComingEventsPromoSection";
import ExperiencesSection from "@/components/ExperiencesSection";
import Footer from "@/components/Footer";
import GallerySection from "@/components/GallerySection";
import HeroSection from "@/components/HeroSection";
import SiteHeader from "@/components/SiteHeader";
import ServicesSection from "@/components/ServicesSection";
import { fetchHomeAboveFold } from "@/lib/fetchHomeAboveFold";
import { aboutHeroPreloadUrls } from "@/lib/aboutMediaPreload";
import { heroLcpPreload } from "@/lib/heroMediaPreload";
import { preload } from "react-dom";

/** Home: `#services` / `#experiences` blocks; then `#about` before `#gallery` (matches header nav). */
export default async function Home() {
  const { about, headerPhotos, headerText, onComingSettings } =
    await fetchHomeAboveFold();
  const heroPreload = heroLcpPreload(headerPhotos[0]);
  if (heroPreload) {
    preload(heroPreload.href, heroPreload.options);
  }
  const { poster } = aboutHeroPreloadUrls(about);
  if (poster) {
    preload(poster, { as: "image", fetchPriority: "low" });
  }

  return (
    <main className="relative z-10 min-h-screen text-foreground">
      <SiteHeader />
      <HeroSection initialPhotos={headerPhotos} initialHeaderText={headerText} />
      <ExperiencesSection />
      <ServicesSection />
      <AboutSection initialAbout={about} />
      <OnComingEventsPromoSection initialSettings={onComingSettings} />
      <GallerySection />
      <Footer />
    </main>
  );
}
