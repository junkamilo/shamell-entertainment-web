import GalleryGrid from "@/components/public/GalleryGrid";
import FlameIcon from "@/components/public/FlameIcon";
import PearlDivider from "@/components/public/PearlDivider";
import NavBar from "@/components/public/NavBar";
import Footer from "@/components/public/Footer";

export const metadata = {
  title: "Gallery — Shamell Entertainment",
  description: "A glimpse into past performances and private events by Shamell.",
};

export default function GaleriaPage() {
  return (
    <div className="bg-background min-h-screen">
      <NavBar />

      {/* Hero */}
      <section className="relative h-[30vh] flex flex-col items-center justify-center pt-14">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="relative z-10 flex flex-col items-center text-center px-4 fade-in-up">
          <FlameIcon className="w-10 h-14 mb-4" />
          <h1 className="font-brand text-gold text-3xl md:text-5xl tracking-[0.15em] mb-3">
            GALLERY
          </h1>
          <p className="font-elegant italic text-gold-light text-lg md:text-xl">
            A glimpse into past performances and private events.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <PearlDivider />
        </div>
      </section>

      <GalleryGrid />

      <Footer />
    </div>
  );
}
