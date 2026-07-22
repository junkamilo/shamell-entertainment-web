import { Video } from "lucide-react";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { cn } from "@/lib/utils";

type Props = {
  imageUrl: string | null;
  size: "sm" | "md";
};

export default function ServiceListMediaThumb({ imageUrl, size }: Props) {
  const dim = size === "sm" ? "h-11 w-11" : "h-14 w-14";
  const iconClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div
      className={cn(
        "shamell-glass-surface flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold/20",
        dim,
      )}
    >
      {!imageUrl ? (
        <span className="text-[10px] text-foreground/35">—</span>
      ) : serviceCatalogMediaTypeFromUrl(imageUrl) === "VIDEO" ? (
        <span className="flex h-full w-full items-center justify-center bg-black/35" title="Video">
          <Video className={cn("text-gold/90", iconClass)} strokeWidth={1.45} aria-hidden />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}
