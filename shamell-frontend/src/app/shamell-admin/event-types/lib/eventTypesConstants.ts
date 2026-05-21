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

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const NAME_REGEX = /^[A-Za-zÀ-ÿ\s&-]+$/;

export const TYPE_ICONS = [Sparkles, Heart, Briefcase, Music, Cake, Crown, Flame, Star] as const;
