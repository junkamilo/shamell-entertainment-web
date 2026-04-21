import FlameIcon from "@/components/public/FlameIcon";
import PearlDivider from "@/components/public/PearlDivider";
import OrnamentDivider from "@/components/public/OrnamentDivider";
import NavBar from "@/components/public/NavBar";
import Footer from "@/components/public/Footer";
import BlogPostCard from "@/components/public/BlogPostCard";

export const metadata = {
  title: "Blog — Shamell Entertainment",
  description: "Insights, stories, and inspirations from Shamell Entertainment.",
};

// Static placeholder until CMS/API is connected
const posts = [
  {
    slug: "the-art-of-oriental-dance",
    title: "The Art of Oriental Dance",
    excerpt:
      "Exploring the rich cultural heritage and refined technique behind every performance.",
    date: "April 2025",
  },
  {
    slug: "how-to-plan-a-luxury-event",
    title: "How to Plan a Luxury Event",
    excerpt:
      "Key considerations for crafting an unforgettable high-end experience your guests will treasure.",
    date: "March 2025",
  },
];

export default function BlogPage() {
  return (
    <div className="bg-background min-h-screen">
      <NavBar />

      {/* Hero */}
      <section className="relative h-[30vh] flex flex-col items-center justify-center pt-14">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="relative z-10 flex flex-col items-center text-center px-4 fade-in-up">
          <FlameIcon className="w-10 h-14 mb-4" />
          <h1 className="font-brand text-gold text-3xl md:text-5xl tracking-[0.15em] mb-3">
            JOURNAL
          </h1>
          <p className="font-elegant italic text-gold-light text-lg md:text-xl">
            Insights, stories, and inspirations.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <PearlDivider />
        </div>
      </section>

      {/* Posts */}
      <section className="py-16 px-4">
        <OrnamentDivider />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} {...post} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
