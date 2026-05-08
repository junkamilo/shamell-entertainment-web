import Footer from "@/components/Footer";
import PearlDivider from "@/components/PearlDivider";
import SiteHeader from "@/components/SiteHeader";

export default function BlogPage() {
  return (
    <main className="relative z-10 min-h-screen px-4 pt-24 text-foreground">
      <SiteHeader />
      <section className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="font-brand text-gold text-3xl md:text-5xl tracking-[0.14em] mb-6">BLOG</h1>
        <p className="font-elegant text-foreground/80 text-lg">
          Stories, inspiration, and behind-the-scenes moments from Shamell.
        </p>
        <PearlDivider className="mt-10" />
      </section>
      <Footer />
    </main>
  );
}
