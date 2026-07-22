import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { headerLibraryItemIsVideo } from "../lib/headerMediaUtils";
import type { HeaderPhoto } from "../types/headerMedia.types";

type Props = {
  photo: HeaderPhoto;
  className: string;
  style: CSSProperties;
};

export default function HeaderMediaLibraryMedia({ photo, className, style }: Props) {
  if (headerLibraryItemIsVideo(photo)) {
    return (
      <video
        src={photo.imageUrl}
        muted
        playsInline
        loop
        autoPlay
        className={cn("absolute inset-0 h-full w-full", className)}
        style={style}
      />
    );
  }
  return (
    <Image src={photo.imageUrl} alt="" fill unoptimized className={className} style={style} />
  );
}
