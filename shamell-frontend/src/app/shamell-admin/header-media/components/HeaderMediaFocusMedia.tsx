import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  isVideo: boolean;
  objectPosition: string;
  className: string;
};

export default function HeaderMediaFocusMedia({ url, isVideo, objectPosition, className }: Props) {
  if (isVideo) {
    return (
      <video
        src={url}
        muted
        playsInline
        loop
        autoPlay
        className={cn("absolute inset-0 h-full w-full", className)}
        style={{ objectPosition }}
      />
    );
  }
  return (
    <Image
      src={url}
      alt=""
      fill
      unoptimized
      className={className}
      style={{ objectPosition }}
    />
  );
}
