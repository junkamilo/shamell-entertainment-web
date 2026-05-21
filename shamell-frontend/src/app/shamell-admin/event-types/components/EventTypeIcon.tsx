import {
  Briefcase,
  Cake,
  Crown,
  Flame,
  Heart,
  Music,
  Sparkles,
  Star,
} from "lucide-react";
import { iconIndexForTypeName } from "../lib/eventTypesDisplay";

type Props = {
  name: string;
  className?: string;
  strokeWidth?: number;
};

const iconProps = (className: string, strokeWidth: number) => ({
  className,
  strokeWidth,
});

export default function EventTypeIcon({
  name,
  className = "h-5 w-5 text-gold/90",
  strokeWidth = 1.4,
}: Props) {
  const props = iconProps(className, strokeWidth);
  switch (iconIndexForTypeName(name) % 8) {
    case 0:
      return <Sparkles {...props} />;
    case 1:
      return <Heart {...props} />;
    case 2:
      return <Briefcase {...props} />;
    case 3:
      return <Music {...props} />;
    case 4:
      return <Cake {...props} />;
    case 5:
      return <Crown {...props} />;
    case 6:
      return <Flame {...props} />;
    default:
      return <Star {...props} />;
  }
}
