import { X } from "lucide-react";

type Props = {
  isOpen: boolean;
  src: string | null;
  isVideo: boolean;
  onClose: () => void;
};

export default function ServicesFormLightbox({ isOpen, src, isVideo, onClose }: Props) {
  if (!isOpen || !src) return null;

  return (
    <div
      className="fixed inset-0 z-95 flex items-center justify-center bg-black/85 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl border border-gold/30 bg-[#0a0d12] p-3 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="shamell-glass-surface absolute right-3 top-3 z-10 rounded-full border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>
        {isVideo ? (
          <video src={src} className="max-h-[82vh] w-full rounded-xl object-contain" controls playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Vista ampliada" className="max-h-[82vh] w-full rounded-xl object-contain" />
        )}
      </div>
    </div>
  );
}
