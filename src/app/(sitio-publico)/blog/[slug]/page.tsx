import { notFound } from "next/navigation";
import Link from "next/link";
import FlameIcon from "@/components/public/FlameIcon";
import PearlDivider from "@/components/public/PearlDivider";
import OrnamentDivider from "@/components/public/OrnamentDivider";
import NavBar from "@/components/public/NavBar";
import Footer from "@/components/public/Footer";

// Static posts — replace with CMS/API fetch when ready
const posts: Record<string, { title: string; date: string; content: string }> = {
  "the-art-of-oriental-dance": {
    title: "The Art of Oriental Dance",
    date: "April 2025",
    content:
      "Oriental dance is one of the world's oldest and most expressive art forms. Rooted in centuries of tradition, it speaks a language beyond words — one of movement, emotion, and presence. Each performance by Shamell is a tribute to this heritage, fused with contemporary elegance.",
  },
  "how-to-plan-a-luxury-event": {
    title: "How to Plan a Luxury Event",
    date: "March 2025",
    content:
      "A truly luxurious event is defined not by its price tag, but by the quality of every detail. From the venue selection to the entertainment choices, each element should contribute to a cohesive, immersive experience that leaves your guests speechless.",
  },
};

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const post = posts[params.slug];
  if (!post) return {};
  return {
    title: `${post.title} — Shamell Entertainment`,
  };
}

export default function BlogPostPage({ params }: PageProps) {
  const post = posts[params.slug];
  if (!post) notFound();

  return (
    <div className="bg-background min-h-screen">
      <NavBar />

      <article className="pt-28 pb-20 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-12 fade-in-up">
          <FlameIcon className="w-8 h-12 mb-4 mx-auto" />
          <p className="text-foreground/40 text-xs font-body tracking-widest mb-4 uppercase">
            {post.date}
          </p>
          <h1 className="font-brand text-gold text-2xl md:text-4xl tracking-[0.1em] mb-6">
            {post.title}
          </h1>
          <OrnamentDivider />
        </div>

        <p className="text-foreground/80 font-body text-sm md:text-base leading-relaxed">
          {post.content}
        </p>

        <PearlDivider className="mt-16" />

        <div className="text-center mt-8">
          <Link
            href="/blog"
            className="text-gold text-xs font-brand tracking-widest hover:text-gold-light transition-colors"
          >
            ← Back to Journal
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  );
}
