import AboutSection from "@/components/home/AboutSection";
import OnComingEventsPromoSection from "@/components/home/OnComingEventsPromoSection";
import ExperiencesSection from "@/components/home/ExperiencesSection";
import { Footer, SiteHeader } from "@/components/shared";
import GallerySection from "@/components/home/GallerySection";
import HeroSection from "@/components/home/HeroSection";
import ServicesSection from "@/components/home/ServicesSection";
import { fetchHomeAboveFold } from "@/lib/home/fetchHomeAboveFold";
import { aboutHeroPreloadUrls } from "@/lib/hero/aboutMediaPreload";
import { heroLcpPreload } from "@/lib/hero/heroMediaPreload";
import { preload } from "react-dom";

/** Home: `#services` / `#experiences` blocks; then `#about` before `#gallery` (matches header nav). */
export default async function Home() {
  const { about, headerPhotos, headerText, onComingSettings, upcomingEvents } =
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
      <OnComingEventsPromoSection
        initialSettings={onComingSettings}
        initialEvents={upcomingEvents}
      />
      <GallerySection />
      <Footer />
    </main>
  );
}
