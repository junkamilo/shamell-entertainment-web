import Link from "next/link";

interface BlogPostCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  coverImage?: string;
}

const BlogPostCard = ({
  slug,
  title,
  excerpt,
  date,
  coverImage,
}: BlogPostCardProps) => {
  return (
    <article className="border border-gold/20 p-6 transition-all duration-300 hover:gold-glow hover:scale-[1.01]">
      {coverImage && (
        <div className="overflow-hidden mb-4">
          <img
            src={coverImage}
            alt={title}
            loading="lazy"
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      <p className="text-foreground/40 text-xs font-body tracking-widest mb-2 uppercase">
        {date}
      </p>
      <h3 className="font-brand text-gold text-sm tracking-[0.12em] mb-3">{title}</h3>
      <p className="text-foreground/70 text-xs font-body leading-relaxed mb-4">{excerpt}</p>
      <Link
        href={`/blog/${slug}`}
        className="text-gold text-xs font-brand tracking-widest hover:text-gold-light transition-colors"
      >
        Read More →
      </Link>
    </article>
  );
};

export default BlogPostCard;
