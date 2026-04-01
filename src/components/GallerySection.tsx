import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import gallery7 from "@/assets/gallery-7.jpg";
import gallery8 from "@/assets/gallery-8.jpg";

const images = [gallery1, gallery2, gallery3, gallery4, gallery5, gallery6, gallery7, gallery8];

const GallerySection = () => {
  return (
    <section id="gallery" className="bg-background py-16 px-4">
      <h2 className="font-brand text-gold text-center text-2xl md:text-3xl tracking-wider mb-3">
        Gallery
      </h2>
      <p className="text-foreground/60 text-sm text-center mb-10 font-body">
        A glimpse into past performances and private events.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
        {images.map((src, i) => (
          <div
            key={i}
            className="overflow-hidden group cursor-pointer"
          >
            <img
              src={src}
              alt={`Shamell performance ${i + 1}`}
              loading="lazy"
              width={512}
              height={512}
              className="w-full h-40 md:h-48 object-cover transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_15px_hsl(43_45%_56%/0.3)]"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default GallerySection;
