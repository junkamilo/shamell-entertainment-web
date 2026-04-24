import Footer from "@/components/Footer";
import PearlDivider from "@/components/PearlDivider";
import SiteHeader from "@/components/SiteHeader";

export default function BlogPage() {
  return (
    <main className="bg-background min-h-screen pt-24 px-4">
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
